# Design system — Nokshi Cinemas

The tokens live in [`src/styles/globals.css`](../src/styles/globals.css). This document explains
them and, more usefully, explains what is *not* allowed and why.

---

## Brand premise

Nokshi Cinemas publishes a programme. Five houses, nineteen screens, a slate that turns over every
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

**Shadows are for overlays only.** Dialogs, sheets, popovers, the Max panel and the launcher. No
card, button or section carries one. Printed matter does not float.

## Material treatment

One texture: a fixed SVG `feTurbulence` grain at 3.5% opacity over the whole page, as an inline data
URI. It is the paper stock. There is no other texture, no gradient mesh, no blur field.

---

## Plates — how films are shown

With no poster art, each film gets a **plate**: a composition of its own metadata.

Six plates = **three colour pairs × two structures**. Colour alone would have produced six versions
of one layout; varying the structure is what stops a catalogue grid reading as a template.

| | |
|---|---|
| Pairs | A ink ground / paper text / marigold rule · B projector ground / lit text · C paper-sunken ground / ink text / projector rule |
| Structures | **offset** — title bottom-left, sprockets on the left edge, runtime set huge at 13% opacity top-right · **centred** — title centred between rules, sprockets on both edges, runtime bottom-centre |

The plate is `role="presentation"`: everything in it appears as real text beside it, so a screen
reader gets one meaningful link rather than a duplicate.

**Cinemas** get the same treatment differently — a true diagram of their own screens, one bar per
house sized by seat count and coloured by format. It carries information a lobby photograph would
not.

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

**What animates:** overlay entrances and exits; the Max panel and nudge; a 4px lift on catalogue
cards; colour transitions on interactive elements.

**What does not:** section entrances. Nothing animates on scroll. There is no parallax, no scroll
hijacking, no cursor-follower, no marquee, no floating objects, no WebGL.

`prefers-reduced-motion: reduce` collapses every duration to `0.01ms` globally, and Framer Motion's
`useReducedMotion` disables the panel and nudge transforms independently.

Framer Motion earns its place on exactly two elements — the Max panel and nudge — where React needs
a genuine exit animation. Everything else is CSS.

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
