# QA and audit report

What was checked, how, and what was found. Items that could not be verified in this session are
listed as unverified rather than assumed to pass.

---

## Automated gates

```
npm run verify   # typecheck → lint → check:assets → test → build
```

| Gate | Result |
|---|---|
| `tsc -b --noEmit` — strict, `noUncheckedIndexedAccess`, `noUnusedLocals`, `verbatimModuleSyntax` | ✅ clean |
| `eslint .` | ✅ 0 errors (3 `react-refresh` HMR warnings) |
| `npm run check:assets` | ✅ 6 catalogued · 0 deployable · 0 slots · no violations |
| `vitest run` | ✅ **116 passed** / 6 files |
| `vite build` | ✅ clean |
| Production serve + deep link | ✅ `/` → 200, `/movies/kaanch` → 200, entry chunk loads |

### Test coverage by area

| File | Tests | Covers |
|---|---|---|
| `schedule.test.ts` | 10 | Determinism across cache resets, format compatibility, coming-soon exclusion, badge/seat-map agreement, id round-trip, caption independence |
| `bookingMath.test.ts` | 15 | Every pricing axis, category multipliers, wheelchair parity, fee arithmetic, "no hidden total", all four age-category outcomes |
| `nlu.test.ts` | 50 | Normalisation, language detection, relative dates against a fixed clock, time windows in both languages, entity extraction, 18 intent-routing cases, 3 Bangla queries |
| `seatFinder.test.ts` | 11 | Availability guarantee, exact count, determinism, adjacency, aisle preference, wheelchair + companion pairing, explanations, refusal cases, budget bound |
| `SeatMap.test.tsx` | 9 | Listbox semantics, per-seat accessible names, disabled sold seats, single tab stop, arrow keys, selection + announcement, limit enforcement, deselect-at-limit, legend completeness |
| `routes.test.tsx` | 21 | All 15 routes render; 5 **honesty guarantees** |

### The honesty guarantees

These exist specifically so the project's core commitments cannot regress silently:

1. The schedule is labelled as sample data wherever it is shown.
2. The booking flow states that no payment is taken.
3. **No `input[type="password"]` exists anywhere in the booking flow.**
4. Prices are labelled as sample data on the pricing page.
5. Incomplete allergen data is flagged rather than glossed over.

---

## Bugs found and fixed during the build

Recorded because they were real, not cosmetic.

| # | Found by | Bug | Fix |
|---|---|---|---|
| 1 | Test run | **All Bangla date and time parsing was silently broken.** JavaScript's `\b` never matches beside Bengali script, because Bengali characters are not `\w`. Every pattern like `/\bআগামীকাল\b/` failed | Bengali alternatives tested without boundaries, longest-first (আগামীকাল before কাল; আজকে before আজ) |
| 2 | Test run | **Bengali time expressions never matched.** Bengali is postpositional — `৮টার পর` puts the number *before* the marker, while the regex assumed English word order | Separate postpositional patterns for both `after` and `before` |
| 3 | Route test | `useRouteError()` threw when `NotFound` was rendered as an ordinary route — the hook is only valid inside an `errorElement` | Split into `NotFound` (pure) and `RouteErrorBoundary` (reads the error) |
| 4 | Test run | Node 26's global `localStorage` shadows jsdom's and is inert without `--localstorage-file`, breaking every persisted store under test | Real in-memory `Storage` installed in the test setup |
| 5 | Intent tests | "What can I watch tonight?" routed to a film list rather than showtimes | A film query carrying a date or time is promoted to `find_showtimes` — times are the useful answer |
| 6 | Intent tests | "Can I bring my own food?" routed to concession recommendations | A dedicated higher-weight rule: bringing your own food is a house rule, not a request for a suggestion |
| 7 | Build | Fontsource variable packages expose *axis* files, not subset files — `./latin.css` does not exist | Switched to `full.css` for Fraunces (the design uses its SOFT/WONK axes) and `wght.css` for the rest |
| 8 | Typecheck | Vitest 2 bundles a nested Vite, creating duplicate `Plugin` type identities | Upgraded to Vitest 3; all packages now resolve to one `vite@6.4.3` |
| 9 | Review | Two filter sheets closed via `document.body.click()` | Replaced with Radix `SheetClose` |
| 10 | Review | The Max launcher's lift above the sticky action bar applied at every breakpoint, though the bars are `lg:hidden` | Made responsive via a CSS custom property |

---

## Accessibility

### Verified by test

- Seat map exposes `role="listbox"` with `aria-multiselectable`, rows as `role="group"`.
- Every seat's accessible name states row, seat number, class, price or unavailability, aisle
  adjacency and position in the house.
- Sold seats carry `aria-disabled="true"` — not merely a grey fill.
- Exactly one tab stop exists in the map (roving tabindex).
- Arrow keys move between seats; Enter selects; the limit is enforced with a spoken explanation;
  deselecting still works at the limit.
- The legend names every state in words.
- All 15 routes expose a level-1 heading.

