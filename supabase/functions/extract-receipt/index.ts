/**
 * Kept — Supabase Edge Function: extract-receipt (Phase 5)
 *
 * Deno runtime. Invoked via supabase.functions.invoke('extract-receipt', { body: { storagePath } })
 * which automatically forwards the caller's JWT in the Authorization header.
 *
 * Pipeline (§7):
 * 1. Verify caller auth via the forwarded Authorization header
 * 2. Rate-limit: cap at 20 AI extractions per user per day
 * 3. Fetch image bytes from Storage using the service role key
 * 4. Call Gemini API (gemini-2.0-flash) with structured JSON schema
 * 5. Return parsed JSON to client for the review form
 * 6. On any failure, return a clear error — client falls through to manual entry
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-2.0-flash";
const DAILY_LIMIT = 20;

const EXTRACTION_PROMPT = `You are extracting structured data from a photo of a receipt, invoice, or subscription confirmation email screenshot.
Only return fields you can actually read from the image.
If a field cannot be read, return null for it.
Do NOT guess or estimate a warranty period. Only set warranty_months if a warranty duration is explicitly printed on the document. Otherwise return null for it.
Return amounts as numbers (no currency symbols). Return dates in YYYY-MM-DD format.`;

const responseSchema = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING", description: "Product or service name from the receipt" },
    merchant: { type: "STRING", description: "Store or service provider name" },
    amount: { type: "NUMBER", description: "Total amount charged" },
    currency: { type: "STRING", description: "Three-letter currency code, e.g. USD" },
    purchase_date: { type: "STRING", description: "Date of purchase in YYYY-MM-DD format" },
    suggested_category: {
      type: "STRING",
      description:
        "Best matching category: Electronics, Appliances, Furniture, Subscriptions, Bills, or Other",
    },
    suggested_type: {
      type: "STRING",
      enum: ["purchase", "subscription", "bill"],
      description:
        "Infer item type: 'purchase' for one-time receipts, 'subscription' for recurring services, 'bill' for utility/phone bills",
    },
    warranty_months: {
      type: "INTEGER",
      nullable: true,
      description:
        "Warranty duration in months ONLY if explicitly printed on the document. Null if not mentioned.",
    },
    confidence_note: {
      type: "STRING",
      description:
        "Brief note about anything illegible, ambiguous, or uncertain in the extraction. Empty string if everything is clear.",
    },
  },
  required: ["name", "merchant", "amount"],
};

interface ExtractRequestBody {
  storagePath: string;
}

interface GeminiCandidate {
  content: {
    parts: Array<{ text: string }>;
  };
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  error?: { message: string };
}

Deno.serve(async (req: Request) => {
  try {
    // ---- 1. Authenticate the caller ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing Authorization header", { status: 401 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response("Invalid or expired token", { status: 401 });
    }

    // ---- 2. Rate limit: 20 AI extractions per user per day ----
    const { count, error: countError } = await supabaseClient
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_ai_extracted", true)
      .gte("created_at", new Date(new Date().toISOString().split("T")[0]).toISOString());

    if (countError) {
      console.error("Rate limit check failed:", countError);
      // Don't block on a DB error, but log it
    } else if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: `You've reached the daily limit of ${DAILY_LIMIT} AI scans. Try again tomorrow, or add this item manually.`,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- 3. Parse request body ----
    let storagePath: string;
    try {
      const body: ExtractRequestBody = await req.json();
      storagePath = body.storagePath;
      if (!storagePath || typeof storagePath !== "string") {
        return new Response(
          JSON.stringify({ error: "storagePath is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body — expected JSON with storagePath" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Verify the storage path belongs to this user
    const expectedPrefix = `${user.id}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      return new Response(
        JSON.stringify({ error: "Storage path does not belong to you" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- 4. Fetch image from Storage (service role for private bucket) ----
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("receipts")
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error("Storage download failed:", downloadError);
      return new Response(
        JSON.stringify({ error: "Could not retrieve the uploaded image from storage" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Convert to base64
    const imageBuffer = await fileData.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
    );

    // Detect mime type from path or default to jpeg
    const isPng = storagePath.toLowerCase().endsWith(".png");
    const mimeType = isPng ? "image/png" : "image/jpeg";

    // ---- 5. Call Gemini API ----
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      console.error("GEMINI_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "AI extraction is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: EXTRACTION_PROMPT },
                { inline_data: { mime_type: mimeType, data: base64Image } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorBody);
      return new Response(
        JSON.stringify({
          error: "The AI service returned an error. Please try again or enter details manually.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- 6. Parse and return the result ----
    const geminiJson: GeminiResponse = await geminiRes.json();

    if (!geminiJson.candidates || geminiJson.candidates.length === 0) {
      console.error("No candidates in Gemini response");
      return new Response(
        JSON.stringify({
          error: "Could not extract data from this image — try a clearer photo or enter details manually.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    const textContent = geminiJson.candidates[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      return new Response(
        JSON.stringify({
          error: "No text was extracted from this image. Try a clearer photo or enter details manually.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    let extracted;
    try {
      extracted = JSON.parse(textContent);
    } catch {
      console.error("Failed to parse Gemini JSON response:", textContent);
      return new Response(
        JSON.stringify({
          error: "The AI returned unexpected data. Please enter details manually.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      );
    }

    // ---- 7. Enforce: warranty_months is ALWAYS null from AI ----
    // Belt-and-suspenders: the prompt says not to guess, but we also strip it here
    extracted.warranty_months = null;

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("extract-receipt unhandled error:", err);
    return new Response(
      JSON.stringify({
        error: "Something went wrong while reading your receipt. Please enter details manually.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});