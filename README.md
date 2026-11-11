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

The original Lovable port acknowledged leads and analytics without saving them.
Until persistent storage is implemented, these APIs now return an explicit
unavailable response instead of a fabricated successful record. The forms retain
entered details and show an alternative contact address. This is a temporary
honesty fix, not a completed database integration.

Follow [the Lovable storage setup handoff](docs/lovable-storage-setup.md) to connect
real storage using this project's backend. Do not transplant the standalone
Node/SQLite server into this app.

## Private lead inbox

The owner-facing page is `/admin/leads`: email/password login, server-verified
admin authorization, filtered lead list, contact-status updates and CSV export.
It reads real backend data and shows a setup error when storage is missing.
It does not collect typed-but-unsubmitted emails or send messages automatically.

Follow [the admin setup handoff](docs/admin-leads-setup.md) for the managed table,
RLS and owner account setup. Publishing alone does not create that database or
assign the server-managed `qualifi_admin` role. The public lead/event storage
guard remains until real persistence is implemented through Lovable.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
