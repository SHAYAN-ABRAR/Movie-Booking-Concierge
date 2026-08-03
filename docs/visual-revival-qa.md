# Visual revival — QA report

Verification of the motion-design and art-direction pass. Baseline commit `e624fe1`.

**Result:** 156 tests passing (was 116) · 0 lint errors · asset check clean · dead-class check clean ·
production build clean · no console errors · zero horizontal overflow on 11 routes at 320 px.

---

## Baseline observations

Recorded before any edit, in [`visual-revival-audit.md`](./visual-revival-audit.md). In short: the
product read as a well-set *document about* a cinema rather than as a cinema. Three causes — the
design system forbade the things that would fix it, the plate system produced one rectangle in six
colours, and all interaction feedback was border-and-colour.

Captures: [`screens/before/`](./screens/before/) · [`screens/after/`](./screens/after/) —
`home-1440`, `movies-1440`, `movie-details-1440`, `showtimes-1440`, plus `home-390` in the baseline
and `offers-1440`, `concessions-1440`, `seat-map-1440` from the second pass.
Full-page WebP (2.2 MB total; the source PNGs were 12.7 MB and compressed 83 % with no loss of
legibility).

---

## Design changes

### Art direction — the largest single change

Seven composition families replace six near-identical plates. Family-to-film pairing is an editorial
judgement, hand-assigned, and **no two films share a family and a ground** — asserted by test.

Four variants that genuinely re-compose (`card` 2:3 · `hero` 5:3 · `tile` 3:2 · `mark` 1:1), each
drawn to its own viewBox, so a card is a condensed crop of the same identity rather than a shrunken
hero. Visual metadata lives in `src/data/artwork.ts`, entirely outside the operational seed data.

### Home — projection stage

The masthead was text beside a form with ~30 % of the first screen empty. It is now an asymmetric
stage: editorial column at 56 %, artwork bed bleeding off the right edge at 46 %, with a defined
projection edge so a light-ground film cannot dissolve into the paper.

Three featured films from the week, each arriving as one composed scene — artwork, type and accent
change together. Quick Book moved below the stage as a **booking stub**, torn along a perforation,
with the four dependent fields on one line and an animated price and seat count.

### Motion system

`src/motion/` — tokens, variants, primitives, preferences. Seven durations, three easings, four
springs. Documented in [`motion-system.md`](./motion-system.md).

### Per-route

| Route | Change |
|---|---|
| Home | Projection stage · featured sequence · booking stub · staggered reveals |
| Movies | Full artwork · `layout` re-ordering under filters · animated result count |
| Movie details | Wide artwork hero · designed no-trailer screen with leader perforations |
| Showtimes | Live clock · "starts in N min" on imminent screenings · bars measure out · physical press |
| Cinemas | House diagrams measure out from the projection side, staggered |
| Booking | Directional step transitions · film-transport stepper · animated totals |
| Seat map | Lights-down arrival · screen glow · rows arrive front-to-back · seats settle |
| Confirmation | Ticket settles · one light pass · QR fades in after the surface is stable |
| Offers | Five pieces of stationery · the leader sweeps once on reveal, then rests |
| Concessions | Drawn vessel per category, drawn contents per item · quantity marker on add |
| Empty states | A drawing per context, not one dashed box |
| Max | Launcher lifts, presses, and sweeps once on genuinely new events |

---

## Motion principles

1. **Motion never gates interaction.** Verified in-browser: clicking a seat flips `aria-selected` and
   updates the total on the same frame; the transform catches up after.
2. **Reduced motion changes behaviour, not just speed.**
3. **Nothing reveals twice** — every scroll reveal is `once: true`.
4. **Stagger is capped** at 0.32 s total regardless of item count.
5. **Nothing interactive exceeds 0.5 s** — asserted by test.

---

## Components changed

