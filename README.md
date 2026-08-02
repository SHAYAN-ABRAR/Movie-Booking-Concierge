# Nokshi Cinemas

A frontend-only movie discovery and ticket-booking product, with **Max**, an on-device booking
concierge.

> **This is a demonstration build.** Nokshi Cinemas is not a real cinema chain. Every film, venue,
> schedule, seat, price, offer and policy here is sample data written for this project. No payment is
> taken, nothing is sent anywhere, and bookings are stored only in your own browser.
> See [`docs/limitations.md`](docs/limitations.md).

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run verify     # typecheck → lint → asset check → tests → build
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck, then a production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b --noEmit`, strict |
| `npm run lint` | ESLint |
| `npm test` | Vitest — **116 tests** |
| `npm run check:assets` | Enforces the one-image-one-slot rule |
| `npm run verify` | All of the above, in order |

Node 20+. No environment variables. No API keys. No services to start.

---

## What is in it

**Fifteen customer-facing routes** — home, catalogue, film details, showtimes, cinemas, a page per
cinema, the concessions counter, offers, ticket prices, a seven-step booking wizard, local booking
history, confirmation, about, contact, and a 404 that suggests what is on.

**A complete guest booking flow.** Screening → tickets → seats → add-ons → details → payment
simulation → review → confirmation. No account, no login, no password anywhere. Selections survive a
refresh and a back-navigation; changing an upstream choice clears only what it actually invalidates.

**A production-quality seat map.** Deterministic availability, five seat classes, aisles, wheelchair
spaces with companion seats, and a real multi-select `listbox` with arrow-key navigation, a single
roving tab stop, per-seat accessible names and polite live announcements. No state depends on colour
alone.

**Max**, a booking concierge that runs on this device. Typed intent detection, deterministic date and
time resolution against your local clock, entity extraction, English and Bangla, and typed
application actions that always confirm before changing a booking and always offer an undo.

---

## The two decisions that shaped everything

### 1. There were no pictures

All six supplied assets turned out to be design-reference recordings of a third-party concept UI —
no logo, no posters, no venue photography, no trailers. Stock and generated imagery were both ruled
out.

So **every visual here is drawn.** Films are presented through generated typographic *plates* built
from their own metadata; cinemas through true diagrams of their own screens, sized by seat count;
offers through set type. Nothing is a placeholder for a picture that should have been there.

→ [`docs/asset-inventory.md`](docs/asset-inventory.md) · [`docs/design-directions.md`](docs/design-directions.md)

### 2. The lights go down

The product runs two worlds, and the boundary means something. **Paper** — warm, light, legible — is
the lobby: browsing, comparing, deciding. **Auditorium** — blue-black — is inside the house: the seat
map, and the ticket. It maps to how you actually move through a cinema, and it gives the seat map its
own world instead of being one more card.

→ [`docs/design-system.md`](docs/design-system.md)

---

## Max

Ask in English or Bangla:

```
Show me sci-fi movies playing after 8 PM tonight
Find three seats near the centre
I need a wheelchair space and a companion seat
What's the cheapest way to book for four?
আজ রাত ৮টার পর বাংলা সিনেমা দেখাও
আগামীকাল বিকেলে তিনটি সিট একসাথে খুঁজে দাও
```

**Max cannot invent a price, a showtime or a seat.** Those are not text it generates — they are
computed by the same functions the booking wizard uses and passed through as typed data. Replies are
structured blocks; effects are typed action objects. Nothing parses Max's prose to decide what to do.

**It will not** complete a purchase, change your seats or basket without confirming, claim to have
contacted staff, claim to monitor live inventory, ask for a password, PIN, OTP or card number, or ask
for a date of birth.

**Optional Ollama layer.** `gpt-oss:120b` via a local Ollama daemon can reword replies — and *only*
reword them. It is off by default, the toggle appears only if a daemon is actually detected, every
number must survive verbatim or the rewrite is discarded, and no API key is used.

→ [`docs/max-assistant.md`](docs/max-assistant.md)

---

## Stack

React 18 · TypeScript (strict, `noUncheckedIndexedAccess`) · Vite 6 · Tailwind CSS v4 · Radix UI ·
React Router 6 · Zustand (persisted) · React Hook Form + Zod · date-fns · Framer Motion (two
elements) · Lucide · qrcode.react · Vitest + Testing Library.

Fonts are self-hosted: **Fraunces** (display), **Archivo** (text, tabular figures), **Anek Bangla**
(Bengali), **JetBrains Mono** (references). No external font request is ever made.

```
src/
  data/        Seed catalogue + the deterministic schedule engine
  lib/         Pricing, seat-finding, dates, formatting, .ics — all pure
  store/       Zustand stores (booking, bookings, preferences, watches, reports, max)
  max/         Types, NLU pipeline, skills, providers, context, executor
  components/  ui · layout · brand · movie · showtime · booking · concessions · cinema · max
  routes/      One file per route
```

---

## Verification

| Gate | Result |
|---|---|
| Typecheck (strict) | ✅ clean |
| ESLint | ✅ 0 errors |
| Asset check | ✅ 6 catalogued · 0 deployable · no violations |
| Tests | ✅ **116 passing** across 6 files |
| Production build | ✅ clean |

Tests cover schedule determinism, pricing arithmetic, age-category rules, the NLU pipeline in both
languages, seat finding, the seat map's keyboard and ARIA behaviour, every route rendering, and a set
of *honesty guarantees* — that the schedule is labelled as sample data, that no password field exists
anywhere in the booking flow, and that incomplete allergen data is flagged rather than glossed over.

ESLint enforces two of the project's constraints as rules: `eval`/`new Function()` and
`dangerouslySetInnerHTML` are errors. Neither appears in `src/`.

→ [`docs/qa-report.md`](docs/qa-report.md)

---

## Documentation

| | |
|---|---|
| [`reference-audit.md`](docs/reference-audit.md) | What was learned from the reference sites, with confidence levels |
| [`asset-inventory.md`](docs/asset-inventory.md) | Every supplied file, classified, hashed, with the palette derivation |
| [`design-directions.md`](docs/design-directions.md) | Three directions, evaluated; why this one won |
| [`design-system.md`](docs/design-system.md) | Tokens, type, colour, motion, and what is forbidden |
| [`max-assistant.md`](docs/max-assistant.md) | Max's architecture, capabilities and guarantees |
| [`tooling-report.md`](docs/tooling-report.md) | What was configured, what ran, what could not |
| [`qa-report.md`](docs/qa-report.md) | Accessibility, performance, responsive and anti-slop review |
| [`limitations.md`](docs/limitations.md) | What this build is not |
