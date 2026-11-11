# QualiFi: persistent requests and measurement handoff

Status: 2026-11-12. Repository confirmed by the user's Lovable screenshot and
GitHub access: `Talhaguler1/qualifi-41598058`, `main`. The project README identifies
the Lovable editor as https://lovable.dev/projects/d4f29fc8-923b-5cea-89ca-b2ecb5b2825a.

## What was found

The starting `/api/leads` implementation returned HTTP 201 and a random ID
without inserting a record. `/api/events` returned `{ok:true}` without storing
the event. Supabase client files exist and Cloud was enabled, but no application
tables are described in the generated types/schema. Those generated files are
not proof of a configured lead store.

The earlier `Talhaguler1/QualiFi` repository is a separate Node/SQLite application.
Its persistence tests cannot establish that this Lovable port saves anything.
No real visitor request or marketing test conversion was submitted in this audit.

The temporary fix returns HTTP 503 with `storage_not_configured` for valid requests
while no store exists. Invalid lead input still returns HTTP 400. The form keeps
the entered email and displays an honest failure with the existing contact address.
This prevents false confirmations; it does not recover previously unrecorded leads
or supply persistence. Analytics collection remains unavailable until its store is built.

## Why the schema step runs through Lovable

The managed block in `AGENTS.md` says: **"Database. Do not add or edit
`supabase/migrations/` or `drizzle/`. Ask Lovable to change the schema."**

There is no callable Lovable MCP tool in the current assistant connection.
The prompt below makes the remaining editor action concrete. Generated schema,
route tree and managed Supabase clients must not be hand-edited to simulate readiness.

## Prompt to paste into the connected Lovable project

```text
Connect real persistent storage for QualiFi pilot/waitlist requests and permitted
analytics events in THIS project's Lovable Cloud backend. Preserve the current
TanStack Start app, existing public HTML pages, TR/EN URLs and branding.

The old /api/leads route returned HTTP 201 plus a random UUID without saving;
/api/events also acknowledged events without storing them. A temporary guard now
returns storage_not_configured/503 from src/lib/qualifi-request-storage.server.ts.
Replace that guard only after real writes work. Do not restore placeholder success.

Inspect the existing backend/schema first. Reuse suitable existing tables if any;
otherwise create private lead and event tables through Lovable's managed migration
workflow. Deny anonymous/public table reads and browser access to contact details.
Use server-side APIs for validation and writes. Keep service-role credentials on
the server; do not add secret values to Git or public JavaScript.

For /api/leads:
- Validate a UUID request id, kind, email, explicit data-use consent, honeypot,
  campaign/page/language and allowed solution/segment. Use a server-side campaign
  allowlist rather than trusting client-provided goals, prices or page metadata.
- Save the request with normalized email, request id, kind, page/campaign,
  language, segment, selected solution and allowed source/UTM context.
- Make retries idempotent and apply per-page email/kind uniqueness. Return the
  existing id with duplicate:true on a duplicate; no second lead/conversion.
  Show that the existing request was retained, no new record was created and a
  newly selected file was not saved again. Do not show duplicate as new success.
- Return 201 only after the new record is durably committed. A storage failure
  returns a non-2xx error; never clear the form or invent a saved reference.
- Keep waitlist/pilot requests functional even when analytics consent is denied.
  Do not associate a tracking visitor id in that case.
- If own-document uploads are supported, save PDF/TXT up to 5 MB in private
  storage associated with the saved request. Validate file contents and access.
  Do not acknowledge an upload that was not saved. If that flow is not ready,
  explicitly reject it and preserve the sample/no-document alternative.

For /api/events:
- Persist only the permitted event vocabulary and bounded metadata. Deduplicate
  retries by event UUID; require analytics consent and a valid random visitor id.
- Preserve landing_viewed, primary_cta_clicked, lead_form_started,
  contract_selected and calendar_opened where those actions actually occur.
- Real waitlist_joined/pilot_request_created and contract_upload_completed are
  produced by the server after actual persistence, not by arbitrary client posts.
- Keep new-request and related operational-event writes atomic. Duplicates must
  not produce another success event. Keep opt-out operational records separate
  from consented visitor funnels.
- Never include email addresses, company text, document names/contents or free
  form answers in analytics properties. Do not forward any data to ad platforms yet.

Add secure owner-only access to recorded requests and an aggregate report by
page, language, source and selected date range. Do not expose contact details in
an unauthenticated endpoint or public static file. Mark the report timezone.
Preserve the primary research metric: unique CTA clickers / measured unique
visitors in the same scope. A CTA click is not a saved lead or activated agent.

Implement meaningful tests for success, DB failure, invalid data, duplicates,
analytics opt-out and private record access. Prove records survive a reload/new
session from the owner view. Keep test records separate from real interest data.
Do not claim that email sending, Meta Pixel/CAPI, GA4 or live AI is configured.
Use no session recordings or heatmaps. Report what was implemented and what
remains unverified before publishing.
```

## Verification and publishing

1. Confirm the table/RLS changes and server routes are implemented through Lovable.
2. Test with a controlled record: exactly one private lead exists after success;
   a retry creates none, and a forced storage error never shows success.
3. Decline analytics: the lead still saves but visitor events do not record.
4. Accept analytics: one permitted event survives reload; no email/file data in it.
5. If uploads are enabled, verify a real private saved file; otherwise keep the
   sample flow and report the unavailable capability accurately.
6. Publish the tested version from Lovable. A push to `main` only syncs source into
   the editor. Recheck the live URL and the relevant endpoints after publication.

Public form success, stored request, accepted analytics event, Meta/GA4 arrival,
and attribution to a real ad click are distinct claims. Verify each separately.

References:
- [Lovable Git sync](https://docs.lovable.dev/integrations/github)
- [Lovable publishing](https://docs.lovable.dev/features/publish)
