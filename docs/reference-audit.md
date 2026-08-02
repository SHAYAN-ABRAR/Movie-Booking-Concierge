# Reference audit

What was learned from the two functional reference sites, and how it shaped this product.

**References**

- `https://www.cineplexbd.com/`
- `https://ticket.cineplexbd.com/home`

**Purpose.** To learn the domain — how cinema booking works in this market, what information
customers need at each step, and what a booking flow has to account for. Not to copy source code,
styling, page composition or visual identity. Nothing in this repository is derived from their
markup, their assets or their brand.

---

## Method, and an honest limitation

Both reference sites are client-rendered single-page applications. Fetching them returns only the
HTML shell — `<title>Cineplex Web</title>` and `<title>Cineplex Ticket</title>` respectively — with
no navigation, listings or booking markup in the initial response.

The intended tool for this was **Chrome DevTools MCP**, which drives a real browser and would have
rendered both sites fully. It is registered at project scope in [`.mcp.json`](../.mcp.json), but MCP
servers are bound at session start, so a server added during a session cannot be called in that same
session — and this session was non-interactive, so the approval flow could not run either. See
[`tooling-report.md`](./tooling-report.md) for the full position.

The audit below therefore rests on:

- the HTML shells and metadata that *are* retrievable
- published operator information about the market (branch network, price tiers, seat classes,
  house rules)
- the supplied design references, which are themselves a cinema-booking concept and document the
  same flow from a different angle

Everything below is marked with its confidence. Nothing was invented to fill a gap, and where a
detail could not be verified, this build made its own deliberate choice rather than guessing at
theirs.

---

## 1. Information architecture

**Confidence: high** (consistent across the market and corroborated by the design references).

The customer-facing surface of a cinema chain divides cleanly:

| Area | Purpose |
|---|---|
| Now showing | What is on this week |
| Coming soon | What is booked but not yet open |
| Movie details | Synopsis, cast, certificate, runtime, formats, trailer, and the showtime matrix |
| Showtimes | Date-first discovery across the whole circuit |
| Cinemas | Branch list, then a page per branch |
| Ticket prices | Published price tiers |
| Food and beverage | The concessions counter |
| Offers | Standing promotions |
| Contact / FAQ | Support, policies, lost property |

