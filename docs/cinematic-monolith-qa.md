# Cinematic Monolith — redesign record

What was changed, what was verified, and what was deliberately left alone.

The brief: give GrandPlex its own recognisable visual identity — roughly 60%
cinematic neo-brutalism, 25% poster-first cinema, 15% Swiss film festival —
without removing a single feature, route, control or behaviour.

Verified against the working tree with `npm run verify` green, the full
Playwright suite green (81 passed, 1 pre-existing skip) on desktop and Pixel 5,
and a manual walk of every route in en/bn × light/dark.

---

## The system

| Before | After |
|---|---|
| Fraunces — a high-contrast editorial serif | Archivo at `wdth 62` — a condensed cinematic grotesque. Display and interface are now the *same face at two widths* |
| Two chromatic accents (projector blue + marigold) competing | **One**: vermilion. Blue demoted to an achromatic steel used only for diagrams and reserved states |
| `rounded-sm` 4px on every control | Zero. `2px` survives on seats only, `999px` on radio dots and the sheet grabber |
| Hairlines everywhere | Three rule weights with three meanings — 1px inside a block, 2px around it, 3px above a section |
| Soft elevation shadows at five levels | Two marks: a hard 4px offset on things that genuinely float, and nothing else |
| Paper `#F4F1EA` / house `#101322` | Bone `#EAE6DE` / pitch `#0B0B0D` — warmer, deeper, more neutral |

Full documentation in [`design-system.md`](./design-system.md).

**Font payload went down**, not up: dropping Fraunces (a full-axis variable
serif) and moving Archivo and Anek Bangla to their `wdth` stylesheets — which
carry the weight range *and* the width axis in one face — leaves 11 woff2 files
totalling 828 KB across every subset, with no new dependency added.

---

## What changed, by surface

| Surface | Change |
|---|---|
| Masthead | Hard bar, 2px close rule, condensed tracked nav, a vermilion slab marking the active route. `BOOK` now visible at *every* width |
| Home | Numbered editorial composition: masthead rail → one-sheet hero → timetable → numbered poster grid → formats → dated list → offers → houses |
| Hero | Title at `clamp(2.75rem, 9.5vw, 8rem)`, artwork in a hard frame, credit block as a festival colophon, programme note set over the still. Trailer action added |
| Programme | Poster plates numbered `01`…, condensed uppercase titles, vermilion projection edge on approach |
| Film page | One-sheet title, poster added beside the credits, numbered sections, tagline as an accent-ruled strapline |
| Showtimes | **Rewritten as a timetable.** One screening per row on a shared left edge — time, format, house, availability, price — replacing a grid of cards |
| Booking wizard | Numbered transport with a perforation rail; step labels in the signage voice; summary panel slabbed |
| Seat map | 2px house edge, warm vermilion screen wash replacing the old periwinkle |
| Counter | Every fifth plate runs wide with the picture beside the copy, so sixteen items are not sixteen identical cards |
| Ticket | **Printed, not revealed.** A box-office thermal printer feeds the ticket out of a slot line by line on the one visit that is the moment of purchase; the receipt itself is the ticket |
| Max | `MAX / Booking concierge`, hard-edged, stamped offset shadow. No orb, no gradient, no glass |
| Footer | Closes with the wordmark set full measure as a colophon |

---

## The box-office printer

`src/components/receipt/` — a compound component (`Root · Machine · Header ·
Screen · Status · Output · Paper`) that feeds a ticket out of a slot the way
the machine at a counter does: ten advance-and-hold steps, because a thermal
head prints a band and the stepper motor advances the paper between bands. It
is the only skeuomorphic object in a system that is otherwise flat and
typographic, and that is deliberate — the reward at the end of a transaction is
allowed to be a physical thing.

Three rules keep it from being a toy:

1. **It never gates content.** The ticket is in the DOM, complete and readable,
   from the first frame. The animation moves it; it does not reveal it. Under
   reduced motion the paper is simply already out.
2. **It runs once.** The stage machine is driven by the booking's own
   `createdAt`. Opening the same reference from My Bookings, or reloading a
   minute later, is not a purchase — so it does not reprint.
3. **It is not the ticket.** The machine is chrome and is `data-print="hide"`.
   The paper is the deliverable: it drops its slot offset, its torn-edge clip
   and its feed transform in print, and goes black on white rather than
   depending on a background colour reaching the paper.

The casing is a fixed material. `.printer` carries its own palette the way
`.auditorium` does, so the machine is moulded charcoal under either theme — a
printer does not turn bone-coloured because the customer prefers a light
interface. It is also the one place in the system with real elevation: a
gradient body, a top highlight, a bottom shade and two outer shadows. An object
that casts no shadow reads as a sticker, and this is the only thing in the
product that is an object.

The screen reuses `.auditorium` rather than a bespoke dark panel — a lit
display in a dark housing is the same material the seat map is made of, and it
is dark in both themes for the same reason. The paper takes the *raised* bone
stock so the roll reads as a separate object in light mode instead of
dissolving into the page.

Getting the sheet to leave the *aperture* rather than the casing is two
constants declared together, because the illusion breaks the moment they
disagree: `SLOT_FROM_BOTTOM` is the depth of moulding below the slot — only a
few pixels — and `PAPER_TUCK` is how far the emerging sheet is pulled up behind
the machine, far enough that its top edge sits inside the slot. The lip throws a
shade down the first few millimetres of paper as it clears.

