# QualiFi redesign: research findings (18 Nov 2026)

Four research agents ran in parallel. Their summaries are below.

## 1. Typography

Method: the real woff2 files (Fontsource 5.3.x and Fontshare) were checked with fontTools for Turkish letters, the ₺ sign (U+20BA), the `tnum` feature and digit widths.

- **Turkish letters:** all 33 fonts checked have the full Turkish set (ğ ş ı İ ç ö ü).
- **₺ sign:** this is where most fonts fail.
  - Fontshare fonts without ₺: Satoshi, Switzer, Cabinet Grotesk, Supreme, Erode.
  - Google Fonts without ₺: Geist, Geist Mono, Figtree, Hanken Grotesk, Instrument Sans, JetBrains Mono.

| Option | Display / Text / Numbers | ₺ | tnum | License | Payload |
|---|---|---|---|---|---|
| **A (recommended)** | Schibsted Grotesk / Onest / Onest tnum | ✓ | ✓ | OFL | ~127 KB |
| B | Mona Sans (single family) | ✓ | ✓ | OFL | ~54 KB |
| C | Gambetta (serif) / Onest | ✓ | Onest ✓ | ITF FFL + OFL | ~95 KB |
| E | Space Grotesk / IBM Plex Sans / Plex Mono | ✓ | ✓ | OFL | ~141 KB |
| F | Bricolage Grotesque / Plus Jakarta Sans | ✓ | ✓ | OFL | ~106 KB |

- **Packages for option A:** `@fontsource-variable/schibsted-grotesk/wght.css` and `@fontsource-variable/onest/wght.css` (upright styles only).
- **Turkish capitals:** set `<html lang="tr">` so `uppercase` turns "i" into "İ".

## 2. Reference sites

The agent wrote this from memory and did not open the pages, so check each site live before copying a detail.

| Site | Technique to borrow |
|---|---|
| Mercury | Hero built from real HTML account UI, with number tickers |
| Ramp | Workflow animation inside product cards (receipt matched to a transaction) |
| Linear | Product UI revealed step by step on scroll |
| Stripe, Vercel | SVG beams flowing from sources into one node |
| Attio | Tab switcher whose pill morphs between tabs (`layoutId`), with a crossfading product panel |
| Pennylane | Before and after story for SME accounting |
| Qonto | SME segment switcher; large, confident type |
| Causal, Runway | A chart line that redraws live when an input changes; a shaded band showing the difference (closest to the QualiFi forecast) |
| Rippling | One change cascading across several modules |

**Avoid:**
- purple gradients, floating blurred blobs, glassmorphism;
- "AI-powered" in every heading, sparkle icons everywhere;
- logo marquees of companies that are not customers;
- fade-up on every element, static bento tiles.

## 3. Motion and components

- **Motion:** `motion` 14.x, imported from `motion/react` (MIT).
  - Use `LazyMotion` with `domAnimation` and `m.*` components; load `domMax` only where `layoutId` is used.
  - Add `MotionConfig reducedMotion="user"` in the root route.
  - Elements above the fold (LCP) must not start at opacity 0 on the server.
- **View Transitions:** Baseline (Chrome 111+, Safari 18+, Firefox 144+). TanStack Router supports `viewTransition` on `<Link>` and `navigate()`.
- **Picks:**
  - audience tabs: Radix Tabs plus a `layoutId` pill;
  - Magic UI pieces (MIT): number-ticker (forked for tr-TR), animated-beam, marquee (CSS only);
  - bento grid built from our own mini UIs;
  - chat bubbles and the side or bottom sheet: our own code (Radix Dialog plus Motion).
  - Skip React Bits (pulls in GSAP/three, licence restriction), Aceternity (Next-style, too loud) and Lenis.
- **Easing:**
  - entrances: out-quint `[0.22, 1, 0.36, 1]`;
  - moves: in-out `[0.65, 0, 0.35, 1]`;
  - exits: `[0.4, 0, 1, 1]`;
  - interactive pieces: spring with `bounce: 0`, `duration: 0.35`.
  - Durations: 150 ms for hover, 250 ms for tabs, 350 ms for sheets, 500–600 ms for reveals.

## 4. Icons

- **Lucide** (`lucide-react`, ISC). It is already installed and is the only candidate with `TurkishLira` and `ReceiptTurkishLira` icons.
- **Settings:** stroke 1.75 (1.5 at 28 px and larger); 20 px by default, 16 px inline in text, 24–28 px for feature icons.
- **Brand marks:** WhatsApp and Gmail logos come only from their official brand kits or Simple Icons (CC0), and only where the integration is named. Elsewhere use the generic `MessageCircle` and `Mail`.

## 5. Photography

Decision (18 Nov): no stock photos before the presentation. Later, 1–2 real photos that the founder takes or approves.