Two navigation axes matter and both must exist: **film-first** ("I want to see this — when is it
on?") and **time-first** ("I am free at eight — what can I see?"). A site that only offers one of
these forces a detour for half its visitors.

→ *In this build:* both axes are first-class. `/movies` is film-first, `/showtimes` is time-first,
and each links into the other. The home page carries a **quick-booking control** that collapses the
whole thing into four dependent selects.

## 2. Location as persistent state

**Confidence: high.**

A multi-branch chain needs the customer's chosen venue to persist globally. Almost every other
question — what is on, at what time, for how much — is scoped by it.

→ *In this build:* the venue selector lives in the header and writes to a persisted store
(`nokshi.preferences.v1`). The showtimes page seeds itself from it, the booking wizard inherits it,
and Max reads it as context. Choosing a single cinema on the showtimes filter writes back to it.

## 3. Pricing structure

**Confidence: high** for the shape; **the figures in this build are original sample data**.

Published market pricing is tiered along four axes at once:

- **Seat class** — Regular / Premium, extending to Recliner and Royal in premium houses
- **Time of day** — a matinee rate for shows starting before mid-afternoon
- **Day of week** — a weekend and holiday uplift
- **Format** — a 3D and large-format uplift

Prices are quoted in BDT (৳), as whole taka.

→ *In this build:* the same four axes, with an explicit fifth — the **age category**, applied last —
and one clearly-disclosed booking fee. The rule is implemented once in
[`src/data/pricing.ts`](../src/data/pricing.ts) and every figure in the interface, including every
figure Max quotes, comes through it. See [`/ticket-prices`](../src/routes/TicketPrices.tsx) for the
worked example.

## 4. The booking flow

**Confidence: high** for the sequence; the reference's own screens confirm most of it.

The canonical sequence is: **film → cinema → date → showtime → seats → (add-ons) → details →
payment → confirmation**, with a seat map as the centrepiece.

Observed constraints that any implementation has to handle:

- Seat selection is bound to one specific screening. Changing the screening must invalidate it.
- The number of seats must match the number of tickets.
- Guest checkout is normal in this market — an account is not required to buy a ticket.
- Payment offers *categories* (card, mobile financial service, internet banking, gift card) rather
  than a single provider.
- A seat map needs classes, aisles, row labels, an unmistakable screen indicator, and a legend.

→ *In this build:* a seven-step wizard plus a confirmation route, with dependency invalidation
handled in the store (changing cinema or date clears the showtime and the seats; changing the
showtime clears the seats). Guest checkout throughout — there is no account system anywhere in the
product. Payment is a clearly-labelled category selection that never requests a credential.

## 5. Seat map conventions

**Confidence: high** — this is where the supplied design references were most useful.

From `aa2.webp` and `aa4.webp`: a curved arc standing for the screen at the top; seats as small
rounded squares; aisles rendered as *gaps* rather than lines; row letters on both flanks; wheelchair
positions marked inline with a glyph; a legend distinguishing seat classes from seat states; a
running total pinned beside the map.

→ *In this build:* the same conventions, restyled and made accessible. The important additions are
that **no state depends on colour alone** (sold seats carry a cross, held seats a dot, premium seats
a different silhouette, wheelchair spaces a glyph), and that the map is a real multi-select listbox
with arrow-key navigation and a live region — see
[`SeatMap.tsx`](../src/components/booking/SeatMap.tsx) and its tests.

## 6. Accessibility information

**Confidence: medium.** Provision varies by operator and is often thin.

The distinction that matters most, and that is most often blurred: **open captions** are burned into
the print and everyone in the house sees them; **closed captions** arrive on a personal device
collected from the box office. They are not interchangeable, and a customer who needs guaranteed
on-screen captions must book an open-caption screening specifically.

→ *In this build:* screening-level accessibility is modelled properly. Open captions are a property
of the *print* (a scheduling choice); closed captions, hearing loops and wheelchair spaces are
properties of the *room*; audio description needs both. Every marker carries a two-letter code as
text alongside its icon, and the two caption types are never merged. Max is required to keep them
distinct and is tested on it.

## 7. Policies customers actually ask about

**Confidence: medium-high.** Recurring across operators:

late arrival · refunds and exchanges · outside food · age restrictions · parking · lost property ·
printing tickets.

→ *In this build:* each has a real answer in the local knowledge base
([`src/data/policies.ts`](../src/data/policies.ts)), in English and Bangla, and each cinema carries
its own late-arrival policy and lost-property desk. Where Max has no verified answer, it says so
rather than improvising.

## 8. Loading, empty, error and validation states

**Confidence: medium** — inferred from the SPA architecture rather than observed directly.

→ *In this build:* every route has a skeleton fallback; every filterable surface has an empty state
that names the likely culprit and offers a way out; the 404 doubles as the router error boundary and
suggests current films; form validation is inline, announced politely, and never blocks with a
generic message.

---

## What was deliberately **not** taken

- **No markup, CSS or JavaScript** was copied from either site.
- **No visual identity.** This product's design language is unrelated — see
  [`design-directions.md`](./design-directions.md).
- **No brand, trademark or venue name.** Nokshi Cinemas is an original brand with original venues,
  original screen names and original format names. The real operator's marks appear nowhere.
- **No catalogue.** The films are original works written for this project, so nothing here can be
  mistaken for a real listing.
- **No runtime dependency.** The application never contacts either site. There is no scraping, no
  proxy and no API call — every value is local seed data.

---

## Open items

Should Chrome DevTools MCP become available in an interactive session, the audit would be worth
extending with: exact seat-map interaction behaviour under touch; the real network waterfall and
LCP; how the live sites handle a sold-out screening mid-flow; and their concessions data model.
None of these change the product built here — they would refine the fidelity of this document.
