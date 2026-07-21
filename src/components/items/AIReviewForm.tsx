'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ItemForm } from './ItemForm';
import { extractReceipt, type ExtractionResult } from '@/lib/supabase/extract-receipt';

// ─── Field-by-field skeleton ──────────────────────────────────────────────────
// Mimics the ItemForm layout so the user reads "we're reading your receipt,"
// not "something is loading." (design doc §7)

const SKELETON_FIELDS = [
  { label: 'Type', input: 'h-9 w-full' },
  { label: 'Name', input: 'h-9 w-full' },
  { label: 'Merchant', input: 'h-9 w-full' },
  { label: 'Amount', input: 'h-9 w-24' },
  { label: 'Category', input: 'h-9 w-full' },
  { label: 'Purchase date', input: 'h-9 w-40' },
  { label: 'Notes', input: 'h-20 w-full' },
];

// ─── Staggered skeleton wrapper ───────────────────────────────────────────────
// Reveals skeleton rows one by one for a "filling in" effect

function StaggeredSkeleton() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= SKELETON_FIELDS.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-lg" aria-label="Reading your receipt">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Reading your receipt…
      </p>
      {SKELETON_FIELDS.slice(0, visibleCount).map((field) => (
        <div key={field.label} className="space-y-2 animate-in fade-in duration-300">
          <Skeleton className="h-4 w-16" />
          <Skeleton className={`h-9 w-full rounded-md animate-pulse`} />
        </div>
      ))}
    </div>
  );
}

// ─── AIReviewForm ─────────────────────────────────────────────────────────────

interface AIReviewFormProps {
  file: File;
  imagePreviewUrl: string;
  onStartOver: () => void;
}

/**
 * Wraps ItemForm with the AI extraction pipeline:
 * - Shows staggered field-by-field skeleton while extracting
 * - Pre-fills ItemForm with extracted data once done
 * - Warranty months is ALWAYS empty (hard rule from §7)
 * - Shows confidence_note if non-empty
 * - Has "Start over" to clear AI data
 * - On error: shows the error and falls back to blank ItemForm
 */
export function AIReviewForm({ file, imagePreviewUrl, onStartOver }: AIReviewFormProps) {
  const [state, setState] = useState<
    | { phase: 'loading' }
    | { phase: 'done'; result: ExtractionResult; itemId: string; storagePath: string }
    | { phase: 'error'; message: string }
  >({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { itemId, storagePath, extraction } = await extractReceipt(file);
        if (!cancelled) {
          setState({ phase: 'done', result: extraction, itemId, storagePath });
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Could not read this image — try a clearer photo or enter details manually.';
        setState({ phase: 'error', message });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [file]);

  // ── Loading state: field-by-field skeleton ──
  if (state.phase === 'loading') {
    return (
      <div className="space-y-4">
        {imagePreviewUrl && (
          <div className="flex justify-center">
            <img
              src={imagePreviewUrl}
              alt="Receipt preview"
              className="max-h-48 rounded-lg border border-border object-contain"
            />
          </div>
        )}
        <StaggeredSkeleton />
      </div>
    );
  }

  // ── Error state: message + blank form ──
  if (state.phase === 'error') {
    return (
      <div className="space-y-4">
        {imagePreviewUrl && (
          <div className="flex justify-center">
            <img
              src={imagePreviewUrl}
              alt="Receipt preview"
              className="max-h-48 rounded-lg border border-border object-contain"
            />
          </div>
        )}

        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>

        <div className="border-t border-border pt-6">
          <ItemForm />
        </div>
      </div>
    );
  }

  // ── Done: pre-filled form with AI data ──
  const { result, itemId, storagePath } = state;

  // Map extraction result to ItemForm defaultValues
  // HARD RULE: warranty_months is ALWAYS null from AI (§7)
  const aiDefaultValues = {
    type: (result.suggested_type || 'purchase') as 'purchase' | 'subscription' | 'bill',
    name: result.name || '',
    merchant: result.merchant || '',
    amount: result.amount ?? null,
    currency: result.currency || 'USD',
    category: (result.suggested_category || 'other').toLowerCase(),
    notes: '',
    purchase_date: result.purchase_date || null,
    warranty_months: null, // NEVER pre-filled by AI
    billing_cycle: null,
    next_billing_date: null,
    id: itemId,
  };

  return (
    <div className="space-y-4">
      {imagePreviewUrl && (
        <div className="flex justify-center">
          <img
            src={imagePreviewUrl}
            alt="Receipt preview"
            className="max-h-48 rounded-lg border border-border object-contain"
          />
        </div>
      )}

      {/* Confidence note from AI */}
      {result.confidence_note && (
        <Alert>
          <AlertDescription className="text-muted-foreground">
            AI noted: {result.confidence_note}
          </AlertDescription>
        </Alert>
      )}

      {/* Start over button */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onStartOver} className="text-muted-foreground">
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Start over
        </Button>
      </div>

      <div className="border-t border-border pt-6">
        <ItemForm
          defaultValues={aiDefaultValues}
          receiptImagePath={storagePath}
          aiExtracted={result}
        />
      </div>
    </div>
  );
}