# Demo pages check result (no files changed)

## Verified
- Latest GitHub commits are present: /demo, /demo/isletme, /demo/banka routes plus src/lib/demo and src/components/demo.
- Type check passes with no errors; the preview compiles.
- All three pages open (200) with no browser errors:
  - /demo -> "Canlı demo | QualiFi demo"
  - /demo/isletme -> redirects to /demo/isletme?t=017&d=2026-11-24, "İşletme paneli"
  - /demo/banka -> redirects to /demo/banka?b=01&d=2026-11-24, "Bankacı paneli"

## Problem found (not fixed)
- Dark primary buttons have invisible text: on /demo/banka the "Firma kartı" buttons under "Bugün aranacaklar", and on /demo/isletme the approve buttons in "Ajanın önerileri". Text color is computed the same as the background (dark green), so they look like empty dark blocks. Another style rule is overriding the button's light text color.

## Minor notes
- The panel pages have no main heading (h1); this matters only for accessibility/SEO.
- The /isletme and /banka redirects use a fixed date (2026-11-24).

## Proposed fix (only if approved)
- Make the primary button text color win in the demo stylesheet so the labels show on the dark background, then recheck both panels.
