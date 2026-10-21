# RoadWatch motion spec (decision #41)

Status: **draft for approval** (Oct 20, 2026). Figma key frames: page "Motion (#41)" (node IDs in `figma-index.md`).

Goal: the public website feels alive while scrolling, the admin dashboard feels responsive, and the app feels smooth,
without slowing anyone down. RoadWatch is a safety service, so motion is **calm, short and purposeful**: it shows where
to look and what just changed, and never delays reading or reporting.

## 1. Tools

| Where | Tool | Notes |
|---|---|---|
| Web (public pages, admin) | **GSAP 3.13+** with **ScrollTrigger** and **DrawSVGPlugin**, React hook `useGSAP` (`@gsap/react`) | All GSAP plugins are free since 3.13. Framer Motion was never installed (#40 deferred it); it is now dropped for GSAP. |
| Web scrolling | **Native browser scroll** | No ScrollSmoother or scroll hijacking. Animations react to scroll; they never take it over. |
| Mobile (Flutter) | Flutter's built-in animation tools (`AnimationController`, `TweenAnimationBuilder`, `AnimatedSwitcher`, staggered `Interval`s) | No new package. GSAP and Three.js cannot run in Flutter. |

Not used: Three.js and WebGL (kept out for phone performance and accessibility), Anime.js.

## 2. Motion tokens

| Token | Value | Use |
|---|---|---|
| `duration/micro` | 150 ms | Hover, press, toggles |
| `duration/short` | 250 ms | Fades, page change, chips |
| `duration/medium` | 450 ms | Section reveals, cards |
| `duration/long` | 700 ms | Hero sequence steps, count-ups (up to 1.2 s) |
| `ease/enter` | `power3.out` = `cubic-bezier(0.22, 1, 0.36, 1)` | Things arriving |
| `ease/exit` | `power2.in` | Things leaving |
| `ease/drop` | `back.out(1.6)` | The map pin landing (only playful moment) |
| `ease/scrub` | `none` | Anything tied directly to scroll position |
| `stagger/list` | 70 ms (web), 40 ms (app), max 8 items | Lists and grids |
| `distance/rise` | 24 px desktop, 16 px phone | Fade-and-rise reveals |

Rules: animate only `transform` and `opacity` (plus SVG stroke for line drawing); reveals play **once** when 20% of the
element is visible (no replay when scrolling back up); nothing loops forever (decorative loops stop after 2 cycles,
WCAG 2.2.2); no motion delays a button, link or form from being usable; content is never hidden if JavaScript fails.

## 3. Reduce motion (WCAG 2.1 AA)

| Platform | Signal | What happens |
|---|---|---|
| Web | `prefers-reduced-motion: reduce` (via `gsap.matchMedia()`) | Every reveal becomes a 200 ms opacity fade. No movement, parallax, scrubbing, count-up, line drawing or pin drop: final values show at once. |
| App | Android "Remove animations" or the app's Settings → Accessibility → Reduce motion (already sets `disableAnimations`) | Same: short fades only, no slides, no stagger, no count-up. |

## 4. Public website (landing, About, 404, 500)

| ID | Element | Trigger | Motion |
|---|---|---|---|
| P1 | **Hero: road and pin story** | Page load | 1) Headline words rise in (stagger 60 ms, 450 ms each). 2) An SVG road and its amber centre line draw themselves from the lower left, sweeping up toward the preview card (DrawSVG 0 → 100%, 1.1 s, `ease/enter`). 3) A map pin drops onto the end of the road (`ease/drop`, 500 ms) with a small shadow that grows. 4) The "What reporters see" card rises, then its 3 timeline items stagger in; the current status dot pulses twice. Total about 2.2 s; text and buttons are usable from the first 300 ms. Phone: same steps, the road runs under the buttons, card hidden (as today). |
| P2 | Hero while scrolling | Scroll (scrub) | Background photo moves slower than the page (parallax, 0 → 12% of its height); the road's centre dashes slide along the road as if driving. Desktop and tablet only (768 px and up). |
| P3 | Header | Scroll past 80 px | Header gains the soft shadow and shrinks from 80 to 64 px (250 ms). Returns at the top. |
| P4 | Stats bar | 20% visible | The four numbers count up from 0 to the live value (1.2 s, `power2.out`, tabular figures so nothing jumps); icons scale in 0.8 → 1. Screen readers get the final number only. |
| P5 | Section headings (all h2) | 20% visible | Fade and rise; a short amber bar (32 × 4 px) draws under the heading from left to right. |
| P6 | How it works | Scroll (scrub, desktop) / reveal (phone) | The connector line between the 3 steps draws as the section scrolls through the middle of the screen; each step circle pops in (scale 0.6 → 1) when the line reaches it. Phone: steps reveal one by one. |
| P7 | Public road updates | 20% visible | Map fades in, pins drop one after another (stagger 70 ms); record cards rise with stagger. |
| P8 | Safety tips + emergency card | 20% visible | Tips slide in from the left with stagger; the emergency card rises; its phone icons do one small ring (rotate ±8°, 2 cycles) to draw the eye to 911. |
| P9 | About section | 20% visible | Text fades and rises; the six check icons draw their ticks one after another. |
| P10 | **FAQ chat** | Each Q&A pair at 30% visible | Question bubble slides in from the right; a 3-dot "typing" bubble shows for 400 ms on the left; it is replaced by the answer, which rises in. Pairs play in order as you scroll. Phone "Show more" reveals the next 4 the same way. |
| P11 | Closing CTA | 20% visible | Text and button rise; the QR placeholder's dashed border draws around the box. |
| P12 | About page | 20% visible | Intro as P5; team cards rise with stagger; each avatar circle scales in 0.8 → 1. |
| P13 | 404 page | Page load | The dashed path draws from the pin to the road, then the detour sign swings once (rotate 6° → 0, 2 cycles). |
| P14 | 500 page | Page load | The server fades in; the "z" letters float up and fade (2 cycles, then stop); the cable gives one small wiggle. |
| P15 | Page change | Route change | Main content fades in (250 ms). The header and footer do not move. |

