# Max — the booking concierge

Max is a local conversational assistant with a typed contract to the application. It is not a chat
widget bolted onto the side; it reads the same data, calls the same pricing and seat-finding
functions, and writes through the same stores as the rest of the product.

---

## What Max is, precisely

**A deterministic natural-language interface to this application's own logic.**

There is no model in the default path. A message goes through a nine-stage pipeline that produces a
typed `MaxParse`; a skill turns that parse plus the current application context into a typed
`MaxReply` made of **response blocks** and **actions**; the UI renders the blocks and the executor
runs the actions.

The consequence that matters: **Max cannot invent a price, a showtime or a seat.** Those values do
not exist as text for it to generate — they are computed by the same functions the booking wizard
uses, and passed through as structured data.

---

## Architecture

```
src/max/
  types.ts           Intents, entities, actions, blocks, provider contract
  nlu.ts             The pipeline: normalise → detect → score → extract → resolve → confidence
  skills.ts          One handler per intent; the only source of application behaviour
  localProvider.ts   LocalMaxAssistantProvider — the default, and the only one that acts
  ollamaProvider.ts  Optional phrasing layer (off by default; see below)
  context.ts         Assembles MaxContext from the router and the stores
  executor.ts        Runs typed actions. Validates, reports, offers undo
src/store/max.ts     Conversation state (sessionStorage)
src/components/max/  MaxDock (launcher, nudge), MaxPanel, blocks, DemoAlertRunner
```

### The pipeline

| # | Stage | Detail |
|---|---|---|
| 1 | **Normalise** | Lowercase, collapse whitespace, straighten quotes, **convert Bengali digits** (`৮` → `8`) so both scripts take one path |
| 2 | **Detect language** | Script-ratio based. Bengali-dominant → `bn`, otherwise `en` |
| 3 | **Score intents** | ~25 weighted rule sets over 30 intents, with entity-presence boosts |
| 4 | **Extract entities** | Titles, cinemas, genres, languages, formats, accessibility, runtime, party size, budget, seat preference, ticket categories, allergens, booking references |
| 5 | **Resolve dates** | Against the viewer's **local** clock — today, tonight, tomorrow, পরশু, this weekend, next Friday, `d/m`, ISO |
| 6 | **Resolve times** | "after 8pm", a bare "after 8" (read as evening — what people mean), before lunch, after dinner, this afternoon, late night, and the **postpositional Bengali form** `৮টার পর` |
| 7 | **Check the catalogue** | Entities are matched against real seed data; unmatched values are dropped, not carried |
| 8 | **Score confidence** | Reduced when two intents tie within 0.08, and when a short message carries no entities |
| 9 | **Clarify or answer** | Below 0.45 *and* with no concrete entities → a short clarification with concrete options |

Stage 9's second condition matters: a confident-enough parse that carries real entities is answered
rather than interrogated. Asking "which cinema?" when the user already said "at Bashundhara" is
worse than guessing.

**A note on Bengali and `\b`.** JavaScript's word boundary never matches beside Bengali script,
because Bengali characters are not `\w`. Every Bengali alternative is therefore tested without a
boundary, and longer forms are tested first (আগামীকাল before কাল; আজকে before আজ). Getting this
wrong silently breaks all Bangla date handling — it is covered by tests.

### Typed actions, never parsed prose

```ts
type MaxAction =
  | { type: 'apply_filters'; label: string; filter: MovieFilter; to?: string }
  | { type: 'apply_seats'; label: string; seatIds: string[]; confirm: MaxConfirmation }
  | { type: 'add_concessions'; label: string; items: […]; confirm: MaxConfirmation }
  | { type: 'create_watch'; label: string; kind: WatchKind; showtimeId: string }
  | …
```

Every action carries a valid target. The executor validates it, returns `{ ok, message, undo? }`,
and the result is posted back into the transcript so the customer sees exactly what happened.

**Anything that changes booking state carries a `confirm`** — a real dialog naming the exact change
— and returns an `undo`.

### What Max will not do

- **Never completes a purchase.** There is no action that submits a booking. Confirmation happens
  only on the review page, through the normal control.
- **Never changes seats, tickets or the basket without an explicit confirmation.**
- **Never asks for a password, PIN, OTP, card number or account credential.** Stated in the composer
  footer, and there is no code path that could.