**New** — `src/motion/*` (8 files) · `components/visual/CinematicArtwork.tsx` ·
`components/visual/OfferComposition.tsx` · `components/visual/CounterIllustration.tsx` ·
`components/visual/EmptyStates.tsx` · `components/home/FeaturedStage.tsx` · `data/artwork.ts` ·
`data/offerArt.ts` · `scripts/check-classes.mjs`

**Removed** — `components/brand/Plate.tsx`, once both consumers were replaced and it had no
references left.

**Modified** — `Layout` · `RouteFallback` · `MovieCard` · `ShowtimeButton` · `HouseDiagram` ·
`QuickBook` · `SeatMap` · `MaxDock` · `AlertBell` · `ConcessionCard` · `EmptyState` · `Home` ·
`Movies` · `MovieDetails` · `Showtimes` · `Cinemas` · `CinemaDetails` · `Concessions` · `Offers` ·
`Bookings` · `Booking` · `booking/steps` · `BookingConfirmation` · `hooks/index.ts` · `globals.css` ·
`vite.config.ts` · `package.json`

**Untouched, by design** — every file listed as protected business logic: `bookingMath.ts`,
`seatFinder.ts`, `schedule.ts`, `max/nlu.ts`, `max/skills.ts`, `max/executor.ts`, all Zustand stores,
all validation. No booking calculation, schedule, seat-availability rule, pricing rule, Max intent or
persisted schema was altered.

---

## Responsive testing

| Viewport | Result |
|---|---|
| 320 × 800 | ✅ Zero overflow on 11 routes. No two-line clickables (both flags were false positives — icon height, and a `lg:`-only button) |
| 390 × 844 | ✅ Artwork bleeds to the edge; scrim at 80 % so type never competes; stage controls reachable |
| 768 × 1024 | ✅ Two-column grids; stepper still in compact form below `sm` |
| 1440 × 900 | ✅ Primary target |
| 1920 × 1080 | ✅ Shell caps at 82 rem; artwork bed scales with the column |

`overflow-x: clip` added to `html, body` as a backstop — **`clip`, not `hidden`**, because `hidden`
establishes a scroll container and would silently break every `position: sticky` in the product.

---

## Accessibility

**Verified in-browser**

- Seat map still exposes exactly **one tab stop** after the motion pass.
- Seat selection updates `aria-selected` immediately; no motion-induced delay.
- `AnimatedNumber` exposes the true final value from the first frame — observed mid-count as
  `৳209` visible / `৳310` in the screen-reader copy.
- Route changes announce the new page's heading politely. Focus is deliberately **not** moved:
  relocating focus to `main` makes a screen reader re-read the whole page on every navigation.
- No horizontal scroll at any tested width.

- Seat map re-measured after the second pass: 160 seats, **1 tab stop**, all 30 sold seats carrying a
  non-colour mark.
- **Reduced motion, JS path** — forced by stubbing `matchMedia` through a navigation init script.
  The featured stage did not advance after 9 s (interval is ≥ 7 s), and no element on `/offers` was
  left below 0.15 opacity while carrying text.
- No console errors or warnings across 10 routes.

**Contrast, measured against the house ground `#101322`**

| | Before | After | Requirement |
|---|---|---|---|
| `--house-faint` small print | 3.96:1 ❌ | **4.71:1** ✅ | 4.5:1 (1.4.3) |
| Available seat outline | 2.45:1 ❌ | **3.43:1** ✅ | 3:1 (1.4.11) |
| `--house-muted` | 7.42:1 ✅ | 7.42:1 ✅ | 4.5:1 |
| Premium seat outline | — | 5.37:1 ✅ | 3:1 |
| Recliner / access outline | — | 3.50 / 4.82:1 ✅ | 3:1 |

Both failures were latent rather than visible: the tokens emitted no CSS, so the elements were
inheriting `house-ink` and passing by accident. Registering the tokens is what made the real values
apply, and the two lifts are what make them pass on purpose.

**Verified by test** (40 assertions across the two new files)