## 5. Admin dashboard (subtle, no scroll effects)

| ID | Element | Motion |
|---|---|---|
| A1 | Summary cards | On first load: rise with stagger (70 ms); numbers count up (700 ms). On Refresh: numbers tween from the old value to the new one, no rise. |
| A2 | Charts | Trend line draws left to right (600 ms); type bars grow from 0 width (stagger 50 ms). Uses GSAP on the chart SVG, or Recharts' own animation where simpler. |
| A3 | Tables and lists | First 8 rows fade in with stagger (40 ms) on first load and after a filter change. |
| A4 | Dialogs and menus | Dialog: backdrop fades (150 ms), panel scales 0.96 → 1 and fades (200 ms). User menu: fades and slides 4 px. |
| A5 | Toasts | Slide up 16 px and fade in; fade out after 5 s. |
| A6 | Page change | As P15. |

## 6. Mobile app (Flutter)

| ID | Screen | Motion |
|---|---|---|
| M1 | Home | "Report an Accident" card scales 0.96 → 1 and fades; the amber icon tile does one gentle pulse. Recent reports rise with stagger. |
| M2 | Lists (My reports, Notifications, Officer O1) | Items fade and rise 16 px, stagger 40 ms, first load only (max 8). Pull to refresh uses the standard indicator. |
| M3 | Report form (3 steps) | Step progress bar fills to the new step (300 ms); screens move with a shared-axis slide (forward = from right, back = from left, 300 ms). |
| M4 | Location step | The map pin drops onto the map when placed (`ease/drop`, 400 ms). |
| M5 | Report sent | The check circle scales in and its tick draws (500 ms); the Report ID card rises; the 3 "what happens next" steps stagger in. |
| M6 | Tracking timeline | History items appear top to bottom (stagger 60 ms); the connector line grows down; the current status dot pulses twice. Status chip changes cross-fade. |
| M7 | Buttons and cards | Press: scale to 0.98 (100 ms) and back. |
| M8 | Dialogs and sheets | Log-out dialog: fade and scale 0.96 → 1 (200 ms). Officer "Update status" sheet: slides up (300 ms). |

## 7. Performance and testing

- GSAP core and ScrollTrigger load with the public pages only; the admin uses GSAP core only. Expected size: about 45 KB gzipped in total.
- Use `ScrollTrigger.batch` for lists, `gsap.matchMedia()` for breakpoints and reduced motion, and clean up every animation when a page unmounts (`useGSAP` does this).
- Test: Playwright at 1440 and 390 px (content visible after scrolling, no layout shift), with reduced motion emulated, and with JavaScript animation failing (content must still show). Pauline checks it on a low-end Android phone and with "Remove animations" on.