The compound namespace lives in `index.ts` rather than beside the components: a
module exporting both components and a plain object is not hot-reloadable, and
every component in it gets flagged.

---

## Bugs found and fixed

These were all pre-existing. None was introduced by the redesign; the redesign
is how they surfaced.

1. **The Bangla brand name was never migrated.** Five venue names and the
   company record still read `নকশী` — the pre-rebrand name — in customer-facing
   data. `check:brand` had a pattern for it but written with হ্রস্ব-ই (`নকশি`)
   while the catalogue used দীর্ঘ-ঈ (`নকশী`), so a one-character difference let
   seven strings through a green check for the life of the rebrand. Data fixed;
   the pattern now matches both vowel signs, and the guard was proven to fire on
   a reintroduction.
2. **The screen count was wrong in three places, three different ways.** The
   circuit has 17 screens; the footer said nine, the About lede and the cinemas
   lede said nineteen. All three now agree, and About derives it from the data.
3. **The asset rationale was stale and untrue.** `assetSummary.rationale` still
   claimed the build "deploys no raster media at all" and that "every visual is
   drawn with type" — written before the TMDB film artwork and the generated
   counter imagery shipped. Rewritten to describe what the product actually
   serves, with each manifest named.
4. **The confirmation ticket's detail column was starved.** The QR stub was an
   `auto` grid track, so its width was decided by the max-content of a
   *sentence-long* caption — about 400px — squeezing the `1fr` detail column to
   ~150px and breaking the film title mid-word. Fixed by pinning the stub to a
   measure; the two-column ticket has since been replaced by the printed
   receipt, which is single-column and cannot reproduce the failure.
5. **The review step's date was pinned to English.** It called
   `toLocaleDateString('en-GB')` directly rather than the shared formatter, so
   the date stayed English however the rest of the page was set.
6. **A date-dependent flaky test.** `SeatMap.test.tsx` asserted on
   regular-versus-premium silhouettes using whatever screening happened to be
   first that day — which on some dates is the Velvet Room, where every seat is
   a recliner. It now selects a screening that actually holds both classes.
7. **`Close` was hard-coded English** in the dialog and sheet primitives, and
   the movie card's hover cue (`View showtimes` / `See release details`) was
   too — both invisible to `check:untranslated` because of where they sat.
8. **A missing hook dependency**, introduced and caught in the same pass: the
   booking blocker memo began reading `t` without depending on it, so a language
   change would have left the message in the previous language.

---

## Localisation

The redesign was also the moment to close the largest remaining bilingual gaps,
because a Bangla customer meeting English on the booking path is not a seam, it
is a wall.

| Surface | Before | After |
|---|---|---|
| Booking wizard (`steps.tsx`) | 56 English strings | 0 |
| Seat map | Entirely English — seat classes, states, row labels, every accessible name | Fully translated |
| `Booking.tsx` | 13 English strings, including every blocking message | 0 |
| Confirmation ticket | ~20 English strings | 0 |
| Counter card | Dietary and **allergen** vocabulary in English | Fully translated |
| Max dock | English launcher | Translated |

`check:untranslated` fell from 105 to **55**, and the baseline was lowered to
match. What remains is three pages of essay and reference prose — About,
Contact, TicketPrices — read once, off the booking path, and none of it chrome.

Tests were the thing blocking several of these: `SeatMap.test.tsx` asserted on
hard-coded English constants, which meant those strings *could not* be
translated without the suite failing. `src/test/setup.ts` now loads the real
i18n instance, so components render their actual catalogue copy in tests and a
test can no longer quietly veto a translation.

One typographic correction came out of the same work. `text-transform` was being
reset for Bengali, which does nothing useful — Bengali has no case — while
stripping the caps from Latin words inside a Bangla page (the wordmark, city
names, format codes) and dismantling the Swiss rhythm across half the product.
Only tracking is corrected for Bengali now, which is the setting that actually
harms conjuncts.

---

## Verification

```
npm run verify        typecheck · lint · check:brand · validate:content ·
                      check:assets · check:i18n · check:untranslated ·
                      196 unit tests · build · check:classes    — GREEN
npx playwright test                            81 passed, 1 skip
```

Lint: 0 errors, 8 pre-existing `react-refresh` advisories.

**In-browser, by hand:**

- Home, programme, film page, showtimes, cinemas, cinema page, counter, offers,
  ticket prices, about, contact, bookings, 404 — all four combinations of
  en/bn × light/dark.
- A complete booking, start to finish, in the browser: screening → tickets →
  seats → counter → details → payment → review → confirmation. Reference
  `GP-DF6WF6`, ticket rendered, reference persisted.
- Zero horizontal overflow at 360px on every primary route.
- Console clean — only React Router's informational future-flag warning.

---

## Left unchanged, deliberately

- **All business logic.** Pricing, seat finding, availability, the schedule
  engine, duplicate detection, the `.ics` builder, Max's NLU and skills — no
  behavioural edit anywhere. The redesign is markup, class names and tokens.
- **`nokshi.*` localStorage keys.** Invisible, and renaming them would orphan
  every existing booking. Allowlisted with a reason.
- **The seat silhouettes.** Class is carried by shape as well as tone so the map
  reads in greyscale; that shape vocabulary predates this pass and still works.
- **No trailer autoplay.** Removed in the previous pass for a keyboard-trap
  reason that has not changed.
- **Three prose pages untranslated**, as above.
- **The 500 kB main chunk warning.** Pre-existing, unrelated to this work, and a
  code-splitting decision rather than a design one.
