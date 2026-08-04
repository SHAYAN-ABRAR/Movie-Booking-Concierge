# GrandPlex brand system

## The name

**GrandPlex.** One word, one capital G, one capital P. Declared once in
[`src/config/brand.ts`](../src/config/brand.ts); `npm run check:brand` fails on
anything else.

Not `Grandplex`, not `Grand Plex`, not `GRANDPLEX` as the normal wordmark.

## The wordmark

Text-led, built from the design system rather than dropped in as artwork, so it
inherits the display face, the accent and the theme without a second set of
assets to keep in step.

The idea is **a screen in a dark house**: *Grand* is the room, set plain in
Fraunces; *Plex* is what is projected onto it — same size, same weight, lifted
by a thin marigold rule sitting directly under it like the lit edge of a
screen. A three-perforation sprocket column to the left carries the film-strip
rhythm that runs through the rest of the product.

Deliberately **not**: a reel, a play triangle, a gradient, a sparkle, a crown,
a robot, or "GP" in a glowing circle.

### Construction notes

- The underline is absolutely positioned inside a `relative` span, so it cannot
  affect the line box. The header height never shifts.
- `fontVariationSettings: 'SOFT' 0, 'WONK' 0` — Fraunces' softness and wonk
  axes are dialled out for the mark, so it stays firm where body display type
  is allowed to be warmer.
- One `role="img"` with `aria-label` on the wrapper. Without it a screen reader
  announces "Grand" and "Plex" as two words.

### It is Latin in both languages

The wordmark does not translate. A logo is a piece of artwork, not a
translatable string, and a mark that changes script between sessions is not a
mark. Inside running Bangla prose the transliteration **গ্র্যান্ডপ্লেক্স** is
used — `brand.banglaName` — because a Latin wordmark mid-sentence reads as a
foreign object.

## The monogram

`GP` in a square with the same lit rule beneath it, for the favicon and any
context below about 14px where the full wordmark stops being legible.

The favicon is hand-drawn SVG paths rather than typeset text: a favicon
renderer has no access to the page's fonts.

## Palette

Unchanged by the rebrand. The existing programme identity is the brand — the
rebrand replaced a name, not a design system.

| Token | Role |
| --- | --- |
| `--marigold` | The signal colour. The screen rule, the sprockets, focus. |
| `--projector` / `--projector-lit` | Accent. Inverts role between themes. |
| `--paper` / `--night` | The programme, printed light or printed dark. |
| `--house` | The auditorium — dark in *both* themes, because it is a room. |

## What the brand is not allowed to become

The anti-pattern list this project holds itself to: no purple-blue neon, no
gradient text, no glass cards, no sparkle icons, no floating 3D popcorn, no
"Experience movies like never before", no fabricated review counts, no custom
cursor, no confetti.

The test is whether a frame of the interface could be mistaken for a generated
template. Restraint is the brand.
