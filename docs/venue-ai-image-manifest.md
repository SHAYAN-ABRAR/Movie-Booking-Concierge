# Venue AI image manifest

> **Status: generated and shipped.** Five images, one per house, produced on
> 2026-09-04 with OpenAI's image model via ChatGPT, reviewed one at a time
> against the checklist below, and committed as local files.
> `src/data/venueMedia.ts` declares every image `sourceType: 'ai-generated'`.

## Why these may be generated when film artwork may not

The rule this project holds itself to is not "AI is fine" or "AI is banned". It
is **whether the thing being pictured exists**.

- A concession item nobody cooked, and a lobby nobody built, misrepresent
  nobody. GrandPlex is a demonstration; its five houses are as fictional as its
  schedule.
- A film poster is real studio artwork. A film still contains real faces.
  Generating either would be passing off an invention as somebody's work or
  somebody's likeness. Those stay real — sourced from TMDB with attribution in
  `mediaManifest.ts` — or they stay absent.

The licence comes with two conditions, and `validate:content` enforces both:
every entry must carry its provenance (`sourceType`, `model`, `generatedAt`,
`prompt`, `illustrative`), and the customer-facing disclosure must be present on
the cinema page. Remove the disclosure and the build fails.

## What the images had to solve

The venue pages had no photography at all — an address, opening hours and an SVG
diagram of screen sizes. Five houses that read as five identical text blocks.
The image is what tells you *which* house you are choosing.

## Art direction

One shared direction, five subject clauses. The shared half is what makes five
buildings read as one circuit; the subject clause is what makes them different
buildings.

The direction was arrived at over three attempts, and the two failures are worth
recording because both were mine:

1. **Empty architectural render.** Correct materials, correct camera, no
   evidence that a cinema happened there. It read as a showroom.
2. **Long-exposure crowd.** Adding motion-blurred figures to fix that produced
   smeared half-transparent ghosts that read as a broken render, not a busy
   room.
3. **Traces, not people.** What worked: no people at all, but the room dense
   with evidence of use — a lit counter, a used cup left on the ledge, one
   auditorium door ajar with light spilling out, a discarded stub on worn
   carpet, a jacket on the bench. The room is *between shows*, which is a real
   moment rather than an empty set.

Generated humans were ruled out deliberately. Faces and hands are the classic
failure mode, and one bad face ruins an otherwise good plate.

> Photorealistic interior photograph of an independent cinema lobby, empty
> between shows. Editorial architecture photography, shot for a magazine
> feature. No people anywhere in frame, but the room is unmistakably in use: a
> lit concession counter with a full popcorn warmer, stacked cups and a used cup
> on the ledge; a box-office desk with the stool pushed out; auditorium doors
> with dark padded acoustic panels, ONE standing ajar with warm light spilling
> across the carpet; brass stanchions with a retractable belt; empty backlit
> poster lightboxes glowing blank; patterned carpet worn along the walking line
> with a single discarded ticket stub; a bin, a bench, a stack of folded floor
> mats. 24mm tilt-shift, verticals straight, standing eye height, tripod,
> everything sharp. Warm neutrals — bone, oatmeal, deep charcoal — with amber as
> the only saturated colour. Terrazzo, brushed steel, dark stained timber, matte
> paint. Lived-in and slightly worn. No text, no lettering, no numbers, no
> signage, no logos, no movie posters or film artwork, no readable screens, no
> motion blur, no watermark, no CGI look. Landscape 16:9.

**The kit** — counter, stanchions, blank lightboxes, padded doors, worn carpet,
bench, bin — repeats in all five. That repetition is what makes them a chain.

**Lettering is never requested.** Generated text comes out malformed, and a
garbled brand name is worse than none. The wordmark is drawn in code
(`Logo.tsx`) and appears in the masthead on every page; it is not composited
into the photographs. Same decision as the counter set.

## The five houses

Each clause is drawn from that venue's own description in `cinemas.ts`, and each
sits at a different hour so the set does not read as one building five times.

| House | Volume | Hour | What distinguishes it |
| --- | --- | --- | --- |
| `dhanmondi` | Tall, double-height | Night | Six floors up, lights kept low, mezzanine above, four doors. The oldest house |
| `bashundhara` | Wide, single-storey | Late morning | A continuous clerestory the length of the far wall, five doors in a row. The largest and newest |
| `uttara` | Small, low-ceilinged | Late morning | Street-level glazing throwing long raking shadows, three doors. The neighbourhood house |
| `agrabad` | Elevated | Late afternoon | One enormous window over a working container port, cool daylight against warm interior |
| `zindabazar` | Narrow, cramped | Dusk | Third floor above a high street, two doors, the most worn carpet in the circuit |

Two clauses carried a specific hazard, and both were pre-empted in the negative
prompt: a container port and a high street are both covered in lettering.
Containers were required to be plain unmarked blocks of colour; the street was
required to be soft bokeh with no legible shopfronts.

## Review checklist

Each image was opened and checked before the next was requested:

1. **Volume** — is this a different *shape* of room from the other four?
2. **Hour** — does its light distinguish it from the rest of the set?
3. **The kit** — counter, stanchions, blank lightboxes, worn carpet present?
4. **Traces** — does the room look used, or does it look like a showroom?
5. **Text** — any lettering anywhere, including on equipment or through a
   window, is a rejection.
6. **People** — any figure, silhouette or reflection is a rejection.
7. **Artefacts** — impossible geometry, melted edges, doors that go nowhere.

All five passed on the third direction. The first two directions were discarded
whole rather than patched.

## Pipeline

```
reference-assets/generated/venues/originals/<slug>.png   1672×941, gitignored
reference-assets/generated/venues/source/<slug>.jpg      q90, committed (1.6 MB)
node scripts/build-venue-media.mjs
  → public/media/venues/<slug>-{640,1024,1600}.{avif,webp,jpg}
  → src/data/venueMedia.ts
```

The committed q90 JPEG sources mean the shipped derivatives can be rebuilt
without regenerating anything; only a from-scratch regeneration needs the model
again. The raw PNGs are gitignored, as the counter's are.

## Disclosure

- **English:** Venue images are AI-generated illustrations. GrandPlex is a
  demonstration — these rooms do not exist.
- **বাংলা:** হলের ছবিগুলো এআই দিয়ে তৈরি নমুনা চিত্র। গ্র্যান্ডপ্লেক্স একটি ডেমো — এই কক্ষগুলো
  বাস্তবে নেই।

Shown as a caption directly beneath the image on each cinema page, and once at
the foot of the cinemas index. Both go through the i18n catalogue, and
`validate:content` fails if the cinema page renders the imagery without it.