- Artwork and stationery SVGs are `aria-hidden`; the real facts are text beside them.
- Movie cards expose exactly one link; the hover cue is `aria-hidden` and never the only route.
- The featured stage exposes a pause control, marks the current film with `aria-current`, and stops
  auto-advancing once the customer takes control.
- Reveals, the stage and animated numbers all render real content under reduced motion.
- `EmptyState` still exposes heading, body and action alongside a drawing, and still renders without
  one.
- The sold cross has both arms through the centre; seat classes differ by silhouette.

**Not verified** — no screen-reader session, no axe scan. The **CSS** half of reduced motion still
cannot be browser-emulated: neither the MCP `emulate` tool nor the exposed CDP surface offers a
`prefers-reduced-motion` override, so the global `0.01ms` block is covered by inspection only.

---

## Performance

Eager JavaScript, before → after:

| | Before | After |
|---|---|---|
| Eager JS (raw) | 674 KB | **642 KB** |
| Eager JS (gzip) | ~214 KB | **~211 KB** |

**Eager JS went down** while the product gained a full motion system and an artwork system. The
reason: framer-motion's feature bundle is now a genuinely async chunk (~72 KB raw / 24 KB gzip),
loaded after first paint instead of sitting in the eager graph.

That only works because framer-motion is deliberately excluded from `manualChunks`. Two failed
attempts are recorded in `vite.config.ts`: naming a `motion` chunk merged the dynamic import back
into it, and letting the catch-all `vendor` rule claim it inflated vendor to 270 KB.

**Cost control** — seats, availability bars and row arrival are CSS keyframes, not motion
components; a seat map is 200+ nodes and a busy showtimes page carries forty bars. Ambient animation
gates on `usePageVisible()` and `IntersectionObserver`. Artwork geometry is `useMemo`'d and
deterministic. Only transform and opacity are animated.

**Not measured** — no Lighthouse run, no CPU-throttled trace, no field CWV.

---

## Test results

```
Test Files  8 passed (8)
Tests     156 passed (156)
```

23 assertions in `src/motion/revival.test.tsx` cover art-direction determinism and distinctness,
variant re-composition, animated-number accessibility, reveal content preservation, stagger capping,
duration ceilings, card link semantics, stage controls, and three reduced-motion paths.

A further 15 in `src/components/visual/stationery.test.tsx` cover the offer compositions (every offer
designed, all five structurally different, figures traceable to the offer's own copy, variants
re-composed), the counter illustrations (deterministic, the two boxes differ, two sizes of the same
item differ) and the empty states (five distinct drawings, all `aria-hidden`, heading/body/action
still exposed, no-variant fallback intact).

Two more in `SeatMap.test.tsx` guard the cross geometry and the class silhouettes.
**No existing test was weakened or deleted.**

```
✓ tsc -b --noEmit          clean
✓ eslint .                 0 errors (7 react-refresh HMR warnings)
✓ npm run check:assets     6 catalogued · 0 deployable · no violations
✓ vite build               clean
✓ npm run check:classes    121 colour utilities checked, all resolved
```

---

## Anti-slop position

The prohibitions did not soften — they got specific. Absent from the build: scroll hijacking ·
parallax · cursor followers · WebGL · confetti · fake streaming · character-by-character typing ·
bouncing dots · pulsing controls · gradient text · glassmorphism · neon · glowing CTAs · animation
on every element · reveals that replay · spring overshoot on UI state · full-screen fade-to-black ·
marquees · 3D card tilt · stock or generated imagery.

Radial gradients **are** now used — in the seat-map screen glow and behind each artwork family. They
are projected light, which the concept licenses and the design system documents. They are not
background decoration and never sit behind body copy.

Three claims in `design-system.md` were superseded and are marked as such in place: shadows-for-
overlays-only, nothing-animates-on-scroll, and Framer-Motion-on-exactly-two-elements.

---

## Second pass — the three gaps, and a rendering bug

Items 4–6 below were open after the first pass. All three are now built, and closing them surfaced a
defect that had been in the product from the beginning.

