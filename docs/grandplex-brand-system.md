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

The idea is **a screen in a dark house**: *Grand* is the room, set plain in the
condensed display face; *Plex* is what is projected onto it — the same word, the
same weight, knocked out of a solid vermilion block. Half the wordmark is a
printed slab, which is the whole design system in eight characters.

The first execution of this idea underlined *Plex* with a thin rule. The
Cinematic Monolith pass replaced the rule with the block: at 15px in a header a
hairline underline all but disappears, while a filled block reads at any size
and survives being placed on either ground.

Deliberately **not**: a reel, a play triangle, a gradient, a sparkle, a crown,
a robot, or "GP" in a glowing circle.

### Construction notes

- Both halves are set on the same baseline with matched vertical padding, so the
  block's edges align with the cap height of the plain half and the header
  height never shifts.
- The block is raw `--signal` with white type in *both* themes, not the
  theme-aware `--accent`. A logo is a fixed material; it does not restyle itself
  when the customer changes a preference. White on `#BE2A10` is 5.9:1.
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

The rebrand replaced a name. The Cinematic Monolith pass that followed replaced
the design system underneath it — see
[`design-system.md`](./design-system.md).

| Token | Role |
| --- | --- |
| `--signal` / `--signal-lit` | Vermilion. The only chromatic colour in the system, and the only one allowed to mark an action, a selection or a live state. |
| `--steel` | The achromatic cool, for diagrams and reserved states. Replaced a second chromatic accent that was competing with the signal. |
| `--paper` / `--night` | The programme, printed light or printed dark. |
| `--house` | The auditorium — dark in *both* themes, because it is a room. |

## What the brand is not allowed to become

The anti-pattern list this project holds itself to: no purple-blue neon, no
gradient text, no glass cards, no sparkle icons, no floating 3D popcorn, no
"Experience movies like never before", no fabricated review counts, no custom
cursor, no confetti.

The test is whether a frame of the interface could be mistaken for a generated
template. Restraint is the brand.
