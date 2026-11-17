# Commitment updates + document extraction endpoint (backend only)

The demo files and the existing leads/admin parts stay untouched. No screens are added.

## 1. Users can edit their own commitments
- A user can update only their own commitment rows, and only these fields: amount, due date, counterparty, status, paid date and the needs-review flag.
- The user and the linked file can never be changed. Uploaded-file records stay read/insert/delete only.

## 2. `POST /api/workspace/extract`
- **Input and access:** takes `{"file_id": "<uuid>"}`. The user is identified only from the sign-in token, and only the file's owner may run it.
- **Steps:**
  1. Mark the file as processing.
  2. Read the document from private storage.
  3. Ask Lovable AI for the commitments.
  4. Delete any older commitments linked to this file, then save the new ones.
  5. Mark the file as extracted.
- **Reply:** `200 {"status":"extracted","count":N}`.
- **On errors:** the file is marked failed with a short Turkish message, and the reply is `{"error":"<code>","message":"<Türkçe>"}` with a fitting status code:
  - 400 invalid input
  - 401 not signed in
  - 404 file not found or not yours
  - 409 already processing
  - 413 file too large
  - 415 unsupported type
  - 422 unreadable document
  - 402/429/503 AI unavailable, out of credits or rate limited
- **How each type is read:**
  - Invoice images (png/jpg) go to the model as an image.
  - Contract PDFs go as a document.
  - Excel and CSV files are converted to text first.
  - WhatsApp .txt exports are sent as text with message dates kept.
- **Rules given to the model:**
  - Never invent missing information. If unsure, set needs_review = true.
  - Evidence is at most 20 words quoted from the document.
  - A WhatsApp payment promise ("cuma gönderiyoruz") becomes kind = promise, with the due date worked out from the message date.
- **Server checks on what the model returns:** each item is checked again and evidence is cut to 20 words. Items with a missing amount or due date are kept but flagged for review. Invalid items are dropped.

## 3. Tests (run before finishing)
- Input checks.
- Missing or invalid token gives 401. Another user's file gives 404.
- Unsupported type, storage failure and AI failure (402/429/5xx) each mark the file failed with a Turkish message.
- Re-running on the same file replaces its old commitments.
- The promise date is worked out from the message date.
- Evidence is cut to 20 words. Uncertain items are flagged for review.
- One live call against a small sample text file to confirm the real AI response. The test data is deleted afterwards.

## Technical details
- **Migration:**
  - Column-level `GRANT UPDATE (amount, due_date, counterparty, status, paid_at, needs_review)` to authenticated.
  - Policy `own_update` with USING/WITH CHECK `user_id = auth.uid()`. Grants on user_id/file_id are absent, so those columns stay unchangeable.
- **Files:**
  - Route `src/routes/api/workspace/extract.ts` is a thin wrapper.
  - Logic lives in `src/lib/workspace-extract.server.ts`, with an injectable store and AI client (same pattern as demo-interactions).
  - Tests go in `src/test/workspace-extract.test.ts`.
- **Auth and database access:** the token is checked with `supabaseAdmin.auth.getUser`. Every query filters by that user id, and the service role is loaded inside the handler.
- **AI call:** Lovable AI Gateway Responses API with the default chat model (`openai/gpt-6-astra`) through the AI SDK, on the server only.
  - Streamed (`streamText`), with the final structured output read server-side.
  - Strict JSON schema with an object root: `{ commitments: [...] }`, nullable optional fields.
  - Reasoning effort is low.
  - The run-id fetch helper is copied from the gateway skill.
  - Gateway errors keep their status codes, with no automatic retries.
- **New packages:** `ai`, `@ai-sdk/openai` and `xlsx` (SheetJS, for Excel to CSV; runs on the Worker runtime).
