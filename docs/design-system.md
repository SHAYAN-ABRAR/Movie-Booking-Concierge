# Design system — GrandPlex

The tokens live in [`src/styles/globals.css`](../src/styles/globals.css). This document explains
them and, more usefully, explains what is *not* allowed and why.

---

## Brand premise

GrandPlex publishes a programme. Five houses, nineteen screens, a slate that turns over every
Thursday, and notes written by someone who watched the films. The site is that programme, made
bookable.

**Voice.** Specific, plain, occasionally dry. It states facts and prices without adjectives. It
never says "experience cinema like never before", never claims an emotion on the reader's behalf,
and never uses a superlative it cannot substantiate. Where something is a demonstration, it says so
in the same tone it uses for everything else.

## Visual concept

**The programme, and the auditorium.**

Two worlds, and the boundary is meaningful:

| | Paper | Auditorium |
|---|---|---|
| Where | Lobby: browsing, comparing, reading | Inside the house: the seat map, the ticket |
| Surface | Warm bone `#F4F1EA` | Blue-black `#101322` |
| Applied via | default | `.auditorium` class |

`.auditorium` re-points the semantic variables, so every component inside it adapts without knowing
it has. It is never applied to a whole page — only to the surfaces that genuinely represent being
inside a screen.

## Design principles

1. **Type is the picture.** No photography was supplied; none is faked. Composition, rule and
   colour carry the weight.
2. **A timetable is a timetable.** Showtimes are set as one, not shredded into cards.
3. **Square by default.** Printed matter rarely curves and never floats.
4. **One ornament.** The stitch. Nothing else decorates.
5. **Never colour alone.** Every state carries a second signal — shape, pattern, or a word.
6. **Say the true thing.** Sample data is labelled sample data, in the same voice as everything else.

---

## The stitch

The only ornament in the system, and it is always drawn.

```css
@utility stitch-x { /* repeating-linear-gradient: 6px mark, 6px gap, 1.5px tall */ }
@utility stitch-y { /* the same, vertical */ }
@utility sprocket-t / sprocket-b { /* radial-gradient mask: a torn perforated edge */ }
```

Used in: the wordmark (flanking sprocket runs), the edge of every film plate, section-heading rules,
empty-state markers, and both edges of the confirmation ticket. Never used as background texture,
never animated, never more than once in a single component.

---

## Typography

Four families, each with a job. All self-hosted through `@fontsource-variable` — no external font
request is ever made.

| Role | Family | Why |
|---|---|---|
| Display | **Fraunces** | Variable serif with optical-size, `SOFT` and `WONK` axes. High contrast, editorial, and specifically *not* a default geometric sans. `WONK` is on for headings and off for film and brand names, which need to sit straight. |
| Text / UI | **Archivo** | Grotesque with genuine tabular figures — the deciding factor, since this product is largely numbers in columns. |
| Bengali | **Anek Bangla** | From a superfamily designed for Indic/Latin harmony. A deliberate pairing, not a fallback: Max replies in Bangla and the venues carry Bengali names. |
| Mono | **JetBrains Mono** | Booking references, seat identifiers, the QR caption. |

Inter, Poppins, Roboto and Montserrat were all rejected as design strategies.

**Type scale** (rem): `0.6875 · 0.75 · 0.8125 · 0.875 · 0.9375 · 1 · 1.0625 · 1.25 · 1.375 · 1.75 · 2.25 · 3 · 4 · 5.25`

Body copy sits at `0.9375–1.0625rem` with `1.6–1.75` leading. Display runs `0.94–1.02` leading with
`-0.02em` to `-0.035em` tracking — tight, as set type should be.

**The eyebrow.** `0.6875rem`, weight 600, `0.14em` tracking, uppercase, muted. The programme's
metadata voice; it appears above nearly every section.

`font-variant-numeric: tabular-nums` is global, so every column of figures aligns without being asked.

---

## Colour