### Verified by inspection

| Area | Status |
|---|---|
| Landmarks | `header` / `main` / `footer` / `nav` throughout; skip link to `#main` |
| Heading order | h1 per route, h2 per section, no levels skipped |
| Controls are real elements | Filter chips are checkboxes; the date strip is a `radiogroup` with arrow/Home/End; steppers are buttons; nothing is a clickable `div` |
| Focus visibility | 2px marigold `:focus-visible` ring, 2px offset, never removed |
| Focus return | Max's launcher takes focus back on close |
| Touch targets | ≥44×44px on all primary controls including the launcher |
| Colour independence | Availability = word + fill bar; seat states = distinct shapes; access markers = two-letter text codes |
| Live regions | All `polite`. Seat changes, filter counts, Max replies, step changes |
| Forms | Every input labelled; errors `role="status"`; correct `inputMode` and `autocomplete`; no placeholder-as-label |
| Reduced motion | Global CSS override + Framer Motion's `useReducedMotion` |
| Language | `lang="bn"` on every Bengali string, so screen readers switch voice |
| Icons | All `aria-hidden`, always paired with text |
| Contrast (computed) | Ink/paper 14.8:1 · muted 7.9:1 · house ink/house 13.6:1 · marigold/paper 5.1:1 — all ≥ AA |

### Not verified

- **No screen-reader session** (NVDA/JAWS/VoiceOver).
- **No automated axe scan.**
- **Contrast computed, not measured in-browser.**
- **No real-device touch testing.**

These need an interactive session — see [`tooling-report.md`](./tooling-report.md).

---

## Performance

From the real production build:

| Chunk | Raw | Gzip |
|---|---|---|
| `index` (entry) | 140.5 KB | **45.0 KB** |
| `react-vendor` | 159.7 KB | 51.7 KB |
| `vendor` | 126.7 KB | 42.9 KB |
| `radix` | 92.8 KB | 27.5 KB |
| `motion` | 114.3 KB | 37.8 KB |
| `MaxPanel` (lazy) | 103.2 KB | 33.3 KB |
| `Booking` (lazy) | 43.9 KB | 12.9 KB |
| CSS | 91.8 KB | 20.9 KB |
| Route chunks | 1.3–12.6 KB each | ≤ 4.1 KB |

**Decisions that produced this**

- **Max's engine is lazy.** The NLU pipeline, skills and block renderers (33 KB gzip) load when the
  panel is first opened, not on first paint. The launcher ships in the entry chunk.
- **Every route past home is split.** Someone reading the programme never downloads the seat map,
  the QR renderer or the wizard.
- **Fonts are self-hosted and subset by unicode-range.** The 156 KB Bengali face is only fetched by a
  page that actually renders Bengali. No external font request is made, so there is no third-party
  connection on any page.
- **No images at all** — the largest single performance consequence of the design direction.
- **The schedule engine is memoised** per cinema-date and per showtime, so re-renders never
  recompute a seat map.

**Layout stability.** No image means no image-driven CLS. Plates and diagrams have fixed aspect
ratios. The sticky bars are in normal flow from first paint. Fonts are `font-display: swap` via
Fontsource, which is the one remaining shift risk and is unmeasured.

**Not verified:** no Lighthouse run, no field or lab Core Web Vitals, no CPU-throttled profile.

---

## Responsive behaviour

Verified by reading the implementation across breakpoints; **not** verified on real devices.

| Breakpoint | Behaviour |
|---|---|
| < 640px | Single column; filters in a bottom sheet; sticky action bars on film and booking pages; Max as a modal bottom sheet; seat map zoom controls |
| 640–1024px | Two-column grids; time-of-day chips inline; sidebars still collapsed |
| ≥ 1024px | Filter sidebars appear; sticky bars retire; Max becomes a non-modal anchored panel; booking summary becomes a sticky aside |
| ≥ 1280px | Four-column catalogue; wider gutters |

Safe-area insets are respected on every fixed element. The seat map scrolls within its own container
with `overscroll-behavior` contained, so the page never overflows horizontally.

---

## Anti-slop review

Each prohibited pattern, and what was done instead.

