# Visual revival — baseline audit

Conducted before any code was changed, against commit `e624fe1`, in Chrome via DevTools MCP.

**Baseline health:** 116 tests passing · lint 0 errors · asset check clean · production build clean ·
console clean apart from one React Router v7 future-flag notice.

The application is functionally strong. This audit is about what it *feels* like, not whether it
works.

**Baseline captures** in [`screens/before/`](./screens/before/): `home-1440`, `home-390`,
`movies-1440`, `movie-details-1440`, `showtimes-1440` — all full-page, stored as WebP.

---

## The core finding

The product reads as **a well-set document about a cinema**, not as a cinema. Every page is
paper-coloured, every section is a rule with a heading under it, and nothing on screen moves,
reacts, or suggests light. The typography is genuinely good — which makes the flatness more
conspicuous, not less.

Three specific causes, all visible in the code:

1. **`docs/design-system.md` forbids the thing that would fix it.** "Shadows are for overlays only",
   "Nothing animates on scroll", "Framer Motion earns its place on exactly two elements". These were
   defensible anti-slop guardrails; they have become a ceiling.
2. **The `Plate` system produces one rectangle.** Six variants = 3 colour pairs × 2 structures, and
   the structures differ only in where the title sits. In a grid this reads as *one* design in
   different colours.
3. **All feedback is border-and-colour.** There is no depth, no light, no press, no physical
   response anywhere in the interaction vocabulary.

---

## Route-by-route

### Home — the worst offender

- The masthead is **text beside a form**. At 1440×900 the entire lower-left quadrant below the two
  buttons is empty paper — roughly 30% of the first screen carrying nothing.
- There is **no visual focal point at all**. The eye has no anchor; it lands on the title and then
  has nowhere to go.
- `QuickBook` is a plain 2px-bordered box. Functionally excellent, visually inert — disabled states
  are grey, and the enabled transition is invisible.
- The featured film is chosen once per day and then completely static. Nothing signals that the
  programme is a living thing that changes.
- Section rhythm is better than elsewhere (five genuinely different structures), but every section
  still opens with the same eyebrow + display heading + hairline rule, so the *page* still reads as
  uniform.

**Keep:** the section-structure variety, the programme-note pull quote, the honest demo line, the
whole QuickBook dependency model.

### Movies — the plate repetition is undeniable

- Four cards visible in the fold, all the same rectangle with a large ghosted runtime numeral.
- ~200px of empty paper between the lede and the filter sidebar.
- Filter changes replace the grid instantly — no sense that results are being narrowed from
  something larger.
- Result count changes with no acknowledgement.

**Keep:** the filter panel (real checkboxes, URL-synced), the date strip, the accessibility legend.

### Movie details

- Reads as an article. The masthead is a large title on paper with a colophon beside it — closer to
  a Wikipedia entry than a film page.
- The "No trailer available" state is a dashed box. Honest, but it looks like an error.
- Showtime filtering swaps content abruptly.

**Keep:** the editorial credit colophon, the honest trailer copy, the price sidebar.

### Showtimes — the biggest missed opportunity

Time is the entire subject of this page and **nothing on it is time-aware.** No "now" marker, no
sense of the day progressing, no distinction in weight between a screening in 20 minutes and one at
11pm. The availability bars are static.

**Keep:** the timetable structure, time-of-day grouping, the whole filter model.

### Cinemas

`HouseDiagram` is the most interesting visual in the product and it renders completely static. Bars
that represent physical rooms should feel measured out.

### Booking

- Step changes are an instant swap. No sense of progression, no directional continuity.
- The stepper is numbered circles joined by hairlines — a generic wizard, with no relationship to
  cinema.
- **The seat map is the strongest component in the application** — genuinely excellent listbox
  semantics, roving tabindex, per-seat accessible names. But entering it feels like nothing. There
  is no "lights going down", no screen glow, no depth. The `.auditorium` class does the colour flip
  and stops there.
- The summary's total changes silently.

**Keep — and protect:** every accessibility behaviour in `SeatMap.tsx`. The listbox model, the
keyboard handling, the announcements, the shape-based state encoding.

### Confirmation

The ticket composition is good — sprocket edges, stub, monospace reference. It simply appears. The
single most emotionally significant moment in the product has no reveal.

### Max

Panel and nudge already animate (the only two animated elements in the app). The launcher is a
static bordered rectangle. Result cards appear instantly. Max's *actions* — applying a filter,
proposing seats — have no visual connection to the page they affect.

---

## What is already right, and must survive

- The paper/auditorium two-world concept. This is the strongest idea in the design and the
  revitalization should extend it, not replace it.
- The stitch/sprocket motif and its derivation from the brand name.
- Fraunces + Archivo + Anek Bangla + JetBrains Mono. The type is not the problem.
- The near-zero radius policy. This is what stops it looking like a generated template.
- Tabular figures everywhere.
- Colour-independent state encoding.
- All honesty disclosures.
- The entire information architecture and filter model.

---

## Performance and accessibility baseline

**Performance.** Entry chunk 140 KB / 45 KB gzip. `motion` is already split at 114 KB but pulled in
by the entry graph via MaxDock. No images, so no image-driven CLS. Route chunks 1.3–12.6 KB.

*Headroom for this work:* Framer Motion is already paid for — using it more costs almost nothing.
Moving it to `LazyMotion` + `domAnimation` should *reduce* the animation bundle even as usage grows.

**Accessibility.** Semantics are strong: real controls throughout, one tab stop in the seat map,
polite live regions, `lang="bn"` on Bengali strings, no colour-only encoding. Contrast: ink/paper
14.8:1.

*Risks this work introduces, to be guarded:* reveal animations hiding content from assistive tech;
route transitions causing duplicate announcements or focus loss; animated numbers not exposing their
final value; an auto-advancing hero without pause control; motion that delays interaction.

---

## What the revitalization must therefore do

1. Give the home page a **focal point** and fill the dead quadrant with cinematic artwork.
2. Replace the plate system with **genuinely distinct composition families** per film.
3. Make **time visible** on Showtimes.
4. Give the booking flow **directional continuity** and the seat map an **auditorium arrival**.
5. Make the confirmation **reveal** rather than appear.
6. Build a **centralised motion system** so this is a system, not scattered animation.
7. Revise the design documentation so the guardrails become *intentional rules* rather than
   prohibitions — without weakening a single anti-slop principle.