Derived by sampling the supplied references (`ffmpeg palettegen`, `stats_mode=full`) — see
[`asset-inventory.md` §Palette derivation](./asset-inventory.md#palette-derivation) — then
reinterpreted. Sampling gave the *relationships*; copying the hex values would have given the
reference's identity.

**What the sampling found, and what was done with it**

| Found | Decision |
|---|---|
| Every dark value is blue-black, never neutral | Kept, and pushed further: `--house: #101322` is unmistakably indigo ink |
| Periwinkle `#93B2F3` used as a *solid fill*, not a gradient | Kept as solid fill. Deepened to `--projector: #35509C` for ink-on-paper contrast; the light original survives as `--projector-lit` on dark surfaces |
| Cool paper `#EEEEF5` | **Changed.** Warmed to `#F4F1EA` — programme paper, not screen white. The single clearest departure from the reference |
| A sparing warm accent (`#BA887A`, and an orange too rare to reach the top 16) | Read through the kantha craft palette as `--marigold: #C2491A`. Signal colour only |

### Tokens

**Paper (light world)**
`--paper #F4F1EA` · `--paper-raised #FBF9F5` · `--paper-sunken #E9E4D9` · `--ink #14161F` ·
`--ink-muted #4C505E` · `--rule #D6CFC1` · `--rule-strong #B3AA98`

**Auditorium (dark world)**
`--house #101322` · `--house-raised #1A1E2E` · `--house-ink #F0ECE3` · `--house-muted #A0A4B2` ·
`--house-rule #2A2F40`

**Accents**
`--projector #35509C` · `--projector-lit #93B2F3` · `--projector-wash #DFE6F8` ·
`--marigold #C2491A` · `--marigold-lit #F0913C` · `--marigold-wash #F8E6DA`

**Status** — `--ok #2C6349` · `--warn #97640B` · `--danger #9B2C1E`, each with a wash.

**Semantic layer.** Components address `--surface`, `--content`, `--hairline`, `--accent`, `--focus`
and never the raw palette. `.auditorium` re-points those six and the whole subtree follows.

**Contrast.** Ink on paper is 14.8:1. Muted ink on paper is 7.9:1. House ink on house is 13.6:1.
Marigold on paper is 5.1:1 (used for text at ≥14px semibold, and as a fill under white). Every
body-text pairing clears WCAG AA; most clear AAA.

**Marigold is a signal, not a brand colour.** It marks the focus ring, the sprocket runs, sold-out
states, warnings, and Max's mark. It is never a background for large areas.

---

## Spacing, grid and containers

Base 4px. Scale: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128`.

`.shell` — max width `82rem`, centred, with gutters of `max(1rem, safe-area)` → `2rem` at 48rem →
`3rem` at 80rem. Safe-area insets are respected on every fixed element.

**Breakpoints.** `xs 26rem · sm 40rem · md 48rem · lg 64rem · xl 80rem · 2xl 96rem`. `lg` is the
real hinge: sidebars appear, the mobile action bar retires, and Max switches from modal sheet to
anchored panel.

---

## Radius policy

Deliberately severe, and one of the strongest signals that this is not a generated template.

| Token | Value | Permitted use |
|---|---|---|
| *(none)* | `0` | **The default.** Cards, panels, sections, images, dialogs, sheets |
| `--radius-xs` | `2px` | Seats, chips, badges |
| `--radius-sm` | `4px` | Buttons, inputs, selects |
| `--radius-md` | `6px` | Reserved; currently unused |
| `--radius-stub` | `999px` | **Only** perforation dots, radio indicators, switch thumbs, the sheet grabber |

Nothing else rounds. No `rounded-2xl` cards, no pill-shaped filter bars, no capsule CTAs. This is
checked by eye at review and is visible in any diff.

## Borders, rules and shadows

Hairlines at `1px` in `--hairline`; structural rules at `2px` in `--content`. A heavy `2px` ink rule
marks a real division — the top of the footer, the edge of the booking summary, the ticket.

### Depth

Printed matter does not float — but it *lifts*, and a projector throws light. The revised scale is
five steps, and most surfaces still sit at level 0.

| Level | Surface | Treatment |
|---|---|---|
| 0 | Page paper | No shadow. The default, and still the majority |
| 1 | Raised insert | A 1px contact shadow only — paper resting on paper |
| 2 | Interactive artwork | Shadow appears **on hover/focus only**, with a 4px lift |
| 3 | Sticky booking summary, action bars | A soft directional shadow to separate from scrolling content |
| 4 | Overlay — dialog, sheet, Max panel, launcher | The only place a large, soft shadow is allowed |

Shadows are warm-grey (`rgb(20 22 31 / …)`), never black, never coloured, never a glow. A shadow
must read as paper lift, print registration or projector falloff — if it reads as elevation for its
own sake, it is wrong.

*Superseded:* the original rule was "shadows are for overlays only". That prevented slop but also
prevented hierarchy; the scale above is the replacement.

## Material treatment

One texture: a fixed SVG `feTurbulence` grain at 3.5% opacity over the whole page, as an inline data
URI. It is the paper stock. There is no other texture, no gradient mesh, no blur field.

---

## Art direction — how films are shown

With no poster art, each film gets a **hand-authored visual identity**: seven structurally different
composition families, drawn as SVG from the film's own art direction in
[`src/data/artwork.ts`](../src/data/artwork.ts).

| Family | The reading |
|---|---|
| **Aperture** | A projector iris opening off-centre. Headlights on a night road |
| **Strata** | Topographic contours. Land, water, a coastline that has moved |
| **Registration** | Off-register printing — the same block struck three times, out of alignment |
| **Timecode** | Film leader: countdown numeral, frame bands, cue mark, perforations |
| **Lattice** | A building at night. A grid of windows, a few of them lit |
| **Arc** | Sweeping arcs. Sound as geometry, or an orbit seen edge-on |
| **Thread** | The house motif at full scale — a kantha running-stitch field |

The family-to-film pairing is an **editorial judgement about the film**, not a hash of its id. Two
films never share a family *and* a ground — asserted by test, because that is precisely the failure
the previous six-plate system had.

**Four variants, genuinely re-composed rather than scaled:**

| Variant | Aspect | Role |
|---|---|---|
| `card` | 2:3 | Catalogue. Carries its own title |
| `hero` | 5:3 | Detail page and home stage. No title — the page sets it far larger |
| `tile` | 3:2 | Simplified, fewer layers |
| `mark` | 1:1 | The motif reduced to an identity stamp |

Each family draws to the variant's own viewBox, so the card is a condensed crop of the same identity
rather than a shrunken copy of the hero.

**Rules.** The SVG is always `aria-hidden` — every fact it depicts is real text beside it. At most
**one** layer per family may move, and only when the surface asks for it (`animated`) and motion is
allowed. Nothing is fetched, nothing is generated at runtime, and the same film always draws the
same picture.

*Superseded:* the original six-plate system (three colour pairs × two structures) is replaced. It
varied colour and title position but not structure, so a grid of it read as one design recoloured.
`src/components/brand/Plate.tsx` was kept during the transition and has now been removed — both its
consumers (the catalogue and the offers page) draw from the systems below instead.

**Cinemas** get the same treatment differently — a true diagram of their own screens, one bar per
house sized by seat count and coloured by format. It carries information a lobby photograph would
not.

### Offers — cinema stationery

Offers are not films, so they do not use the film families. They use the printed things a box office
hands you, in `src/components/visual/OfferComposition.tsx`, directed from `src/data/offerArt.ts`.

| Composition | Offer | Why |
|---|---|---|
| **Stub** | Before Three | A matinee ticket, torn from the book and punched |
| **Pass** | Family of Four | Four admissions on one perforated strip |
| **Leader** | The Late Repertory | Academy leader running down to a late feature |
| **Insert** | Sensory-Friendly Matinee | A folded programme insert — the quietest of the five |
| **Card** | Student Weeknights | The door checks a student ID, so the offer is a card |

Each prints one **figure** — the value the offer is actually about. A test asserts that figure is
traceable to the offer's own `mechanic`, `detail` or `summary` copy: **the artwork may not invent a
number.** Two variants, `full` (8:5) and `tile` (16:9), drawn to their own viewBoxes.

Only the leader moves, and it makes exactly **one** revolution when it first enters view, then
rests. A countdown that has finished — not a decoration that spins forever.

### The counter — real photography

*Superseded.* `CounterIllustration.tsx` drew each item as authored vector
line-work. It has been **removed**. Every item on the counter now carries its own
real photograph, downloaded once from a commercially-licensed source into
`public/media/concessions/` and rendered by
`src/components/visual/ConcessionPhoto.tsx` as AVIF / WebP / JPEG at three
widths.

No item shares a photograph with another, every file has a recorded creator,
licence and source page in `docs/concession-image-sources.md`, and nothing is
fetched at runtime. `npm run validate:content` fails if an illustration
component is ever mounted on a card again.


### Empty states

`src/components/visual/EmptyStates.tsx`. One dashed box repeated across seven contexts told the
customer nothing about *which* thing was empty. Five drawings replace it: an unfilled projection
schedule, a programme index cut short on the diagonal, a till roll with no lines, a ticket book with
nothing torn out, a notification strip lying flat. `EmptyState` still renders the original stitched
panel when no `variant` is given.

## Image treatment rules

1. One source image, one visual placement. Enforced by `npm run check:assets`.
2. Design-reference material is never rendered. Also enforced.
3. No cropping, mirroring, blurring or recolouring to disguise a reuse.
4. No stock imagery. No generated imagery.
5. Where a picture would be, use type, rule, colour and space — or say plainly that there is none
   (as the trailer state does).

## Icons

Lucide, at `1em`–`1.25em`, inheriting `currentColor`. Always `aria-hidden` with a text label
alongside — no icon is the only carrier of meaning. Never placed in a coloured circle. No rockets,
no lightning bolts, no sparkles.

---

## Motion

| Token | Value |
|---|---|
| `--dur-fast` | 120ms — hover, focus, colour |
| `--dur-base` | 200ms — overlays, popovers |
| `--dur-slow` | 340ms — sheets |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |

The full vocabulary now lives in [`motion-system.md`](./motion-system.md) — durations, easings,
springs, primitives, and the per-surface rationale. The short version:

**What animates:** route changes; section and card reveals (once, never replayed); the featured
stage; catalogue re-ordering under a filter; availability bars measuring out; seat states; the
booking transport marker; running totals; the confirmation ticket; overlays; the Max panel, nudge
and launcher.

**What does not:** parallax · scroll hijacking · cursor followers · WebGL · marquees · floating
objects · confetti · pulsing controls · anything that replays on scroll-back · anything that delays
a state change.

`prefers-reduced-motion: reduce` operates on two layers: the global CSS override collapses every
duration, and `useMotionPreferences()` changes component *behaviour* — the hero stops auto-advancing,
reveals render their children directly, route transitions become a plain swap, and numbers print
instead of counting.

*Superseded:* the original rules were "nothing animates on scroll" and "Framer Motion earns its place
on exactly two elements". Both were guardrails that became a ceiling. The anti-slop principles they
protected are unchanged and are now enforced by named rules rather than by prohibition.

---

## Interaction states

| State | Treatment |
|---|---|
| Hover | Background at 6% content, or a border darkening to 40% |
| Focus | `2px` marigold outline, `2px` offset, `:focus-visible` only — never removed |
| Active | Background at 10–14% content |
| Selected | Solid `--content` fill with `--surface` text |
| Disabled | 40% opacity, `pointer-events: none`, **and always an explanation nearby** |
| Invalid | `--danger` border, danger wash, and a `role="status"` message |

**Disabled controls always say why.** The wizard's Continue button is paired with the specific
blocker ("Choose 3 seats to match your tickets"), never left inert and silent.

---

## Accessibility rules

- Every interactive element is a real control. Chips are `<input type="checkbox">`, the date strip
  is a `radiogroup`, the seat map is a multi-select `listbox`.
- Minimum touch target 44×44 CSS px on every primary control, including the Max launcher.
- No information is conveyed by colour alone. Availability states carry a word *and* a fill bar;
  seat states carry distinct shapes; accessibility markers carry two-letter codes as text.
- Focus is never trapped outside a modal, never lost on close. The Max launcher takes focus back
  when the panel closes.
- Live regions are `polite` throughout. Seat selection, filter results and Max's replies announce
  without interrupting.
- `aria-label` on every seat states row, number, class, price or unavailability, aisle adjacency and
  position in the house.
- Motion, contrast and target size all respect user settings.

## Max's visual treatment

Max belongs to this design system and is styled from it.

- **The mark** — an "M" in Fraunces on a marigold square with a `2px` radius: one sprocket
  perforation. Not a robot, not a sparkle, not an orb, not a gradient bubble.
- **The launcher** — a `2px` ink-bordered rectangle with the visible words **"Ask Max"**. Never
  icon-only, never pulsing, never animated for attention. It steps above the sticky action bar on
  routes that have one.
- **The panel** — `26rem` on desktop, anchored and *non-modal* so the page behind stays usable; a
  modal bottom sheet at `88dvh` on mobile. House typography throughout, at house sizes.
- **Message type** — `0.9375rem/1.5`. User turns are marked with a `2px` ink rule on the left;
  Max's are plain. No chat bubbles, no avatars beside every line.
- **Result cards** — the same hairline-bordered surfaces the rest of the site uses. A showtime
  result in Max looks like a showtime result on the showtimes page, because it is built from the
  same vocabulary.
- **Confirmation** — anything that changes a booking opens a real dialog naming the exact change.
  Anything that changed offers an undo.
- **Attention hierarchy** — unread count on the launcher (marigold, numeric); one nudge per session,
  anchored and dismissible; nothing else ever competes for attention.
