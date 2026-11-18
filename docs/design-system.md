# QualiFi design system

One system for the landing page, the demo, the app and the campaign pages. Tokens live in `src/styles.css` (`:root` + `@theme`) and are mirrored as `--qd-*` in `src/styles/demo-app.css` for the demo/app panels.

## Feeling
Calm, precise, expensive: "a private bank meets Linear".
- Deep green identity, one fresh lime accent, warm off-white paper.
- Motion explains cause and effect, nothing floats for decoration.

## Typography
- **Display:** Schibsted Grotesk Variable, weights 600/700. Used for headlines, the wordmark and card titles. Letter-spacing −0.02em at 32 px and above, −0.01em below.
- **Text:** Onest Variable, weights 400/500/600, for body, UI and labels.
- **Numbers:** Onest with `font-variant-numeric: tabular-nums` (class `.num` / `.qd-num`).
  - Large money figures also use Onest, not Schibsted, because Schibsted's tabular digits look spaced out.
- **Scale (px):** 12 · 14 · 16 · 18 · 20 · 24 · 32 · 44 · 60 · 76. Nothing below 12. Body text is 16 on marketing pages and 14 inside dense data tables.
- **Uppercase eyebrow:** 12 px, weight 600, tracking 0.06em. Use it rarely.
- `<html lang>` follows the page language so `uppercase` produces a correct "İ".

## Color
| Token | Value | Use |
|---|---|---|
| `--green-900` (ink) | `#16302a` | Text, primary buttons, hero surfaces |
| `--green-800` | `#1f4035` | Hero gradient, hover on primary |
| `--lime-300` (accent) | `#d6ee9e` | One accent per view: CTA on dark, highlights |
| `--lime-ink` | `#2c4712` | Text on lime |
| `--paper` | `#f7f6f1` | Page background |
| `--surface` | `#ffffff` | Cards |
| `--soft` | `#eef2e6` | Chips, tab tracks |
| `--line` | `#e2e6db` | Borders |
| `--muted` | `#5d6c61` | Secondary text (AA on paper) |
| `--positive` | `#2f7d4f` | Money in, kept promises |
| `--risk` | `#c0503a` | Money out, cash gaps, broken promises |
| `--warn` | `#a8701c` | Caution only (use rarely) |

Rule: positive and risk colors are used **only** for money in and out and for status, never for decoration.

## Shape and depth
- **Radius:** 8 for chips, 12 for buttons and inputs, 16 for inner cards, 20 for cards, 28 for hero and sheets.
- **Shadow:**
  - `--shadow-sm`: `0 1px 2px #16302a0f`
  - `--shadow-md`: `0 1px 2px #16302a12, 0 12px 32px #16302a12`
  - `--shadow-lg`: hero only.
- **Spacing:** 4 px base. Section rhythm is 96 px on desktop and 64 px on mobile; card padding is 20–24 px.

## Components
- **Button:** heights 40 (default), 32 (sm), 48 (lg), radius 12, weight 600.
  - Variants: primary (ink), secondary (surface + line), ghost, and accent (lime, on dark backgrounds only).
  - Hover: background shift plus an arrow nudge of 2 px. Press: scale 0.98.
- **Card:** surface, 1 px line, radius 20, `--shadow-sm`; on hover `--shadow-md` and a 2 px lift.
- **Chip:** soft background, radius 999, 12–14 px text.
- **Logo:** `<Logo>` component, a path-drawn "q" mark (green square, lime q and dot) plus the "QualiFi" wordmark in Schibsted 700, with no detached dot. The same SVG is the favicon.
- **Icons:** Lucide only. Stroke 1.75, size 20 (16 inline, 24–28 for features), `aria-hidden` when decorative.

## Motion
- **Library:** `motion` (`motion/react`) with `LazyMotion` + `m.*`, and `MotionConfig reducedMotion="user"` at the root.
- **Curves:**
  - `--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)` for entrances;
  - `--ease-move` `cubic-bezier(0.65, 0, 0.35, 1)` for layout and position;
  - `--ease-exit` `cubic-bezier(0.4, 0, 1, 1)` for exits;
  - spring `{ type: "spring", bounce: 0, duration: 0.35 }` for interactive pieces.
- **Durations:** 150 ms for hover, 250 ms for tabs and toggles, 350 ms for sheets, 500–600 ms for reveals, with a 50 ms stagger.
- **Movement:** at most 12 px; never scale below 0.96; money figures never bounce.
- **Reduced motion:** everything snaps to its final state, and CSS animations and transitions are cut to 0.01 ms.

## Copy
- One headline of at most about 8 words, one support line of at most about 20 words, one visual.
- **Fixed terms:**
  - promise: söz / promise
  - forecast: nakit tahmini / cash forecast
  - reminder: hatırlatma / reminder
  - scorecard: ödeme karnesi / payment scorecard
  - agent: QualiFi ajanı / QualiFi agent
- One disclaimer, near the demo and in the footer: "Demo örnek veri kullanır / Demo uses sample data".
- No long dashes in copy.
