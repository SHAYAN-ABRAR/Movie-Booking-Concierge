# GrandPlex — Cinematic Monolith

The tokens live in [`src/styles/globals.css`](../src/styles/globals.css). This document explains
them and, more usefully, explains what is *not* allowed and why.

This system replaced an editorial "printed programme" direction that had drifted into the same
shape as every other modern cinema site: a serif display face, a blue accent, soft-shadowed cards
and rounded controls. The problem was not that it was bad. The problem was that it was
*recognisable* — you could have swapped the wordmark for any other chain's and nothing would have
looked wrong. See [`design-directions.md`](./design-directions.md) for what was considered.

---

## The premise

GrandPlex publishes a programme. Five houses, seventeen screens, a slate that turns over every
Thursday, and notes written by someone who actually watched the films. The site is that programme,
made bookable.

The design language is roughly **60% cinematic neo-brutalism, 25% poster-first cinema, 15% Swiss
film-festival**. Brutalism supplies the confidence — the type weight, the rule structure, the
refusal to round anything. It does *not* supply the usability: nothing here is deliberately hard to
read, no control is hidden to look clever, and every state is stated in words as well as in colour.

**Voice.** Specific, plain, occasionally dry. It states facts and prices without adjectives. It
never says "experience cinema like never before", never claims an emotion on the reader's behalf,
and never uses a superlative it cannot substantiate. Where something is a demonstration, it says so
in the same tone it uses for everything else.

---

## The two worlds

| | Gallery | Auditorium |
|---|---|---|
| Where | Lobby: browsing, comparing, reading | Inside the house: the seat map, the ticket |
| Surface | Bone `#EAE6DE` | Pitch `#0B0B0D` |
| Applied via | default | `.auditorium` class |

`.auditorium` re-points the semantic variables, so every component inside it adapts without knowing
it has. It is never applied to a whole page — only to the surfaces that genuinely represent being
inside a screen. **It is dark in both themes**, because a room does not change colour when a
customer changes their preferences. In dark mode it drops *below* the surrounding page, so walking
into the seat map still reads as going somewhere darker than where you were.

Light and dark are not inversions of one another. Light is a printed festival programme; dark is the
house after the lights drop. Both are designed; neither is a filter over the other.

---

## Design principles

1. **One accent, and it means something.** If a thing is vermilion it is the thing you are meant to
   act on, the seat you have chosen, or the screening about to start. Nothing else may take it.
2. **A timetable is a timetable.** Screenings are set as rows on a shared left edge, not shredded
   into a grid of cards.
3. **Nothing curves and nothing floats.** Square corners, flat fills, no gradients, no glows.
4. **Rules do the structural work.** Three weights, three meanings — see below.
5. **The number comes first.** Films, sections and booking steps are numbered, the way a festival
   programme numbers its entries. It tells you where you are before you have read a word.
6. **Usability outranks the aesthetic.** Where the two conflict, the aesthetic loses. Every
   instance of that is recorded rather than quietly resolved.

---

## Typography

**Two families, four roles.** The display face and the interface face are the *same typeface at two
different widths* — which is what makes the page read as one voice rather than as a pairing.

| Role | Family | Setting |
|---|---|---|
| Display | **Archivo** | `wdth 62`, weight 700, uppercase, `-0.02em` to `-0.035em`. Film titles, section marks, the big numbers |
| Text / UI | **Archivo** | `wdth 100`, weight 400–600. Navigation, timetables, forms, prices — with genuine tabular figures, the deciding factor for a product that is largely numbers in columns |
| Bengali | **Anek Bangla** | The matched Indic superfamily, on the same two settings. Its width axis floors at 75%, so Bangla display type is condensed as far as the face allows and no further |
| Mono | **JetBrains Mono** | Booking references, seat identifiers, times, prices |

All self-hosted through `@fontsource-variable` — no external font request is ever made. The `wdth`
stylesheet carries the full weight range *and* the width axis in one face, so this is one download
per subset, not two.

Inter, Poppins, Roboto and Montserrat were all rejected as design strategies. So, this time, was
Fraunces: a high-contrast old-style serif is the opposite of a monolith, and dropping it removed the
heaviest font payload in the project.

**Type scale** (rem): `0.625 · 0.6875 · 0.75 · 0.8125 · 0.875 · 0.9375 · 1 · 1.0625 · 1.25 · 1.375
· 1.5 · 1.75 · 2.25`, then `clamp()` for anything display-sized.

Display type uses `clamp()` rather than breakpoint steps, so a long film title and a short route
name both fill the measure instead of one of them wrapping into three lines on a tablet. Body copy
sits at `0.9375–1.0625rem` with `1.6–1.7` leading, constrained by `max-w-prose`.