| Prohibited | Status | What was done instead |
|---|---|---|
| Gradient text | ✅ Absent | Solid ink or paper. The only gradients are the seat-map screen arc and the paper grain |
| Purple-blue neon | ✅ Absent | Palette sampled from the references, then warmed to bone paper + indigo ink + a single marigold signal |
| Glowing blobs | ✅ Absent | None |
| Glassmorphism | ✅ Absent | Two `backdrop-blur` uses only, both on sticky bars for legibility |
| Excessive blur | ✅ Absent | 6px on two chrome elements |
| Huge vague hero | ✅ Absent | The masthead carries a real film, its certificate, runtime, language, director and a programme note, plus a working four-field booking control |
| "Experience cinema like never before" | ✅ Absent | Marketing superlatives appear nowhere. Copy states facts |
| Fake testimonials / statistics | ✅ Absent | None. The About page's figures describe the sample circuit and say so |
| Decorative sparkles, rockets, bolts | ✅ Absent | Lucide icons, always paired with text, never in coloured circles |
| Endless rounded cards | ✅ Absent | **Radius is 0 by default.** 2px for seats/chips, 4px for controls, `999px` only for perforation dots |
| Identical card grids on every page | ✅ Avoided | Home alone uses five distinct structures: masthead, timetable, plate grid, numbered editorial dl, dated list. Showtimes are timetables. Coming Soon is a dated list. Cinemas are diagrams |
| Centre-aligned everything | ✅ Absent | Left-aligned throughout; centring is confined to one of the six plate structures |
| Three-column SaaS features | ✅ Absent | The formats section is a two-column numbered definition list with real prose |
| Excessive pills | ✅ Absent | Pill radius is reserved for perforation dots and toggle thumbs |
| Marquees, floating objects | ✅ Absent | None |
| Scroll hijacking | ✅ Absent | Native scrolling only |
| Animate-everything-on-scroll | ✅ Absent | **Nothing animates on scroll.** No `IntersectionObserver` reveals exist |
| Parallax, cursor-followers, WebGL | ✅ Absent | None |
| Inconsistent radii/spacing | ✅ Controlled | Documented radius policy; 4px spacing scale |
| shadcn default styling | ✅ Absent | Primitives authored on Radix and styled from this system — see [`tooling-report.md`](./tooling-report.md#2-shadcnui) |
| Marketing-filler copy | ✅ Avoided | Programme notes read as criticism; policies read as policies; demo notes read as disclosure |
| Component-library collage | ✅ Avoided | Every component is authored here against one token set |
| Repeated imagery | ✅ Impossible | There is no imagery, and `check:assets` enforces it |

### Max-specific

| Prohibited | Status |
|---|---|
| Generic chatbot welcome | ✅ The empty state states capability in two sentences and discloses the demo constraint. No "Hi! I'm Max! 👋" |
| Large fake "AI" gradient icon | ✅ A typographic monogram in a sprocket perforation |
| Constant pulsing | ✅ None. Unread count only |
| Intrusive popups | ✅ One nudge per session, deferred around sensitive states, dismissible, never full-screen |
| Repeated self-introduction | ✅ Greeting only on an actual greeting |
| Excessive anthropomorphism | ✅ Banned phrase list, enforced in the Ollama sanitiser |
| Pretending to know things | ✅ Answers only from seed data; says so when it cannot |
| Long paragraphs over action | ✅ Replies are a sentence or two plus typed blocks and actions |
| Interrupting seat selection or payment | ✅ The nudge is suppressed during both |
| Unexplained automation | ✅ Every booking change confirms first, explains, and offers undo |

### Where a "prohibited" pattern was used deliberately

- **Asymmetry and cinematic cropping** — the masthead is a 1.35:1 asymmetric split; plates crop
  their runtime numeral off the edge. Both strengthen hierarchy rather than decorate.
- **A dark surface** — but scoped to the auditorium (seat map, ticket) as a structural signal, never
  as a default "premium" wash.

---

## Content honesty audit

| Claim type | Where | Handling |
|---|---|---|
| Schedules / availability | Showtimes, film pages, cinema pages, booking | "Sample schedule and seat availability, generated locally… not live inventory" |
| Prices | Ticket prices, booking, Max | "Sample pricing… not the prices of any real cinema" |
| Offers | Offers page | "Sample promotional data… no partner relationships" |
| Allergens | Counter, Max | Per-item incompleteness flagged; never a medical guarantee |
| Payment | Payment step, confirmation | "No payment will be taken", plus explicit statement that no credentials are requested |
| Tickets | Confirmation | "Demonstration ticket — not valid for entry", on the ticket face |
| Alerts | Notification centre, Max | "Demo alerts only… does not monitor live inventory" |
| Lost property | Max | "Nothing has been sent and no staff member has been told" |
| Insurance | Max, pricing page | "No claim has been submitted… no outcome is implied" |
| Age | Tickets step, pricing | "This site does not verify anyone's age; the door does" |
| Storage | Footer, bookings, confirmation | "Stored in this browser only" |
| Max itself | Panel settings, About | Local operation, no transmission, and exactly what the Ollama toggle sends |

Every disclosure is written in the same plain voice as the rest of the product, not in fine print.

---

## Recommended next passes

Requiring an interactive session:

1. `hallmark audit`, then `hallmark redesign` on anything it flags, then the anti-slop evaluation.
2. Chrome DevTools MCP: screenshots at 360 / 768 / 1024 / 1440, a performance trace on home and the
   seat map, CLS measurement, a console-error sweep, and a keyboard pass through the whole booking
   flow.
3. axe-core scan on all 15 routes.
4. A screen-reader pass on the seat map and Max specifically.
5. Re-run the reference audit against fully-rendered pages and raise the confidence levels in
   [`reference-audit.md`](./reference-audit.md).
