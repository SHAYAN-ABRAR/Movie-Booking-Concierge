# Visual revival — QA report

Verification of the motion-design and art-direction pass. Baseline commit `e624fe1`.

**Result:** 139 tests passing (was 116) · 0 lint errors · asset check clean · production build clean ·
no console errors · zero horizontal overflow on 11 routes at 320 px.

---

## Baseline observations

Recorded before any edit, in [`visual-revival-audit.md`](./visual-revival-audit.md). In short: the
product read as a well-set *document about* a cinema rather than as a cinema. Three causes — the
design system forbade the things that would fix it, the plate system produced one rectangle in six
colours, and all interaction feedback was border-and-colour.

Captures: [`screens/before/`](./screens/before/) · [`screens/after/`](./screens/after/) —
`home-1440`, `movies-1440`, `movie-details-1440`, `showtimes-1440`, plus `home-390` in the baseline.
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
`components/home/FeaturedStage.tsx` · `data/artwork.ts`

**Modified** — `Layout` · `RouteFallback` · `MovieCard` · `ShowtimeButton` · `HouseDiagram` ·
`QuickBook` · `SeatMap` · `MaxDock` · `Home` · `Movies` · `MovieDetails` · `Booking` ·
`BookingConfirmation` · `hooks/index.ts` · `globals.css` · `vite.config.ts`

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

**Verified by test** (23 new assertions)

- Artwork SVG is `aria-hidden`; the film title is a real heading beside it.
- Movie cards expose exactly one link; the hover cue is `aria-hidden` and never the only route.
- The featured stage exposes a pause control, marks the current film with `aria-current`, and stops
  auto-advancing once the customer takes control.
- Reveals, the stage and animated numbers all render real content under reduced motion.

**Not verified** — no screen-reader session, no axe scan. The MCP surface does not expose
`Emulation.setEmulatedMedia`, so reduced motion was verified through unit tests and the CSS override
rather than by browser emulation.

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
Test Files  7 passed (7)
Tests     139 passed (139)
```

23 new assertions in `src/motion/revival.test.tsx` covering art-direction determinism and
distinctness, variant re-composition, animated-number accessibility, reveal content preservation,
stagger capping, duration ceilings, card link semantics, stage controls, and three reduced-motion
paths. **No existing test was weakened or deleted.**

```
✓ tsc -b --noEmit          clean
✓ eslint .                 0 errors (7 react-refresh HMR warnings)
✓ npm run check:assets     6 catalogued · 0 deployable · no violations
✓ vite build               clean
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

## Known limitations

1. **No screen-reader or axe pass.** Semantics are asserted by test and by DOM inspection.
2. **Reduced motion not browser-emulated** — unit-tested instead, for the reason above.
3. **No Lighthouse or CPU-throttled profiling.**
4. **Offers still use the original `OfferPlate`.** The brief asked for distinct promotional
   compositions (ticket stubs, receipts, passes). Offers received the shared depth and interaction
   improvements but not a bespoke composition system; this is the largest piece of the brief not
   fully delivered.
5. **Concessions has no hand-drawn category illustrations.** It gained the depth and interaction
   vocabulary but not the drawn popcorn/drinks/nachos artwork the brief describes.
6. **Empty states are still the shared dashed panel.** The per-context designed empties (empty
   projection schedule, clipped programme index, counter receipt) are not built.
7. **21st MCP was unavailable** — it requires `API_KEY_21ST`, which is not present. No component
   ideas were sourced from it.
8. **Hallmark's automated gate list was not machine-run.** The skill's `audit` verb is a
   read-and-report procedure; it was applied by hand against the highest-risk gates (320 px overflow,
   two-line clickables, `overflow-x` backstop, italic headers, stacked eyebrows, invented metrics).
   Findings from that pass were fixed — the `overflow-x: clip` backstop is the one change it produced.

Items 4–6 are genuine gaps against the brief rather than deliberate design decisions, and are the
first things to pick up next.
