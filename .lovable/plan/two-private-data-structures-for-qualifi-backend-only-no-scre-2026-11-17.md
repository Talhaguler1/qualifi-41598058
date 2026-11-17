# Two private data structures for QualiFi (backend only, no screens)

Nothing changes in the existing leads/events tables, the admin panel, or the demo files. The screens will be added later from GitHub.

## A) Uploads for an empty account
- Private storage area `workspace-files`: not public, max 10 MB per file. Allowed types: pdf, png, jpg, xlsx, csv, txt.
- Files table `qualifi_workspace_files`: user, kind (contract / invoice_image / spreadsheet / whatsapp), storage path, original name, status (uploaded / processing / extracted / failed), error, created date.
- Commitments table `qualifi_commitments`: user, optional file, counterparty, direction (in/out), amount, currency (TRY by default), due date, kind (invoice / contract_installment / promise / expense), status (open/paid), paid date, confidence (0–1), short evidence quote, needs-review flag, created date.
- One-step deletion (KVKK): a single action removes all of a user's commitments, files and stored documents.

## B) Demo interaction log
- Table `qualifi_demo_interactions`: optional user, browser session id, panel (business/bank), tenant, demo date, action (the 9 listed actions), target, detail (max 300 characters), created date.
- New `POST /api/demo-interactions`. It is the only way to write to this table. It:
  - validates every field;
  - rejects a detail that contains an email address or phone number;
  - rejects more than 60 records per session per minute.

## Permissions
- Files, commitments and stored documents: each user can see, add and delete only their own. Confirmed admins (protected admin role plus server-managed admin flag) can read everything. Editable profile data never grants access.
- Demo interactions: the browser cannot read or write them directly. Only admins can read them.

## Technical details
- One migration in the order: tables, then grants, then RLS, then policies. Admin reads reuse the existing `qualifi_is_admin()` check.
- Value checks use CHECK constraints for the fixed lists, amount ≥ 0, confidence between 0 and 1, and detail ≤ 300.
- Rows have no foreign keys to auth.users: `user_id` is a plain uuid, with defaults of `auth.uid()` and `status = 'uploaded'`/`'open'`. `file_id` references the files table with ON DELETE SET NULL.
- Deletion uses a security-definer function `qualifi_delete_my_workspace()` that deletes the caller's rows. Storage objects are removed through the storage API, since SQL cannot delete storage files.
- Storage policies on `storage.objects` limit `bucket_id = 'workspace-files'` to the user's own `<user_id>/` folder. Insert, select and delete are allowed for the owner, and select for admins.
- The bucket is created with the storage tool (private, 10MB). Allowed file types are enforced by a storage policy on the file extension.
- The route `src/routes/api/demo-interactions.ts` validates with zod. It finds the user only from a valid bearer token, never from the body. It inserts with the service role, loaded inside the handler. The 60-per-minute limit is a count query on session_id + created_at, backed by an index.
- Regenerate the TypeScript types. Add focused tests for the validation, the personal-data rejection and the rate limit, then run them.
