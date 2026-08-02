# Motion system

Everything that moves in Nokshi Cinemas is defined in [`src/motion/`](../src/motion/). No component
writes a raw duration or a raw cubic-bezier; it names an intent and the system decides.

---

## The premise

**Motion here is cinema machinery, not decoration.** Light, film transport, paper, time, seating,
ticketing. If an animation cannot be traced to one of those, it does not ship.

Three rules the whole system is built to enforce:

1. **Motion never gates interaction.** A seat's `aria-selected`, the running total and the button
   state all change on the same frame as the click. The transform catches up afterwards.
2. **Reduced motion changes behaviour, not just speed.** The global CSS override cannot stop a hero
   from auto-advancing or a parallax listener from attaching. `useMotionPreferences()` can.
3. **Nothing reveals twice.** Every scroll reveal is `once: true`. Scrolling back up a page you have
   already read must not replay it at you.

---

## Tokens

[`src/motion/tokens.ts`](../src/motion/tokens.ts). A deliberately short scale — seven durations is
enough, and a short scale is what makes separate components feel like one system.

| Token | Seconds | Used for |
|---|---|---|
| `instant` | 0.11 | Press, toggle, immediate acknowledgement |
| `fast` | 0.19 | Hover, focus, colour and border |
| `base` | 0.28 | Filters, cards, summaries — the workhorse |
| `layout` | 0.36 | A grid re-ordering itself |
| `route` | 0.34 | Route change |
| `reveal` | 0.46 | A section arriving on scroll |
| `cinematic` | 0.85 | Hero and auditorium atmosphere **only** |

A test asserts that nothing except `cinematic` exceeds 0.5s. That is the guardrail against motion
becoming something the customer has to wait through.

**Easings.** `editorial` `cubic-bezier(0.16, 1, 0.3, 1)` is the house curve — a firm decelerating
ease-out that makes type feel *placed* rather than floated. `projection` is slower off the mark, for
light. `exit` is near-linear so leaving elements get out of the way instead of lingering.

**Springs.** All over-damped. This product does not bounce. `seat` (a seat taking your weight),
`press`, `marker` (a shared indicator travelling), `surface` (a panel arriving).

**Stagger is capped.** `staggerFor(count, step, maxTotal)` compresses the step so the last item never
lands later than 0.32s, whether there are four items or forty. Long cascades are the fastest way to
turn motion into a performance.

---

## The primitives

| Primitive | What it does |
|---|---|
| `MotionProvider` | `LazyMotion` + `strict` + `reducedMotion="user"` at the app root |
| `Reveal` | Reveals children once on scroll. Renders plainly under reduced motion |
| `Stagger` / `StaggerItem` | A capped, once-only staggered group |
| `AnimatedNumber` | Counts to a changed value; always exposes the true final value to assistive tech |
| `PageTransition` | Route transition, keyed by pathname |
| `RouteProgress` | A perforation strip that runs *only* while a chunk is genuinely loading |
| `useMotionPreferences` | `reduced`, plus tween/spring/stagger helpers that collapse to zero |
| `usePageVisible` | Gates every ambient animation on tab visibility |
| `useFinePointer` | Pointer effects attach only where a pointer exists |

### `strict` mode is load-bearing

`LazyMotion` is configured with `strict`, which makes the heavyweight `motion.*` components throw.
Every component in this codebase uses `m.*`. The saving cannot be silently undone by a future import
of the wrong thing.

### Why `domMax`, not `domAnimation`

`domAnimation` is ~10 KB smaller but has no layout projection — and this product genuinely uses it:
the marker travelling along the booking transport, the featured-stage indicator, and the catalogue
re-ordering itself when a filter changes. Those are the difference between a marker that *moves* and
one that teleports.

The feature bundle is loaded through a dynamic import, so it is a separate async chunk. That only
works if the bundler leaves it alone — see the note in [`vite.config.ts`](../vite.config.ts) about
why framer-motion is deliberately excluded from `manualChunks`. Naming it in any manual chunk,
including the catch-all `vendor`, merges the dynamic import back into the eager graph and silently
undoes the split.

---

## CSS, not JavaScript, where the count is high

Three places use CSS keyframes rather than motion components, for a specific reason:

| Where | Why |
|---|---|
| Seat states (`@utility seat`) | A seat map is 200+ nodes. 200 motion components to animate a 24px square is not a trade worth making |
| Availability bars (`@utility fill-bar`) | A busy showtimes page carries forty of them |
| Row arrival (`@utility row-enter`) | Per-row delay via a `--row` custom property costs nothing |

Each carries `motion-reduce:animate-none` or is neutralised by the global reduced-motion override.

---

## Reduced motion

Two layers, because one is not enough.

**CSS** — the global `prefers-reduced-motion: reduce` block collapses every duration to `0.01ms`.
This catches transitions and keyframes.

**Behaviour** — `useMotionPreferences()` changes what components *do*:

- The featured stage does not auto-advance.
- `Reveal` and `Stagger` render their children directly, with no `initial` state at all.
- `PageTransition` returns a plain `div` — no `AnimatePresence`, no exit animation.
- `AnimatedNumber` prints the value instead of counting to it.
- The Max launcher's light sweep never fires.
- The confirmation ticket is simply present, fully formed.

Three tests assert the reduced-motion paths render real content rather than an empty stage.

---

## Where motion is used, and why

| Surface | Motion | Reason |
|---|---|---|
| Route change | opacity + 10px rise, 0.34s | Somewhere new, without a page flash |
| Route progress | Travelling perforation | Film through a gate. Shows only while a chunk is actually in flight |
| Featured stage | Scene crossfade, 3 films | The programme is a living thing that changes |
| Movie card | 4px lift, artwork drift, light sweep, drawn rule | Reacts before you click. Driven by `group-hover` **and** `group-focus-within`, so keyboard gets the identical response |
| Catalogue filter | `layout` re-order | The shelf is being narrowed, not replaced |
| Showtime | Bar measures out once; imminent screenings marked | Time is this page's subject |
| Booking step | Directional slide, ±24px | Forward and back feel different |
| Booking transport | Shared marker travels | Progress along a strip of film |
| Seat map | Lights down, rows arrive, seats settle | Arriving in an auditorium |
| Totals | Counted | A price that changes silently loses trust |
| Confirmation | Ticket settles, light passes once, QR fades after | The one moment worth a reveal |
| Max launcher | Lift, press, one sweep on genuinely new events | Physical, never attention-seeking |

## What is still forbidden

The anti-slop position did not soften — it got specific. Still banned, and absent from the build:

Scroll hijacking · parallax · cursor followers · WebGL · confetti · fake streaming · character-by-
character typing · bouncing dots · animation on every element · reveals that replay · pulsing
controls · spring overshoot on UI state · animating width/height where a transform would do ·
motion that delays a state change · full-screen fade-to-black between routes · marquees.

**Superseded claims.** [`design-system.md`](./design-system.md) previously stated that Framer Motion
was used on exactly two elements, that nothing animated on scroll, and that shadows were for
overlays only. All three were guardrails that became a ceiling; they are replaced by the rules above
and the depth scale in that document. The anti-slop principles they were protecting are unchanged.
