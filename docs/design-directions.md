# Design directions

Three directions were explored before committing. They differ structurally, not by palette.

## The constraint that framed all three

The Phase 1 audit ([`asset-inventory.md`](./asset-inventory.md)) returned **zero deployable
imagery**. No logo, no posters, no backdrops, no venue photography, no concession photography, no
offer art, no trailers. Stock and generated imagery are both ruled out by the brief.

So the first question was not "what should this look like" but **"what carries the visual weight
when there are no pictures?"** A direction that needs photography to work is not a direction here —
it is a direction that would fail quietly and then get patched with stock.

That reframing is what decided the outcome.

---

## Direction A — Metropolitan Night

**Premise.** The city after dark. Deep near-black surfaces, a periwinkle glow lifted straight from
the reference palette, glass panels, luminous edges. Content floats on dark.

**Structure.** Full-bleed dark hero; translucent cards over blurred backdrops; neon-edged CTAs; a
persistent dark chrome.

**Assessed against the criteria**

| | |
|---|---|
| Asset fit | ✗ **Fails.** Glass and glow are *treatments applied to imagery*. With nothing behind them, the panels blur an empty surface and the direction collapses into flat dark rectangles. |
| Originality | ✗ This is the single most common output for "premium entertainment website". |
| Emotional impact | ~ Strong on first sight, generic by the third screen. |
| Booking clarity | ✗ Dark glass is poor for dense timetables; the seat map's five states get hard to separate. |
| Accessibility | ✗ Translucency over variable backdrops makes contrast non-deterministic. |
| Mobile | ~ Heavy blur is expensive on mid-range devices. |
| Anti-slop resistance | ✗ Hits glassmorphism-everywhere, glow-blobs, gradient text and neon — several named prohibitions at once. |

**Rejected.** It fails the actual constraint and it is the house style of AI-generated entertainment
sites.

---

## Direction B — Tactile Premium Ticketing

**Premise.** The physical artefact. Thermal-print type, perforated stubs, deckled edges, card stock,
ink density. The site behaves like the ticket it produces.

**Structure.** Every surface is a piece of stock; perforations divide sections; monospace throughout;
rubber-stamp accents.

**Assessed against the criteria**

| | |
|---|---|
| Asset fit | ✓ Needs no photography at all. |
| Originality | ✓ Genuinely distinctive. |
| Emotional impact | ✓ Strong, and it lands hardest exactly where it should — at the confirmation. |
| Booking clarity | ~ Monospace everywhere hurts long-form reading; synopses and policy text suffer. |
| Accessibility | ~ Thermal-print aesthetics push toward low contrast. |
| Motion potential | ~ Limited. Paper does not move much. |
| Sustainability | ✗ **The real problem.** A novelty conceit thins out across fifteen routes. By `/contact` it is a costume. |

**Rejected as the whole system — but kept where it is true.** The ticket materiality is exactly
right for the *confirmation ticket*, and that is where it now lives: sprocket perforations along
both edges, a torn stub, a monospace reference.

---

## Direction C — The Repertory Programme ✅ **Chosen**

**Premise.** The printed programme of a repertory cinema. A cinema's programme is a *document*: a
dated masthead, ruled timetables, small-caps metadata, numbered listings, editorial programme notes
written by someone who has actually seen the films. Ink on paper, set with care.

**Structure.** Editorial masthead rather than a hero image. Showtimes as a legible **timetable**,
not card soup. Rules and stitched dividers instead of boxes. Display serif for titles, grotesque
with tabular figures for data. Numbered lists where a grid would be lazy.

**Why it wins**

| | |
|---|---|
| Asset fit | ✓ **This is the point.** Editorial typography is not a fallback for missing pictures — it is the primary medium. Nothing here is a hole where a photo should be. |
| Originality | ✓ No current cinema site looks like this. It reads as made by people, not assembled from a component library. |
| Emotional impact | ✓ Earned rather than announced. The programme note does more for a film than a poster would. |
| Booking clarity | ✓ **Strongest of the three.** A timetable is the correct form for showtimes, and it is what the whole direction is built around. |
| Accessibility | ✓ Ink on paper is a high-contrast starting position, not a compromise. |
| Mobile | ✓ Type-led layouts reflow honestly; nothing depends on a large canvas. |
| Motion potential | ~ Restrained by nature — which the brief asks for anyway. |
| Assistant integration | ✓ Max becomes the front-of-house staff member beside the printed programme. That is a coherent role, not a bolted-on widget. |
| Feasibility | ✓ No image pipeline, no WebGL, small dependency surface. |
| Anti-slop resistance | ✓ Avoids essentially every named pattern by construction: no gradient text, no glow, no glass, no endless rounded cards, no three-column SaaS features, no centred-everything. |

### The structural idea that makes it more than a style

**The lights go down.**

The programme is *paper* — warm, light, legible. But the auditorium is *dark*. So the product runs
two worlds, and the boundary between them means something real:

- **Paper (light)** — the lobby. Browsing, reading, comparing, deciding.
- **Auditorium (dark)** — inside the house. The seat map, and the confirmation ticket.

This is not a theme toggle and not decoration. It maps to the customer's actual movement through a
cinema, it gives the seat map its own world instead of being one more card, and it solves the
"identical card grids on every page" problem structurally rather than cosmetically.

### The motif

**Nokshi** — নকশী — is the running stitch of Bengali kantha embroidery: a line of small, evenly
spaced marks. A strip of 35mm film carries the same interrupted line down both edges, for the same
mechanical reason a stitch does — to pull something along.

Stitch, sprocket, perforation, ticket edge. One motif, four readings, all true. It is the only
ornament in the system, it is always drawn in CSS and never imaged, and it is what the brand is
named after. See [`design-system.md` §The stitch](./design-system.md#the-stitch).

---

## Decision

**Direction C, with Direction B's materiality retained precisely where it is honest** — the
confirmation ticket, which really is a ticket.

Direction A was rejected outright: it fails the project's defining constraint and is the exact
aesthetic the brief's anti-slop rules describe.

---

## Where the brand name came from

No logo was supplied, so a brand had to be created — and creating one was preferable to adopting
"WATCHER", which belongs to the reference concept, or a real operator's trademark, which the brief
forbids.

*Nokshi* was chosen because the motif came first and the name follows from it. It is culturally
grounded in the market the product serves, it is legible in both scripts (নকশী / Nokshi), and it
means something specific — *pattern*, *design*, *the worked stitch* — rather than being an
entertainment-brand noun. The wordmark is set in the house display face between two sprocket runs.
