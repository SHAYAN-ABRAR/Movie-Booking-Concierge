# Language and theme — what was built, and what is left

Two global preferences: **English ↔ Bangla** and **Light ↔ Dark**. This records
the architecture, the decisions that are not obvious from the diff, and — at the
end — the parts that are honestly not finished.

## Architecture

| Concern | Where | Note |
| --- | --- | --- |
| The choice | `src/store/preferences.ts` | Zustand `persist`, version 2, with a migration from 1 |
| Applied before paint | `index.html` | Inline IIFE reads storage, sets `data-theme` / `lang` / `color-scheme` / `theme-color` |
| Applied on change | `src/components/preferences/usePreferenceEffects.ts` | Plus a 200 ms colour transition on explicit toggles only |
| Announced | `src/components/preferences/PreferenceAnnouncer.tsx` | Polite live region; skips first render |
| The controls | `src/components/preferences/PreferenceControls.tsx` | Real buttons, `aria-pressed`, 44 px targets |
| Strings | `src/i18n/resources/{en,bn}.ts` | 453 keys, bundled, synchronous |
| Domain vocabulary | `src/i18n/domain.ts` | Genre, format, certificate, amenity, access |
| Numbers and dates | `src/i18n/formatters.ts` | `Intl`, per locale, cached |
| Document title | `src/components/layout/useRouteTitle.ts` | One place, all sixteen routes |

## Decisions worth stating

**No `/bn/` routes.** The language is a preference, not a location. A URL shared
between two people should show each of them the site in their own language.

**No reload on switch.** The store drives i18next, i18next re-renders. Booking
state, filters, scroll position and Max's conversation all survive.

**Resources are bundled and synchronous.** An async backend would make the first
render suspend, and this application has already shipped one defect where the
routed outlet could be empty. Nothing is allowed to make a route wait.

**`themeChosen` / `localeChosen` are separate from the values.** Without them a
saved preference is indistinguishable from a detected one, and the browser's
`prefers-color-scheme` would silently override a deliberate choice on the next
visit. `reset()` deliberately preserves both.

**The domain vocabularies are read-through proxies.** `genreLabels[genre]`
resolves against the active language on every access, which kept seventy-odd
existing call sites working unchanged. The cost is that a proxy read is not a
subscription — `Layout` calls `useTranslation()` and every route is its child,
which is what re-renders them. That contract is asserted by a test that fails if
it is removed (*"re-renders the domain vocabularies, which are proxies rather
than hooks"*).

**Bangla is not English with substituted words.**

- Bengali numerals throughout, with **lakh** grouping: ৳১,১৫,০০০, not ৳১১৫,০০০.
- The part of the day comes **before** the clock: "রাত ৮:৪৫", not "৮:৪৫ রাত".
- Sentence order follows Bangla: "৮টি ছবি জুড়ে ৭৭টি শো" puts the scope first.
- Loanwords where a box office uses them (টিকিট, বুকিং, শোটাইম). See
  [`bangla-glossary.md`](./bangla-glossary.md).

**What deliberately stays Latin.** Booking references, seat identifiers,
certificate codes, telephone numbers, emails, URLs, QR payloads. `identifier()`
exists on the formatter bundle so a call site can *say* it means this.

## Two defects this pass found and fixed

**Print was broken in dark mode.** The print block set `:root` custom
properties, specificity (0,1,0). The dark theme sets them on
`html[data-theme='dark']`, specificity (0,1,1) — so it won, and a customer
printing a ticket while in dark mode got pale type on a dark ground, or on a
printer that drops backgrounds, near-white type on white paper. The print rules
now match `html[data-theme]` to tie the specificity and win on order.

**The animated counter spoke the wrong numerals.** `AnimatedNumber` defaulted to
`String(Math.round(n))`, so a result count ticked 1, 2, 3 beside Bangla copy. It
now defaults to the active locale's formatter.

## Verification

- **166 unit tests** — including 15 dedicated preference tests covering the
  proxy re-render contract, persistence, `lang` / `data-theme` / `color-scheme`,
  the live-region announcement, independence of the two preferences, and the
  formatters (lakh grouping, day-part order, identifier passthrough).
- **59 browser tests, 1 skipped** — including the full four-way matrix
  (en/bn × light/dark) across seven routes, asserting *measured background
  luminance* rather than the attribute alone; no-flash-before-paint; survival of
  a real reload; URL and filter state surviving a switch; document title
  following the language; keyboard operation and `aria-pressed`.
- **`npm run check:i18n`** — 453 keys, parity, no empty values, no interpolation
  or `<Trans>` slot drift, nothing left untranslated, no half-finished plurals.
- **`npm run check:untranslated`** — the ratchet described below.

## What is not finished

The sweep covers navigation, both toggles, all filters, the programme, the
showtimes page, film pages, cinema pages, the counter, offers, the booking
route, the confirmation, my-bookings, empty states, error and loading states,
alerts, seat-map chrome and the showtime buttons.

**127 strings in five files remain English**, all long-form prose:

| File | Strings | What it is |
| --- | ---: | --- |
| `src/components/booking/steps.tsx` | 56 | The booking wizard's step copy and guidance |
| `src/components/max/MaxPanel.tsx` | 23 | Max's panel chrome and disclosure text |
| `src/routes/Contact.tsx` | 22 | Contact routes, forms, opening hours |
| `src/routes/About.tsx` | 15 | The essay about how the build was made |
| `src/routes/TicketPrices.tsx` | 11 | The worked pricing example |

Sample **data** prose is also still English — offer descriptions in
`src/data/offers.ts`, concession bundle copy in `src/data/concessions.ts`, film
synopses and venue notes. Those are content rather than interface, and
localizing them means authoring a second Bangla copy of the sample catalogue.

`scripts/check-untranslated.mjs` holds this at a baseline of 127 and fails the
build if it **rises** — so no new English can be added — and also fails if it
falls without the baseline being lowered, so the number cannot quietly go stale.
Run `npm run check:untranslated -- --list` for the exact lines.
