Please add one new table for live WhatsApp messages. Only make the database change below; do not change any app code or pages.

Table `public.qualifi_whatsapp_messages`:
- id uuid primary key default gen_random_uuid()
- user_id uuid not null (owner account; references auth.users(id) on delete cascade)
- wa_message_id text unique (WhatsApp message id; may be null until an outgoing message is sent)
- direction text not null, check in ('in','out')
- contact_wa_id text not null, check char_length <= 32
- contact_name text, check char_length <= 100
- body text not null, check char_length <= 4096
- intent text, check in ('promise','paid','refuse','question','other')
- commitment_id uuid references public.qualifi_commitments(id) on delete set null
- previous_due_date date
- new_due_date date
- ai_summary text, check char_length <= 400
- confidence numeric, check between 0 and 1
- reply_draft text, check char_length <= 1000
- reply_state text not null default 'none', check in ('none','waiting','sent','dismissed','failed')
- delivery_status text, check in ('sent','delivered','read','failed')
- error text, check char_length <= 300
- created_at timestamptz not null default now()
- index on (user_id, created_at desc)

Security:
- Enable row level security.
- authenticated: SELECT only, policy `user_id = auth.uid() OR public.qualifi_is_admin()`. No insert/update/delete for authenticated (the server writes with the service role).
- GRANT SELECT to authenticated; GRANT ALL to service_role.

Also update the existing function `public.qualifi_delete_my_workspace()` so it additionally deletes the caller's rows from `qualifi_whatsapp_messages` (WHERE user_id = auth.uid()) before deleting commitments, and returns the count as `whatsapp` in the jsonb result. Keep everything else in that function the same.