- **Never asks for a date of birth.** Age *categories* are sufficient and are what it works with.
- **Never claims to have contacted staff, submitted a report, filed a claim, or monitored live
  inventory.**

---

## Providers

```ts
interface MaxAssistantProvider {
  readonly id: 'local' | 'ollama';
  respond(input: MaxProviderInput): Promise<MaxReply>;
}
```

### `LocalMaxAssistantProvider` — the default

The only provider that produces application behaviour. Runs entirely on-device, needs no network, no
key and no configuration.

### `createOllamaProvider(model)` — optional, off by default

The brief asked for `gpt-oss:120b` via Ollama. It is implemented, and constrained so it cannot
compromise anything:

1. **It wraps the local provider.** The local reply is computed first, in full.
2. **It may only rewrite `reply.text`.** Blocks, actions, prices, showtimes and seat suggestions pass
   through untouched.
3. **Its output is validated.** Every number in the draft must survive verbatim, the length is
   bounded, and banned filler phrases ("Great question", "As an AI", "Anything else?") cause a
   rejection. A failed rewrite silently falls back to the local text.
4. **It is off until switched on**, and the switch only appears when a daemon is actually detected —
   so there is no dead toggle in the interface.
5. **The panel states plainly what is sent**, including that a `-cloud` model tag makes the local
   daemon relay onward to Ollama's servers.
6. **No API key**, at any point. The endpoint is `http://localhost:11434`.
7. **Any failure** — daemon down, model missing, timeout, dropped number — falls back to local.

To try it: `ollama serve`, then `ollama pull gpt-oss:120b`, reload, open Max → **?** → toggle on.
Without Ollama, nothing about Max changes and no control appears.

---

## Context

`MaxContext` is assembled fresh each turn from the router and the stores:

route · viewed film · selected cinema · date · showtime · active filters · booking step · ticket
counts · selected seats · concessions · insurance · running subtotal · **the wizard's current
blocker** · local booking references · saved watches · accessibility preferences · the current time.

The blocker mirrors the wizard's own gate, so Max explains the same reason the Continue button is
disabled rather than offering a second opinion.

No store internals, persistence keys or implementation details are exposed.

### Contextual behaviour

- No showtime selected → Max says there is no seat map yet rather than discussing seats.
- Showtime changes → previous seat suggestions are no longer offered.
- Ticket count changes → a seat suggestion that no longer matches is flagged, and the apply action
  is withheld until it does.
- A seat goes while the customer is elsewhere in the flow → the wizard and Max both surface it.
- Navigating backwards preserves conversation context without replaying stale actions.

### Suggested prompts

Context-aware, never the same set twice. `suggestedPrompts()` returns different prompts for home,
the catalogue, a film page, the showtimes page, a cinema page, the counter, the bookings list, the
confirmation, and **each step of the wizard separately** — seat-selection prompts differ from
payment-step prompts.

---

## Capabilities

**Discovery and comparison** — find films by genre, language, format, runtime, certificate, price
and accessibility; find screenings by date and time window; compare up to four screenings on start,
end, format, price, seat availability and access provisions; identify the cheapest option including
fees.

**Seats** — recommendations by party size, adjacency, aisle or centre preference, front/middle/back,
wheelchair spaces with companion seats, reduced walking, premium preference and budget. Every
recommendation is explained. Splits are named as splits. Suggestions are *proposed* on the map
first; applying them is a separate, confirmed step.

**Pricing** — line-by-line explanation of how a price was reached, age-category rules, budget
optimisation. The booking fee appears in every figure; nothing is ever quoted net of it.

**Accessibility** — filtering by any provision, and a clear explanation of the difference between
open and closed captions. Where data is absent, Max says so and gives the venue's contact details
rather than guessing.

**Concessions** — recommendations within a budget, respecting dietary preferences and declared
allergen exclusions, sized for the group. **Where allergen data is incomplete, Max says so and tells
the customer to check with staff.** It never presents allergen information as a medical guarantee.

**Policy** — answers from the local knowledge base in English or Bangla. Where there is no match:
*"I don't have verified information for that in this local demo"*, plus a contact route.

