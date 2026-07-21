/**
 * Kept — Client-side AI Receipt Extraction Pipeline (§6, §7)
 *
 * Orchestrates: HEIC conversion → image compression → Storage upload → Edge Function invoke.
 * The itemId is generated client-side (crypto.randomUUID()) so the storage path and the
 * eventual DB row share the same ID (§6).
 */

import { supabase } from './client';
import { convertHeicToJpeg, compressImage } from '@/lib/image-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractionResult {
  name: string;
  merchant: string;
  amount: number | null;
  currency: string | null;
  purchase_date: string | null;
  suggested_category: string | null;
  suggested_type: 'purchase' | 'subscription' | 'bill' | null;
  warranty_months: number | null;
  confidence_note: string;
}

export interface ExtractReceiptReturn {
  itemId: string;
  storagePath: string;
  extraction: ExtractionResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the storage path: {userId}/{itemId}/{timestamp}-{filename} */
function buildStoragePath(userId: string, itemId: string, file: File): string {
  const timestamp = Date.now();
  // Sanitize filename — strip any path components
  const safeName = file.name.replace(/[/\\]/g, '_');
  return `${userId}/${itemId}/${timestamp}-${safeName}`;
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────

/**
 * Full receipt extraction pipeline:
 * 1. Convert HEIC → JPEG if needed
 * 2. Compress the image
 * 3. Upload to Supabase Storage
 * 4. Invoke the extract-receipt Edge Function
 * 5. Return the extraction result
 */
export async function extractReceipt(file: File): Promise<ExtractReceiptReturn> {
  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const itemId = crypto.randomUUID();

  // Step 1: HEIC conversion
  let processed = await convertHeicToJpeg(file);

  // Step 2: Compress
  processed = await compressImage(processed);

  // Step 3: Upload to Storage
  const storagePath = buildStoragePath(user.id, itemId, processed);
  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(storagePath, processed, {
      contentType: processed.type || 'image/jpeg',
      cacheControl: '31536000', // 1 year — receipts don't change
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Step 4: Invoke Edge Function
  const { data: fnData, error: fnError } = await supabase.functions.invoke(
    'extract-receipt',
    { body: { storagePath } },
  );

  if (fnError) {
    // Clean up the uploaded image on extraction failure
    await supabase.storage.from('receipts').remove([storagePath]).catch(() => {});
    throw fnError;
  }

  // Edge function may return an error object with an error field
  if (fnData && typeof fnData === 'object' && 'error' in fnData && fnData.error) {
    // Clean up the uploaded image on extraction failure
    await supabase.storage.from('receipts').remove([storagePath]).catch(() => {});
    throw new Error(fnData.error);
  }

  // Step 5: Return the combined result
  return {
    itemId,
    storagePath,
    extraction: fnData as ExtractionResult,
  };
}