# GrandPlex upgrade — QA record

What was done, what was verified, and what is honestly not finished.

Verified against the working tree through commit `ecf52ac`, dev server on
5174, production preview on 4174.

## Brand

| Check | Result |
| --- | --- |
| Canonical name everywhere | GrandPlex — one spelling, one capitalisation |
| Customer-facing `Nokshi` / `নকশি` | None renders; `check:brand` enforces |
| Header, footer, title, meta | GrandPlex |
| About, Contact, offers, venues | GrandPlex (5 venues renamed) |
| Max | GrandPlex (name "Max" unchanged) |
| Booking confirmation + ticket | GrandPlex, verified in-browser |
| `.ics` / calendar output | GrandPlex |
| English + Bangla catalogues | GrandPlex wordmark; গ্র্যান্ডপ্লেক্স in prose |
| `check:brand` in `verify` | Passing; proven to catch a reintroduced string |

**Permitted legacy references:** the `nokshi.*` localStorage keys (invisible;
renaming risks booking history — see `grandplex-migration.md`), and the docs
that explain the migration. Each is allowlisted by path with a reason.

## Booking references

| Check | Result |
| --- | --- |
| New bookings | `GP-` — live example `GP-A2BZ99` |
| Existing `NK-` opens | Yes; `isBookingReference` accepts both |
| Max recognises both | Yes; NLU tests cover `GP-` and `NK-` |
| Duplicate protection | Unaffected (matches on screening/seats/email) |
| Confirmation survives reload | Yes; e2e desktop + mobile |
| New `NK-` generation | Impossible; `check:brand` fails on it |

## Trailers

| Check | Result |
| --- | --- |
| Films with a verified official trailer | 14 / 14 |
| Verification method | YouTube oEmbed `author_name`, not video title |
| Fan / concept / reaction uploads | Rejected — 12 named impostors incl. "The Rock" |
| `npm run verify:trailers` | 14 / 14 against official channels |
| iframe before activation | None — proven in-browser, 0 on `/movies` |
| Privacy-enhanced host | `youtube-nocookie.com` |
| Autoplay on page load | None |
| Autoplay in dialog | **Removed** — broke Escape (see below) |
| Close stops playback | Yes — iframe unmounts |
| Focus returns to trigger | Yes — e2e verified |
| Blocked-embed recovery link | Always present |
| One player ever | Enforced by a single shared viewer; e2e verified |
| Max opens the correct trailer | Yes — typed action carries the movie id |
| Entry points | Home feature, movie card, film page, story panel, Showtimes header, Max |

### The autoplay finding

The e2e suite caught it: with autoplay, Chrome moves focus **into** the
cross-origin YouTube iframe when playback starts, and a browser does not bubble
keystrokes out of a cross-origin frame. So Escape could no longer close the
dialog — a keyboard user was trapped. The brief permits autoplay only "if
accessibility remains reliable"; it did not, so autoplay is gone. Focus now
lands on the Close button via `onOpenAutoFocus`, and the customer presses the
embed's own play control.

## Stories

| Check | Result |
| --- | --- |
| English short story per film | 14 / 14 |
| Bangla short story per film | 14 / 14, Bengali script verified |
| Spoiler-free | Premise + central conflict only |
| Not a synopsis copy | `validate:content` + unit test (equality, wrap, slice) |
| 30–95 words | Enforced |
| No marketing filler | Unit test guards 6 stock phrases |
| Panel under selected film | Quick Book, booking step 1 |
| Not under every card | Showtimes gets a trailer action, not a story panel |
| Updates on selection change | e2e verified; announced politely |
| Film page hierarchy | Short story near metadata; "Full synopsis" section below |

## Concessions — NOT DONE

The AI concession imagery is **blocked** and honestly incomplete. Higgsfield MCP
is out of credits and Recraft requires a paid plan. Rather than take any of the
forbidden shortcuts:

- No stock photos were relabelled as AI-generated.
- No CSS drawings were substituted.
- The existing licensed photographs remain, with their real photographer
  attribution intact — the honest state until replacements exist.

Ready to run the moment a credential is available:
`scripts/generate-concession-images.mjs` (all 16 prompts, shared art direction,
combo counts spelled out), the review checklist, and the manifest/attribution
change — all in `concession-ai-image-manifest.md`.

So: the card redesign, the AI-image disclosure copy (written but not yet shown),
and the concession image tests remain **not done**.

## Localization

| Check | Result |
| --- | --- |
| New trailer / story / Max copy | Both languages |
| `check:i18n` | 491 keys, parity, no drift |
| Max panel chrome | Translated (baseline 127 → 104) |
| Raw key rendering | None |

## Motion

| Check | Result |
| --- | --- |
| CSS and JS scales aligned | Yes — were two scales; `tokens.test.ts` guards it |
| `transition-all` | None |
| Raw durations | None — all named tokens |
| Reduced motion | Respected throughout |

## Tests

```
npm run verify        typecheck · lint · check:brand · validate:content ·
                      check:assets · check:i18n · check:untranslated ·
                      195 unit tests · build · check:classes    — GREEN
npm run verify:trailers                              14/14      — GREEN
npx playwright test tests/e2e/booking-confirmation   12/12      — GREEN
npx playwright test tests/e2e/trailers-and-stories   20/20      — GREEN
npx playwright test tests/e2e/preferences            19/20, 1 skip
```

Lint: 0 errors, 8 pre-existing `react-refresh/only-export-components` warnings.

## Browser verification

Manually, on the production-adjacent dev preview:

- Home: GrandPlex branding, light + dark, en + bn — ✓
- Mobile header (390px): GrandPlex wordmark — ✓
- Trailer from home feature and film page: opens, one nocookie iframe, closes,
  focus returns — ✓
- Programme page: 8 cards, 8 trailer controls, 0 iframes until asked — ✓
- Quick Book: story appears on selection, updates on change, carries the right
  trailer — ✓
- Booking step 1: story leads the session step — ✓
- Full booking: completed, `GP-A2BZ99`, confirmation not blank, GrandPlex
  ticket, demonstration marker — ✓
- Max in Bangla: panel chrome Bangla, story response Bangla, trailer action — ✓
- Console: clean (only React Router's informational future-flag warning) — ✓

## Screenshots

`docs/screenshots/grandplex-upgrade/` — 11 of 14:

home light/dark · mobile header · movies-with-trailers · trailer dialog
desktop/mobile · selected-movie story en/bn · booking session story · booking
confirmation · Max in Bangla.

Missing: `concessions-ai-light/dark/mobile.png` — deferred with the imagery.
Capturing the current licensed photos under an "AI" filename would be false.

## Honest remaining limitations

1. **Concession AI imagery** — blocked on a credential. Everything downstream
   (card redesign, disclosure display, concession tests, 3 screenshots) waits
   on it.
2. **104 English strings in 4 prose files** — the booking wizard's step copy,
   Contact, About, TicketPrices. Long-form prose, held by the `check:untranslated`
   ratchet so no *new* English can be added.
3. **8 lint warnings** — pre-existing `react-refresh` fast-refresh advisories,
   not introduced here.
