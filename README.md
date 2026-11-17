# QualiFi

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d4f29fc8-923b-5cea-89ca-b2ecb5b2825a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Source and publishing

The connected repository is `Talhaguler1/qualifi-41598058` on `main`.
Git sync updates the Lovable editor. Publishing changes to `qualifilab.com`
is a separate step; a successful push alone does not verify production deployment.

## Request storage status

Leads and consented events are saved in the managed backend (`qualifi_leads`,
`qualifi_events`). Verified in preview on 2026-11-11
([persistence-verification](docs/persistence-verification.md)) and on the live
site on 2026-11-12, where 8 test submissions returned 201 with a record id and
appeared in `/admin/leads` ([flow audit](docs/flow-audit-2026-11-12.md)).
Known gaps from that audit: file uploads are rejected (sample scenario only),
`role`/`channel` form fields are not stored, no visitor confirmation email, and
owner-notification delivery is unconfirmed.

Demo panel interactions (`/demo/*`) are logged to `qualifi_demo_interactions`
through `POST /api/demo-interactions`; a live call returned 201 on 2026-11-17.

The earlier [storage setup handoff](docs/lovable-storage-setup.md) describes the
pre-persistence state. Do not transplant the standalone Node/SQLite server into
this app.

## Private lead inbox

The owner-facing page is `/admin/leads`: email/password login, server-verified
admin authorization, filtered lead list, contact-status updates and CSV export.
It reads real backend data and shows a setup error when storage is missing.
It does not collect typed-but-unsubmitted emails or send messages automatically.

Follow [the admin setup handoff](docs/admin-leads-setup.md) for the managed table,
RLS and owner account setup. Publishing alone does not create that database or
assign the server-managed `qualifi_admin` role.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