**Bookings, arrival and aftercare** — looks up local bookings; compares the current time against the
start, the trailer duration and the venue's late-arrival policy, and offers later screenings;
answers runtime, end time and interval questions; surfaces **explicitly stored** break windows only,
behind a spoiler reveal, and says plainly when a film has none rather than inferring from plot.

**Watches, lost property, cover** — see below.

---

## The three honest workflows

These are the features where it would be easiest to lie to the user. Each is built so it cannot.

### Demonstration alerts

A watch monitors nothing. To make the *behaviour* demonstrable, each saved watch fires exactly one
deterministic demo event, derived from the watch itself, about forty seconds after it is created.

Every surface says so. Alerts land in the in-app notification centre, which is the fallback that
always works. Browser notifications are used only if the customer opts in **and** the browser has
granted permission — asked at most once, tracked in preferences, never re-prompted. Nothing is
emailed or texted, no other device is notified, and clearing browser data deletes the watch.

Max's own wording: *"I can save a local demo alert for this showtime. It only works in this browser
and does not monitor live cinema inventory."*

### Lost property

Max assembles a report — prefilled from the booking with screening, screen and seats where one
exists — saves it locally **only with consent**, generates a local reference, and copies a
plain-text summary to the clipboard.

It then says the report has **not** been sent, and gives the house's own lost-property email and
phone so the customer can send it. There is no submit button, because there is nothing to submit to.
The report type is shaped so a real staff-notification adapter could be added later without changing
the customer-facing flow.

### Ticket Cover claims

Where a booking includes cover, Max explains the sample terms, shows the covered reasons and the
exclusions, asks only for a reason *category*, prepares a checklist and a local draft, and gives the
insurer's contact details.

It states that nothing has been submitted, never fabricates an approval status, never promises
reimbursement, and never interprets the policy beyond the supplied data. Where a booking has no
cover, it says so directly.

---

## The interface

**Desktop** — a `26rem` anchored panel, deliberately **non-modal**, so the page stays visible and
usable while Max talks about it.

**Mobile** — a modal bottom sheet at `88dvh`, safe-area aware, with the composer pinned above the
keyboard and background interaction blocked.

**The launcher** — bottom-right, always carrying the visible words **"Ask Max"**, ≥44×44px,
safe-area aware, stepping above the sticky action bar on routes that have one, hidden in print. It
shows an unread count and never pulses for attention. Focus returns to it when the panel closes.

**Deep link** — `?max=open` opens the panel and cleans itself out of the URL without disturbing
route or form state. Used by the "Ask Max about this booking" control on the confirmation page.

**Announcements** — replies go to a polite live region. Focus is never stolen.

**No fake streaming.** Replies appear when computed. There is no character-by-character animation
and no artificial delay to imitate a remote service.

### The nudge

One nudge per browser session, after **120 seconds of active on-site time** — the timer pauses when
the tab is hidden, so a page left open in the background never triggers it.

It is suppressed entirely if Max has been opened or the nudge dismissed (`sessionStorage`), and
**deferred** — not cancelled, not forced — if the threshold arrives at an unsafe moment:

- while any dialog or drawer is open
- while the customer is entering their details
- during the payment step
- while the seat map is short of seats

It waits for the next safe state. It is anchored to the launcher, never full-screen, never blocks
content, never moves focus, announces politely, respects reduced motion, and has a clear close
control. The copy is the brief's, and carries no dark-pattern language.

---

## Personality

Calm, concise, warm, competent. A direct answer, a short explanation when one helps, then the
relevant actions. Clarification only when it would change the answer.

Banned outright: "Great question", "Absolutely", "I'd be delighted", "As an AI", "I'm here to help",
"Anything else?". The Ollama layer rejects any rewrite containing them.

Max does not introduce itself repeatedly, does not fill space, and does not perform enthusiasm. When
it does not know something, it says so in one sentence and points somewhere useful.

---

## Testing

50 assertions in [`nlu.test.ts`](../src/max/nlu.test.ts) cover normalisation, language detection,
relative dates against a fixed clock, time windows in both languages, entity extraction, the
open/closed caption distinction, and 18 intent-routing cases including three Bangla queries.

Two behaviours worth calling out as tested:

- **Open captions and closed captions never collapse into one entity.** Asserted directly.
- **A film query carrying a date or time is routed to showtimes, not to a catalogue list** — because
  "what can I watch tonight?" is answered by times, not titles.