**The eyebrow.** `0.6875rem`, weight 600, `0.16em` tracking, uppercase, faint. Every piece of
metadata in the product is set in it. That is what holds a brutalist grid together: the big type
shouts, and everything else whispers in exactly the same tone.

**Bengali and case.** `text-transform: uppercase` is *not* disabled for Bangla. Bengali has no case,
so uppercase does nothing to it — disabling the rule only stripped the caps from Latin words (the
wordmark, city names, format codes) inside a Bangla page and quietly dismantled the Swiss rhythm in
half the product. What *is* corrected for Bengali is tracking, which pulls conjuncts apart.

---

## Colour

Three grounds and one signal. Everything else is a rule or a shade.

### Tokens

**Bone (light world)**
`--paper #EAE6DE` · `--paper-raised #F4F1EB` · `--paper-sunken #DDD8CE` · `--ink #111113` ·
`--ink-muted #494A4F` · `--ink-faint #74767C` · `--rule #CBC5B8` · `--rule-strong #A49D8E`

**Pitch (the auditorium, dark in both themes)**
`--house #0B0B0D` · `--house-raised #17171A` · `--house-ink #EFEBE3` · `--house-muted #A5A49F` ·
`--house-faint #7E7D79` · `--house-rule #26262A`

**Night (dark theme page)**
`--night #0E0E10` · `--night-raised #17171B` · `--night-ink #F0ECE4` · `--night-muted #A7A6A1` ·
`--night-faint #807F7C` · `--night-rule #26262B`

**Signal — vermilion.** Three values, and which one you use is decided by contrast, not taste.

| Token | Value | Contrast | Use |
|---|---|---|---|
| `--signal` | `#BE2A10` | 4.8:1 on bone | Text, hairlines, small marks on light. White on it is 5.9:1, so a filled button is legitimate |
| `--signal-hot` | `#E8401C` | 3.2:1 on bone | Large display type and solid fills only |
| `--signal-lit` | `#FF5C36` | 6.4:1 on pitch | The dark world's signal |

**Steel.** `--steel #4A5160` · `--steel-lit #9AA3B4` · `--steel-wash #E3E4E8`. Deliberately
desaturated. The previous system had a second chromatic accent (projector blue) competing with the
signal; a monolith gets one accent, and everything structural falls back to grey. Steel flips like
every other ink token in dark mode.

**Status** — `--ok #2C6349` · `--warn #8A5C07` · `--danger #8E1C10`, each with a wash, each lifted
for dark. Danger sits deliberately deeper and browner than the signal, because both are red — and
nothing in this product communicates a failure by hue alone. Every one of them carries a word, and
most carry a disabled state or an icon as well.

**Semantic layer.** Components address `--surface`, `--content`, `--hairline`, `--accent`,
`--accent-contrast` and `--focus`, never the raw palette. `.auditorium` and the dark theme re-point
those and the whole subtree follows.

**The accent pair is the contrast guarantee.** `--accent` / `--accent-contrast` is always a checked
pairing: `#BE2A10` on white (5.9:1) in light, `#FF5C36` on `#140602` (6.2:1) in dark. Filled buttons
never tint themselves on hover — they *swap* to the other guaranteed pair (vermilion → ink, ink →
vermilion), because a tint has to be re-checked at every step while a swap between two verified
pairs cannot drift.

---

## Structure — rules, not boxes

The monolith's rules come in exactly three weights, and they mean different things.

| Weight | Token / utility | Meaning |
|---|---|---|
| 1px | `border-hairline` | A boundary *inside* a block — rows in a list, fields in a form |
| 2px | `.edge`, `border-2` | The boundary *of* a block — a panel that reads as an object |
| 3px | `.slab` | The top of a section. The heaviest mark on the page |

`.slab` opening every section is what produces the repeating horizontal beat when you scroll a long
page — the single cheapest thing in the system and the one doing the most work.

`.grid-rules` draws a hairline grid by showing a 1px gap over a hairline ground: children separated
by exactly one rule, no double borders at the joins, no border on the outside.

### Radius policy

| Token | Value | Permitted use |
|---|---|---|
| *(default)* | `0` | **Everything.** Cards, panels, buttons, inputs, selects, dialogs, sheets |
| `--radius-xs` | `2px` | Seats only — they need a touchable shape |
| `--radius-stub` | `999px` | **Only** radio indicators, switch thumbs, the sheet grabber |

No `rounded-2xl` cards, no pill filter bars, no capsule CTAs.

### Shadows

There are two, and both are deliberate marks rather than depth effects:

- **The stamped offset** — `shadow-[4px_4px_0_0_var(--content)]`, hard-edged, no blur. Used only on
  things that genuinely float over the page: the Max launcher, its nudge, the Max panel, popovers.
  It reads as a printed block sitting on paper.
- **Nothing else.** Dialogs and sheets separate themselves with a 2px ink border and a heavier
  overlay instead of a soft glow. No blurred elevation anywhere.

