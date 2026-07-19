---
Task ID: 5
Agent: Phase 5 AI Receipt Extraction Agent
Task: Phase 5 — AI Receipt Extraction Pipeline

Work Log:
- Read all context files: worklog.md (Tasks 0-4), kept-master-architecture.md (§7 AI Receipt Extraction Pipeline, §6 Storage Architecture, §11 Auth, §9.2), kept-design-system.md (§7 Component Patterns: field-by-field skeleton, §8 Copy Voice), supabase/client.ts (types), ItemForm.tsx (existing form), items/new/page.tsx (existing scan tab)
- Identified that gemini-3.5-flash from the architecture doc should be gemini-2.0-flash per task instructions (current stable model)
- `browser-image-compression` and `heic2any` already in package.json from Phase 0

### 1. supabase/functions/extract-receipt/index.ts (REPLACED stub)
- Full Deno Edge Function with Deno.serve handler
- Step 1: Auth verification — extracts Authorization header, creates Supabase client with forwarded JWT, calls getUser()
- Step 2: Rate limit — counts today's items where is_ai_extracted=true for the user, caps at 20/day, returns 429 with clear message if exceeded
- Step 3: Validates request body has storagePath string, verifies path prefix matches user ID (prevents accessing other users' files)
- Step 4: Fetches image from Supabase Storage using service role key (for private bucket access), converts to base64
- Step 5: Calls Gemini API (gemini-2.0-flash) with EXTRACTION_PROMPT and responseSchema per §7
- EXTRACTION_PROMPT includes the mandatory warranty rule: "Do NOT guess or estimate a warranty period. Only set warranty_months if a warranty duration is explicitly printed on the document. Otherwise return null."
- Uses structured JSON output (responseMimeType: "application/json", responseSchema)
- Step 6: Parses Gemini response, enforces warranty_months=null (belt-and-suspenders), returns parsed JSON
- On any failure: returns clear error message with appropriate status code (401, 400, 403, 422, 429, 502, 500)
- Client always falls through to manual entry — AI is never a hard dependency

### 2. src/lib/supabase/extract-receipt.ts (NEW)
- Client-side helper that orchestrates the full pipeline
- Exported ExtractionResult type with all fields from the Gemini schema
- Exported ExtractReceiptReturn type combining itemId, storagePath, and extraction
- convertHeicToJpeg(): checks file.type includes 'heic', dynamically imports heic2any, converts to JPEG blob
- compressImage(): uses browser-image-compression with maxWidthOrHeight: 1600, initialQuality: 0.8, fileType: 'image/jpeg'
- buildStoragePath(): generates `{userId}/{itemId}/{timestamp}-{filename}` per §6
- extractReceipt(): main pipeline function — auth check → HEIC conversion → compression → Storage upload → Edge Function invoke
- Generates itemId client-side with crypto.randomUUID() (§6 requirement: storage path and DB row share same ID)
- On Edge Function error: cleans up uploaded image from Storage before re-throwing
- Upload uses cacheControl: '31536000' (receipts don't change)

### 3. src/components/items/AIReviewForm.tsx (NEW)
- Three-phase component: loading → done → error
- Loading phase: StaggeredSkeleton — reveals skeleton form fields one by one (250ms intervals), each with label skeleton + input skeleton, plus "Reading your receipt…" text with FileText icon
- The skeleton reads as "reading your receipt" not "something is loading" (per design doc §7)
- Done phase: pre-fills ItemForm with extracted data, shows receipt image preview, shows AI confidence_note as a subtle info Alert
- warranty_months is ALWAYS null in the defaultValues (hard rule from §7 — never pre-filled by AI)
- "Start over" button with RotateCcw icon — calls onStartOver callback to reset to file picker
- Error phase: shows error message in destructive Alert + blank ItemForm, copy per §8 ("Couldn't read this image — try a clearer photo or enter details manually.")
- Accepts file, imagePreviewUrl, and onStartOver props

### 4. src/components/items/ItemForm.tsx (UPDATED)
- Added optional `receiptImagePath?: string` prop for AI pipeline
- Added optional `aiExtracted?: Record<string, unknown>` prop for raw AI result
- Changed `is_ai_extracted: false` to `is_ai_extracted: !!aiExtracted` — dynamically set based on AI usage
- Added `receipt_image_path: receiptImagePath || null` to the insert row
- Added `ai_extracted: aiExtracted || null` to the insert row

### 5. src/app/(app)/items/new/page.tsx (UPDATED)
- Scan tab now fully functional with AI extraction pipeline
- File input accepts "image/*,image/heic" for iPhone photo support
- Shows upload zone when no file selected (with "Supports JPEG, PNG, and HEIC" hint)
- When file selected: creates object URL preview, renders AIReviewForm with key-based remounting
- AIReviewForm receives file, imagePreviewUrl, and onStartOver callback
- handleStartOver: clears file state, revokes object URL, resets file input, increments key
- Manual tab unchanged — still renders plain ItemForm

- ESLint passes clean (zero errors)
- Dev server compiles successfully

Stage Summary:
- ✅ Phase 5 COMPLETE. All Task 5 deliverables met:
  - ✅ supabase/functions/extract-receipt/index.ts — full Deno Edge Function with auth, rate limit, Gemini API, structured output
  - ✅ src/lib/supabase/extract-receipt.ts — client pipeline with HEIC conversion, compression, upload, invoke
  - ✅ src/components/items/AIReviewForm.tsx — staggered skeleton loading, AI pre-fill, warranty hard-rule, error fallback
  - ✅ ItemForm.tsx updated — accepts receiptImagePath, aiExtracted props
  - ✅ items/new/page.tsx updated — Scan tab wired to AIReviewForm with HEIC support
  - ✅ Zero purple anywhere
  - ✅ Design system tokens used throughout
  - ✅ Copy voice: "Reading your receipt…" / "Couldn't read this image — try a clearer photo or enter details manually."
  - ✅ warranty_months NEVER pre-filled by AI (enforced in Edge Function + AIReviewForm)
  - ✅ Mobile-first responsive
  - ✅ Lint passes clean
- Files created/updated:
  - supabase/functions/extract-receipt/index.ts (replaced stub)
  - src/lib/supabase/extract-receipt.ts (new)
  - src/components/items/AIReviewForm.tsx (new)
  - src/components/items/ItemForm.tsx (updated — 3 edits)
  - src/app/(app)/items/new/page.tsx (rewritten)

Next Phase: Phase 6 — Reminders Edge Function + cron setup.