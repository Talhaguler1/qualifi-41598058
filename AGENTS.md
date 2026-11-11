<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## QualiFi project workflow

- This is the repository shown in the user's Lovable Git settings:
  `https://github.com/Talhaguler1/qualifi-41598058`, branch `main`.
  The connected project publishes https://qualifilab.com/.
- `Talhaguler1/QualiFi` is the earlier standalone Node/SQLite implementation.
  Preserve both histories. Do not replace this TanStack/Lovable app with that
  application's server or overwrite generated page/database files.
- The user authorized reviewed commits and normal pushes at the end of work and
  wants changes delivered to the live website. Git sync updates the editor;
  verify a separate Lovable publish before claiming the public site changed.
- Read `docs/lovable-storage-setup.md` before changing forms or measurement.
  Current APIs do not have a persistent store. They must not report saved leads
  or accepted events until real persistence succeeds.
- The research goal is page-specific primary CTA clicks. Treat real saved
  waitlist/pilot requests, uploads, bookings and payments as separate outcomes.
  Never send Meta Lead on a button click or failed submission.
- The current requested tracking scope is visits, source, CTA, form steps and
  confirmed requests. Do not add session recordings or heatmaps.
- Preserve TR/EN pages, existing URLs and branding. No live AI/account connection,
  bank endorsement, accuracy or revenue claims without actual implementation/evidence.
- Use an independent read-only 5-second/LIFT reviewer for logical copy/form/CTA
  changes, as the user requested. Source review is not a human comprehension test.
- Run relevant tests and a production build before pushing functional changes.
  No force pushes, secret values, contact lists or request/document data in Git.
