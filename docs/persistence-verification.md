# QualiFi persistence verification

Verified on 2026-11-11 UTC in the local preview; not published.

- The sandbox started at GitHub main commit `f1264ae2605b75cff2e23db3213c4660e3e462c6`; the GitHub API confirmed that was the latest commit. Existing admin panel and public pages preserved.
- Managed private schema applied. Only the server can insert requests; private reads and contact-status updates require a confirmed admin with protected role and strict server-managed metadata.
- Controlled form submission returned 201; record appeared in the real admin panel. Subsequent duplicate returned the existing ID without a second lead/outcome.
- Contact status persisted after a full browser reload. Filtered CSV contained the controlled row.
- Anonymous requests returned 401 for list/export/update; a real ordinary signed-in account returned 403. Direct private table reads and persistence RPC were unavailable to both.
- Analytics opt-out requests saved with no visitor ID. Consented CTA retry resulted in one event. Operational outcomes persisted separately and atomically with requests.
- Owner notification send observed in managed email logs. No visitor confirmation email, advertising platform forwarding, AI connection, booking, or payment added.
- Existing prepared test suites plus new persistence rules: 56 tests passed. Automated preview build reports build OK. Desktop panel and mobile denied state inspected.
- Read-only independent 5-second/LIFT source review completed; this is not a human comprehension test. Upload error now names the sample alternative. No ad-hoc rate limiter added; honeypot, bounded input, allowlists, and idempotency do not establish robust abuse protection.

## Owner account

An invitation was sent to the owner-supplied address. The owner account has both server-managed metadata and protected admin role, but email remains unconfirmed. Owner must follow the invitation and set a password using the preview's `/reset-password` page. No privileges are derived from user-editable metadata, first signup, or client input. Testing used designated temporary admin/ordinary accounts, not the owner's unconfirmed account.

## Limits and cleanup

- Document uploads explicitly unavailable; sample mode remains usable and no file is acknowledged as saved.
- Existing setup handoff documents describe the earlier pending state; this report records the now-verified persistence work without claiming owner confirmation or publication.
- Controlled leads/events and temporary auth identities removed by their exact IDs after verification.
- No publishing action performed. The backend is shared with the published app, so schema/account changes exist there, while new page/API code remains unpublished.