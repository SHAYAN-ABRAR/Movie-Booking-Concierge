# Offer AI image manifest

> **Status: generated and shipped.** Five images, one per offer, produced on
> 2026-09-05 with OpenAI's image model via ChatGPT, reviewed one at a time
> against the checklist below, and committed as local files.
> `src/data/offerMedia.ts` declares every image `sourceType: 'ai-generated'`.

## Why these may be generated when film artwork may not

Same rule as the other two generated sets, and it is not "AI is fine" or "AI is
banned". It is **whether the thing being pictured exists**.

A promotion nobody ran misrepresents nobody. GrandPlex is a demonstration; its
five standing offers are as fictional as its schedule, and `offers.ts` says so
in the page's own demo note. A film poster is real studio artwork and a still
contains real faces — those stay real, sourced from TMDB with attribution in
`mediaManifest.ts`, or they stay absent.

`validate:content` enforces the same two conditions here as elsewhere: every
entry carries its provenance (`sourceType`, `model`, `generatedAt`, `prompt`,
`illustrative`), and it additionally requires the layout fields described below.

## Why illustration rather than photography

A promotion is not a place or a thing. Photographing one would mean either
staging a scene that never happened or reaching for stock, and both are worse
than drawing it. A screenprinted poster is what a cinema actually puts on the
wall next to the box office.

It also keeps the three generated sets legible at a glance:

| Set | Medium | What it pictures |
| --- | --- | --- |
| Counter | Photograph | Food nobody cooked |
| Venues | Photograph | Rooms nobody built |
| Offers | Screenprint | Promotions nobody ran |

## The figure is not in the picture

**This is the load-bearing decision of the set.** No poster contains a single
letter or number, and every prompt forbade lettering.

The amount — ৳60, ৳200, 15% — is the entire message of a promotion, and it is
the one thing an image model cannot be trusted to draw. But even a model that
could set type perfectly would be the wrong tool here, because a figure baked
into a picture:

- cannot be translated (৳200 can never become ৳২০০),
- cannot be selected, searched or read aloud by a screen reader,
- cannot be re-rendered when the copy behind it changes, and
- cannot be checked against the offer's own terms.

So each composition was generated with a **deliberately empty region**, and the
figure is set into it as real text by `OfferArtwork.tsx`, pulled from the locale
resources at `offers.figures.*`. In Bangla it reads ৳২০০ and রাত ১০টা, in
Anek Bangla, at the same 75% width as the rest of the Bangla setting.

Three fields on each manifest entry keep the type off the busy half:

| Field | Meaning |
| --- | --- |
| `textAnchor` | `left` \| `right` — which half was left open |
| `textAlign` | `top` \| `center` \| `bottom` — and where in that half |
| `textTone` | `ink` \| `paper` — which ink reads on that region |

`textAlign` was added after a real failure: recording only the horizontal half
put the ৳200 straight onto a seat back, because the family composition is open
across its *top* right rather than down its whole right side. Recording one axis
where the composition has two is not a near-miss, it is a collision waiting for
the one image it does not fit. `validate:content` now requires all three.

## Art direction

Three inks and no more: bone paper, charcoal, and the house vermilion. Heavy
mid-century screenprint with visible registration slop and paper tooth — the
texture is what stops five flat vector drawings from reading as clip art.

The direction was corrected once, and the failure was mine:

1. **Five auditoriums.** My first series set every offer in a room of seats
   viewed from the same angle. Five near-identical images that communicated
   nothing about which offer was which — the picture was decorative, not
   informative.
2. **One subject each, close in.** What worked: each poster commits to a single
   object that *is* the offer's mechanic — a clock at just-before-three, four
   seats sharing one popcorn box, a projector beam, a half-lit house light, a
   student lanyard. Different subject, different composition, different crop.

The shared half is the ink limit and the print texture; the subject clause is
what makes them five different posters.

## The five offers

Each subject is drawn from that offer's own `mechanic` in `offers.ts`. The
composition prints the offer's value; it never invents one — `stationery.test.tsx`
checks the figure against the offer's own copy and fails if they diverge.

| Offer | Subject | Clear region | Figure |
| --- | --- | --- | --- |
| `off-matinee` | Oversized clock, just before three, over seat backs | Right, centre, on bone | ৳60 |
| `off-family-four` | Four seats — two adult, two child — one shared popcorn box | Right, top, on bone | ৳200 |
| `off-late-repertory` | Projector throwing a wedge of light to a blank screen, crescent moon | Left, bottom, on charcoal | 10 pm |
| `off-sensory` | Pendant house light, cone filled to half height, sound arcs fading | Left, centre, on bone | 1st |
| `off-student-weeknight` | Lanyard and blank ID card over the back of a seat | Left, centre, on bone | 15% |

The blank identity card on `off-student-weeknight` was specified as *completely
blank* for the same reason as everything else here: a card is exactly the kind
of object a model will try to letter, and a garbled name on an ID is worse than
an empty one.

## Review checklist

Each image was opened and checked before the next was requested:

1. **Subject** — is this a different *object* from the other four, or another
   room of seats?
2. **The clear region** — is it genuinely empty, and does it match the
   `textAnchor` / `textAlign` recorded for it?
3. **Inks** — bone, charcoal, vermilion, and nothing else?
4. **Text** — any lettering, digit or mark that reads as type is a rejection.
5. **Print quality** — is there real registration slop and tooth, or is it flat
   vector?
6. **Artefacts** — melted geometry, seats with the wrong number of arms.

Then, with the figure composited by the component rather than the model:

7. **Collision** — does the figure sit clear of every drawn element, in both
   languages, at 1440 / 768 / 390?

## Pipeline

```
reference-assets/generated/offers/originals/<offerId>.png   gitignored
reference-assets/generated/offers/source/<offerId>.jpg      q90, committed (1.4 MB)
node scripts/build-offer-media.mjs
  → public/media/offers/<offerId>-{640,1024,1600}.{avif,webp,jpg}   (2.9 MB)
  → src/data/offerMedia.ts
```

Same shape as the venue and counter pipelines. The committed q90 JPEG sources
mean the shipped derivatives can be rebuilt without regenerating anything; only
a from-scratch regeneration needs the model again.

## Disclosure

The offers page already carries a broader demo note covering the promotions
themselves, and the posters sit inside it:

- **English:** Sample promotional data written for this demonstration. These
  offers are not available at any real cinema, there are no partner
  relationships behind them, and the discounts described are illustrative only.
- **বাংলা:** এই ডেমোর জন্য লেখা নমুনা প্রচারমূলক তথ্য। এই অফারগুলো সত্যিকারের কোনো হলে
  পাওয়া যায় না, এর পেছনে কোনো অংশীদারি নেই, এবং বর্ণিত ছাড়গুলো কেবল উদাহরণ।

The About page states separately that the posters carry no lettering and why.