### The auditorium was never rendering as designed

Three palette tokens — `house-muted`, `house-faint`, `house-rule` — were used across the seat map,
the confirmation ticket and the no-trailer screen but were **never registered in `@theme inline`**.
Tailwind drops a utility whose token does not exist, silently: `text-house-muted` emitted no CSS at
all, and every one of those ~21 elements fell back to `currentColor`.

The visible result: row letters, legend text and the ticket's field labels all rendered at full
`house-ink` brightness instead of their intended dim tones, and every hairline divider rendered as a
bright `currentColor` rule instead of `#2a2f40`. The auditorium looked flat and over-bright because
**it was drawing the wrong colours everywhere**, not because the design was too restrained.

Nothing in typecheck, lint or the test suite could see this. `npm run check:classes`
([`scripts/check-classes.mjs`](../scripts/check-classes.mjs)) now reads the built stylesheet and
fails if any colour utility written in `src/` produced no rule. Verified by removing
`--color-house-rule` and confirming the check exits 1 naming all 16 sites.

Two related fixes in the same pass:

- **The sold-seat cross was a caret.** Both arms were pinned to the box's *top* edge (`inset-0` +
  `border-t`), so rotating them ±45° about the box centre swung them into a `^`. They are centred
  first now. Guarded by a regression test.
- **Sold seats outranked available ones.** `bg-house-ink/15` on a dark ground is *lighter* than a
  transparent seat, so the unbookable seats were the most prominent thing in the house. Sold now
  recedes to `house-sunken`.
- **`--house-faint` lifted** `#6f7484` → `#7c8092`. At its authored value it measured 3.96:1 on the
  house ground — under AA for the small print it carries. Now 4.71:1.
- **Available seat outline lifted** `/30` → `/40`, from 2.45:1 to 3.43:1, since an available seat is
  an active control and 1.4.11 wants 3:1. Sold and held are `aria-disabled` and therefore exempt.

### Seat classes now carry a silhouette

Regular and premium were distinguishable only by a 4px radius difference and a 10% fill — invisible
at 24px. Class is now carried by shape as well as tone: a rounder back and a deeper bottom border
mean a better seat, so the map reads in greyscale. Border thickening happens inside the box, so
nothing shifts when state changes. The legend reproduces the same silhouettes rather than
approximating them.

### Offers, the counter, and empty states

All three are documented in [`design-system.md`](./design-system.md). In short: five pieces of
stationery replace `OfferPlate` (and `Plate.tsx` is now deleted — both consumers are gone); the
counter is drawn on two axes so thirteen items do not become five repeated pictures; five empty-state
drawings replace the one dashed box.

The honesty rule extends to the artwork: a test asserts every offer figure is traceable to that
offer's own copy, and the counter draws what each item actually contains — one carton and two cups
for the interval box, two and four for the family box, froth rather than steam on a cold lassi.

---

## Known limitations

1. **No screen-reader or axe pass.** Semantics are asserted by test and by DOM inspection.
2. **No Lighthouse or CPU-throttled profiling.**
3. **21st MCP unavailable** — it requires `API_KEY_21ST`, which is not present, and the server is
   unauthorised in this environment. No component ideas were sourced from it.
4. **Hallmark's automated gate list was not machine-run.** The skill's `audit` verb is a
   read-and-report procedure; it was applied by hand against the highest-risk gates (320 px overflow,
   two-line clickables, `overflow-x` backstop, italic headers, stacked eyebrows, invented metrics).
   Findings from that pass were fixed — the `overflow-x: clip` backstop is the one change it produced.

**Now resolved.** Reduced motion is no longer only unit-tested: the JS behaviour path is verified in
the browser by stubbing `matchMedia` through an init script, confirming the featured stage does not
auto-advance after 9 s and that no revealed element is left parked at opacity 0. The CSS half still
cannot be browser-emulated — the MCP surface exposes no `prefers-reduced-motion` override.