### Material

One texture: a fixed SVG `feTurbulence` grain over the whole page, inline as a data URI. In the
gallery it is the tooth of uncoated stock; in the auditorium it is projected film — so it runs at 3%
in light and 5.5% in dark, where grain actually lives. There is no other texture, no gradient mesh,
no blur field.

---

## Spacing, grid and containers

Base 4px. Scale: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56 · 64 · 80 · 96 · 128`.

`.shell` — max width `88rem`, centred, gutters `max(1.125rem, safe-area)` → `2rem` at 48rem →
`3.5rem` at 80rem. Wider than a reading measure on purpose: the grid is meant to reach for the edges
of the screen, and running text is constrained separately by `max-w-prose` so the two concerns never
fight.

**Breakpoints.** `xs 26rem · sm 40rem · md 48rem · lg 64rem · xl 80rem · 2xl 96rem`. `lg` is the
real hinge: sidebars appear, the mobile action bar retires, and Max switches from a modal sheet to
an anchored panel.

Every image-bearing grid track uses `minmax(0, 1fr)`, never bare `1fr` — an `auto` track sized by
the max-content of a caption once starved the confirmation ticket's detail column down to 150px and
broke the film title mid-word.

---

## The marks

Four things, and that is the whole ornament vocabulary.

**The slab, the edge** — above.

**The index mark.** `01`, `01 / 06`. Mono, tabular, vermilion. The single most characteristic mark
in the system: it sits beside a film, a section or a booking step and says *where you are in a
sequence*. The numbering a customer meets on the home page continues all the way into the wizard.

**The perforation.** `stitch-x` / `stitch-y` for a quiet rhythm; `sprocket-t` / `sprocket-b` for the
torn edge of the confirmation ticket. Film-strip perforation, drawn, never imaged.

**The wordmark.** `Grand` set plain, `Plex` knocked out of a solid vermilion block. Half the
wordmark is a printed slab, which is the whole design system in eight characters. Latin in both
interface languages — a logo is artwork, not a translatable string.

---

## Controls

Buttons are stamped, not extruded. Square, flat, no shadow, no gradient. What makes them read as
pressable is the label — condensed, uppercase, wide-tracked, the voice of cinema signage — plus a
1px downward shift on press that acknowledges the click on the same frame.

The variants are ranked, and the ranking is the point:

| Variant | Use |
|---|---|
| `accent` | The one action that moves a booking forward. At most one visible per view |
| `primary` | Every other real action |
| `outline` / `subtle` | Available, but not being recommended |
| `ghost` / `link` | Tertiary and inline |
| `danger` | Destructive only |

Form labels speak in the eyebrow voice, so a form reads as part of the programme rather than as a
web form dropped into it. Inputs carry a 2px border that goes to ink on hover and focus.

**Focus** is a 2px `--focus` outline at 2px offset, on everything, everywhere. It is the accent
colour, and the offset guarantees a gap of surface between the element and the ring so it reads even
on a vermilion fill.

---

## Motion

The full system is in [`motion-system.md`](./motion-system.md). What matters here:

- **Two reveal utilities**, both CSS. `curtain` raises a line of type from behind its own baseline;
  `wipe` draws an image or rule on from the left, like a projector opening. A title sequence reveals
  type from behind an edge; it does not fade it in.
- **The duration scale is shared** between CSS custom properties and `src/motion/tokens.ts`, and
  `tokens.test.ts` fails if the two drift.
- **Nothing gates interaction.** The seat map's state, its `aria-selected` and the running total all
  update on the same frame as the click; only the transform is animated.
- `prefers-reduced-motion` neutralises every animation. The two clip-path reveals also have their
  *delay* zeroed, or a staggered line would wait half a second before appearing instantly.

---

## Accessibility rules that are not negotiable

- Every state is carried by shape or word as well as colour. Seat classes have distinct silhouettes;
  availability is a word, a bar position *and* a disabled state.
- Every seat's full description is in its accessible name, in the active language.
- One tab stop in the seat map; arrow keys move within it.
- Hover never carries information. Anything revealed on hover is also always visible on touch.
- Dialogs use Radix: focus trap, Escape, focus restoration. The trailer player does **not**
  autoplay, because Chrome moves focus into the cross-origin iframe when playback starts and a
  browser does not bubble keystrokes out of a cross-origin frame — which trapped keyboard users.
- Contrast: bone/ink is 16.9:1; every muted pairing clears AA; `--house-faint` is held at 5.9:1
  because it carries 11px print.

---

## What this system forbids

Glassmorphism. Gradient meshes. Floating rounded cards. Neon glows. A second accent colour. Italic
headings. Hero banners with a centred headline over a dimmed photograph. Pill-shaped anything.
Drop shadows used as decoration. Emoji as iconography. Any font stack starting with Inter. Copy that
tells the reader how to feel.
