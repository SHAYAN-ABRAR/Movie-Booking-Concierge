# GrandPlex upgrade — pre-work audit

What the tree looked like before this pass, recorded so the migration decisions
below can be judged against the real starting state rather than a guess.

Audited 2026-08-03 against the working tree at `8937ae9`, with the dev server on
port 5174. `npm run verify` was green before any edit: 0 lint errors, 166 unit
tests, 59 browser tests, build clean.

## Brand references

**114 occurrences of `Nokshi` / `নকশি` across 40 files.** By weight:

| File | Hits | Kind |
| --- | ---: | --- |
| `src/data/cinemas.ts` | 16 | Venue names — "Nokshi Dhanmondi" etc. |
| `src/i18n/resources/en.ts` | 11 | Interface copy |
| `src/i18n/resources/bn.ts` | 10 | Interface copy (নকশি সিনেমাস) |
| `src/data/policies.ts` | 7 | Company record, support contacts |
| `src/routes/About.tsx` | 4 | Essay prose |
| `src/data/offers.ts` | 4 | Offer descriptions |
| `index.html` | 3 | `<title>`, meta description, bootstrap comment |
| Remainder | 59 | Stores, components, tests, docs, README, package metadata |

Customer-facing surfaces carrying the old brand: header wordmark, footer,
document title, meta description, About, Contact, cinema names, offers, the
error boundary, Max's welcome copy, and both translation catalogues.

## Booking references

- Generated in `src/store/bookings.ts:153` — `` return `NK-${code}` ``.
- Format: `NK-` + 6 uppercase alphanumerics, e.g. `NK-7F2K9Q`.
- Referenced by 8 test assertions across `tests/e2e/helpers.ts`,
  `tests/e2e/booking-confirmation.spec.ts`, `src/routes/routes.test.tsx` and
  `src/max/nlu.test.ts`.
- Max's NLU extracts references with a pattern that must keep matching both.

## localStorage keys

Six, all prefixed `nokshi.`:

| Key | Store |
| --- | --- |
| `nokshi.preferences.v1` | Cinema, accessibility, locale, theme |
| `nokshi.booking.v1` | The in-progress booking |
| `nokshi.bookings.v1` | Completed booking history |
| `nokshi.max.v1` | Max's conversation |
| `nokshi.reports.v1` | Lost-property drafts |
| `nokshi.watches.v1` | Local demo alerts |

These are invisible implementation details. The decision taken, and the reason,
is recorded in [`grandplex-migration.md`](./grandplex-migration.md).

## Trailers

- `src/data/types.ts:104` — `trailerSrc?: string`, documented as "Local trailer
  file in /public, when one exists. **None are supplied.**"
- **0 of 14 films had a trailer.** Every film page rendered the honest
  "No trailer available" empty state.
- The only consumer was `src/routes/MovieDetails.tsx:283`, a bare `<video>`.
- No YouTube integration of any kind existed; nothing to migrate.

## Stories

- No `shortStory` field. `synopsis`, `tagline` and `programmeNote` existed.
- `synopsis` is a full paragraph, used once on Movie Details.
- No movie-selection surface showed any story: Quick Book, the Showtimes
  selector and Booking step 1 all showed title and metadata only.

## Concession imagery

- 16 items in `src/data/concessions.ts`, 5 categories.
- `src/data/concessionMedia.ts` holds a `ConcessionPhoto[]` with real
  photographer attribution — `creator`, `provider`, `licence`, `licenceUrl`,
  `sourcePage`, `downloadedAt`.
- Photographs were sourced from Openverse/rawpixel under CC0 and committed to
  `public/media/concessions/` at 480 and 800 px.
- Quality was uneven: several are clearly stock shots rather than a coherent
  counter series, and the set does not read as one photographic language.
- Attribution metadata must change, not just the files — leaving a real
  photographer's name on a generated image would be a false credit.

## Movie catalogue

Real, verified, and already correct — 8 now-showing, 6 coming-soon, each with a
local poster and backdrop and a `metadataSource` / `verifiedAt` pair. No
fictional titles remain, so the real-catalogue correction the brief allows for
was not needed.

## Interaction inconsistencies noted

- Movie cards had a poster scale on hover but no focus-visible equivalent on the
  image.
- Concession cards had no hover treatment on the photograph at all.
- Several controls used `transition-colors` while neighbours used none.
- No shared motion timing scale beyond `src/motion/tokens.ts`, which existed but
  was not applied consistently outside the motion package.

## Console and build

- Console clean on every route in both themes; the only message is React
  Router's `v7_startTransition` future-flag warning, which is informational.
- No failed network requests.
- Production build clean; one chunk-size warning over 500 kB, pre-existing.
- Booking confirmation works and survives refresh — the defect fixed in
  `3014fb5` has not regressed.

## Trailer research method

Search results cannot be trusted on titles: a video called
*"Spider-Man: Brand New Day (2026) | OFFICIAL TRAILER 2 | Sony Pictures
Entertainment"* turned out to be uploaded by a channel called **The Film
Scene**. Titles are written by whoever uploads.

`scripts/verify-trailers.mjs` therefore reads `author_name` from YouTube's
public oEmbed endpoint and checks it against an explicit list of studio,
franchise and official regional-distributor channels. It rejected candidates
from The Film Scene, Animation Society, Screendollars, IGN, ONE Media,
OnePress TV, Entertainment Tonight, Rotten Tomatoes and Teaser Universe — and
also from **The Rock**, Dwayne Johnson's own channel, which posted an authentic
Moana trailer that is nonetheless not the distributor's upload.

All 14 films were resolved to a verified official upload. Full table in
[`movie-trailer-sources.md`](./movie-trailer-sources.md).
