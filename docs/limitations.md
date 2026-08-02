# Limitations

What this build is not, stated without hedging. Everything here is also surfaced in the product
itself, in the same plain voice.

---

## It is a demonstration

**Nokshi Cinemas is not a real cinema chain.** The brand, the five venues, the nineteen screens, the
fourteen films, the schedules, the seat availability, the prices, the offers, the policies and the
contact details are all original sample data written for this project.

Nothing here is, or claims to be, a real cinema listing. It is not affiliated with, derived from, or
representative of any real operator.

## There is no backend

No server. No database. No CMS. No API. No authentication. No payment processor.

Everything runs in the browser tab. That is not a shortcut — it is the brief's constraint, and it is
the reason for most of the honesty rules below.

**Where things are stored**

| Key | Contents | Store |
|---|---|---|
| `nokshi.booking.v1` | The in-progress booking (**excluding guest contact details**) | localStorage |
| `nokshi.bookings.v1` | Completed bookings | localStorage |
| `nokshi.preferences.v1` | Chosen cinema, accessibility preferences | localStorage |
| `nokshi.watches.v1` | Demo alerts and notifications | localStorage |
| `nokshi.reports.v1` | Lost-property and claim drafts | localStorage |
| `nokshi.max.v1` | The Max conversation | sessionStorage |

Guest name, email and phone are deliberately excluded from the persisted in-progress booking — they
live in memory until a booking is completed, and are then written onto that booking record only.

**Consequences, all of which the interface states:**

- Clear your browser data and every booking is gone. There is no copy.
- A booking made in one browser is invisible in another, and on another device.
- Duplicate detection can only check *this browser's* history. The warning says so explicitly.
- Nothing is emailed, texted, or sent anywhere.

## No payment is taken

The payment step records a **method category** and nothing else.

This site never asks for — and has no code path that could accept — a card number, an account
number, a PIN, an OTP, a CVV, a wallet credential or a password. The step says so in a bordered
notice, and a test asserts that no `input[type="password"]` exists anywhere in the booking flow.

The confirmation ticket is marked **"Demonstration ticket — not valid for entry"** on its face.

## The schedule is generated, not live

Screenings and seat availability are computed by a deterministic local engine
([`src/data/schedule.ts`](../src/data/schedule.ts)) seeded from the screening's own identity.

They are stable — the same screening always shows the same sold seats, on every reload, in every
tab. They are also **entirely fictional**. Nothing checks live inventory, because there is nothing
to check.

Every surface that shows a schedule carries a note saying so.

## Max's limitations

Max runs on this device. It has no knowledge beyond the seed data in this repository.

**It cannot:**

- see or check live cinema inventory
- contact staff, or tell anyone anything
- submit a lost-property report, a claim, or a message
- monitor prices or seats in real time
- complete a purchase
- verify anyone's age, student status or identity

**It will not:**

- invent a price, a showtime, a seat or a policy — those come from typed data, not from generated
  text
- present allergen information as a medical guarantee
- give legal, medical or emergency advice
- change your seats, tickets or basket without an explicit confirmation
- ask for a password, PIN, OTP, card number or date of birth

Where it has no verified answer it says: *"I don't have verified information for that in this local
demo"*, and points to a contact route.

### The optional Ollama layer

Off by default, and the control only appears if a local Ollama daemon is actually detected — so
there is no dead toggle in the interface.

When enabled, it may rewrite **reply wording only**. Prices, showtimes, seat suggestions, blocks and
actions are computed locally and pass through untouched; a rewrite that drops any number is
discarded. The panel states plainly that the text is sent to `localhost:11434`, and that a
`-cloud` model tag makes that daemon relay onward to Ollama's servers. No API key is used or
requested.

## Demonstration alerts monitor nothing

A saved watch fires exactly one deterministic demo event about forty seconds after it is created,
so the alert *behaviour* can be seen working. It is labelled as a demo event everywhere it appears.

Nothing is monitored. Nothing is emailed or texted. No other device is notified. Browser
notifications are used only with explicit permission, requested at most once, with the in-app
notification centre as the always-working fallback.

## Ticket Cover is a sample product

No policy is issued, no premium is taken, no claim is submitted or assessed.

Max can explain the sample terms, show which reasons are covered and which are excluded, and prepare
a local draft with a checklist. It never fabricates an approval status, never promises
reimbursement, and never interprets the policy beyond the supplied data.

## Lost property is prepared, not sent

Max assembles a report, prefills it from your booking, saves it locally **only with consent**, and
copies a plain-text summary to your clipboard. It then tells you it has **not** been sent, and gives
the house's own email and phone.

There is no submit button, because there is nothing to submit to. The report type is shaped so a
real adapter could be added later.

## Age categories are not verification

You choose a category; the category sets the price. **No date of birth is ever requested or stored.**

Where a film carries an age restriction, the flow compares your selected categories against it and
explains which one triggered the warning. It never silently removes a ticket, never implies identity
has been checked, and never claims legal compliance. The door verifies age; this site does not, and
says so.

## No imagery

No logo, poster, backdrop, venue photograph, concession photograph, offer graphic or trailer was
supplied — all six supplied files are design-reference recordings of a third-party concept UI.

Rather than filling the gap with unrelated stock or generated imagery, **every visual in this build
is drawn with type, rule, colour and layout.** Films are presented through generated typographic
plates; cinemas through true diagrams of their own screens; offers through set type. Every film
reports an honest "no trailer available" state.

This is a deliberate design position, documented in
[`design-directions.md`](./design-directions.md) — not an unfinished corner.

## Verification not performed in this session

Stated so it is not mistaken for a claim that it passed:

- **No browser-based testing.** Chrome DevTools MCP is registered but could not be called in a
  non-interactive session (see [`tooling-report.md`](./tooling-report.md)). No screenshots,
  performance traces, layout-shift measurements or real-device keyboard passes were captured.
- **No screen-reader pass.** Semantics, roles, names and live regions are implemented to spec and
  asserted in tests, but no NVDA/JAWS/VoiceOver session was run.
- **No automated axe scan.**
- **Contrast ratios were computed, not measured in-browser.**
- **The reference audit was done from HTML shells**, since both reference sites are client-rendered
  SPAs. Its confidence levels are marked per section.
- **Hallmark's own `audit` and anti-slop evaluation were not executed** — the skill installs into
  the next session. Its method was applied by hand and the artefacts it expects exist.

## Things a production build would need

Authentication and accounts · a real booking backend with seat locking and concurrency · a payment
gateway · a CMS for the programme · real film licensing and artwork · email and SMS delivery ·
staff-facing lost-property and claims systems · analytics and error reporting · i18n beyond the
English/Bangla core covered here · legal review of every policy statement.
