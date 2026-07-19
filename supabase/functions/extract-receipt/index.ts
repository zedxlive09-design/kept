/**
 * Kept — Supabase Edge Function: extract-receipt (Phase 5)
 *
 * Deno runtime. Invoked via supabase.functions.invoke('extract-receipt', {...})
 * which automatically forwards the caller's JWT — no separate auth wiring needed.
 *
 * See §7 for the full pipeline spec:
 * 1. Verify caller auth
 * 2. Rate-limit check (~20/day per user)
 * 3. Fetch image bytes from Storage
 * 4. Call Gemini API with structured JSON schema
 * 5. Return parsed JSON to client for review form
 * 6. On failure, return clear error — client falls through to manual entry
 *
 * ⚠️ DECISION NEEDED (§0, rule 5): Verify gemini-3.5-flash is still current
 * at ai.google.dev/gemini-api/docs/models before wiring this up.
 */

// Deno.serve(async (req: Request) => {
//   // Implementation in Phase 5
//   return new Response("Not yet implemented", { status: 501 });
// });