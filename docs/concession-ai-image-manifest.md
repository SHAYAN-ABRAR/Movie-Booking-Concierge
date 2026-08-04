# Concession AI image manifest

> **Status: not yet generated.** The generation script, the art direction and
> all sixteen prompts are committed and ready. No images have been produced,
> and the counter still shows the previous licensed photographs. This file
> records the plan and the review process; it will record the results.

## Why nothing was substituted in the meantime

The brief permitted a fallback if no image-generation capability was
configured, and explicitly forbade the shortcuts. So:

- Higgsfield MCP is connected but returned `Out of credits on free plan`;
  Recraft V4.1 returned `job_minimum_basic_plan_required`.
- No stock photography was swapped in and relabelled as generated.
- No CSS drawings were substituted.
- Nothing claims to be AI-generated that is not.

The existing photographs remain in place with their real photographer
attribution intact, which is the honest state until replacements exist.

## Running it

```
OPENAI_API_KEY=sk-…  node scripts/generate-concession-images.mjs             # all 16
OPENAI_API_KEY=sk-…  node scripts/generate-concession-images.mjs con-nachos  # one
```

Development-only. The key is read from the environment, never written to disk,
never committed, and never required at runtime — the application serves
committed files from `public/media/concessions/` and makes no image request to
any host.

Originals land in `reference-assets/generated/concessions/originals/` at
1536×1024 with a `generation-log.json` sidecar carrying model, size, date and
the exact prompt per item. `node scripts/build-concession-media.mjs` then
produces the 480/800/1200 AVIF, WebP and JPEG derivatives and rewrites
`src/data/concessionMedia.ts`.

## Art direction

One shared direction constant, so sixteen images read as one photographic
series rather than sixteen unrelated stock shots — same counter, same lighting
language, same lens feel. Only the subject clause changes per item.

> Photorealistic premium commercial food photography for a modern cinema
> concession menu. Presented in clean unbranded cinema packaging on a refined
> dark charcoal counter with a warm cream linen runner and a single restrained
> marigold-toned prop. Soft directional studio lighting, realistic texture,
> appetizing but believable, editorial composition, shallow but not excessive
> depth of field, high-end food advertising. No people, no faces, no hands, no
> text, no lettering, no logos, no branded cups, no watermark, no prices, no
> movie characters, no malformed packaging, no floating ingredients, no
> excessive garnish, no plastic-looking food. Landscape 4:3 composition with
> safe crop space around the subject.

The wordmark is deliberately never requested: generated lettering comes out
malformed, and a garbled brand name is worse than none.

## The sixteen subjects

Each clause names the portion and the container explicitly, and varies angle,
colour temperature and prop set so no two compositions match.

| Item | What distinguishes it |
| --- | --- |
| `con-popcorn-salt-r` | Small kraft carton, one-person portion, lit from the left |
| `con-popcorn-salt-l` | Tall bucket for three, **lower and wider angle** so scale reads |
| `con-popcorn-caramel` | Paper cone in a metal holder, **warm honey lighting**, glossy lacquer |
| `con-popcorn-cheese` | Shallow tray, **high three-quarter angle**, cool light to keep orange truthful |
| `con-cola-r` | Medium cream cup, single serving |
| `con-cola-l` | **Taller** charcoal cup shot straight on, second cup out of focus behind |
| `con-lassi` | Glass tumbler, froth collar, cardamom dust, diffused backlight |
| `con-lemon-soda` | Clear glass, lemon wheel, **bright cool backlight** for carbonation |
| `con-tea` | Glass cup on a saucer with whole spices, **dark moody register** |
| `con-samosa` | **Exactly two**, one broken open, tamarind chutney pot |
| `con-chicken-roll` | Half-wrapped paratha on slate, cut to show the filling |
| `con-nachos` | Sauce in a **separate ramekin**, not poured over. High angle |
| `con-mishti` | **Exactly four** pieces in a lined box, one lifted |
| `con-choc-icecream` | Single scoop, wooden spoon across the rim, frost on the tub |
| `con-combo-two` | **Exactly one large popcorn + exactly two colas.** Three items, countable |
| `con-combo-family` | **Two large popcorns (one salted, one caramel) + four drinks + one nachos.** Seven items, countable, shot from above |

The two combos spell out counts because getting them wrong is not cosmetic —
the picture would promise a different order from the one being bought.

## Review checklist

No output is accepted on first sight. Each image is opened and checked:

1. **Product accuracy** — is this the item the data describes?
2. **Portion** — does "regular" read smaller than "large"?
3. **Combo contents** — countable, and matching the description exactly?
4. **Artifacts** — malformed packaging, impossible geometry, extra fingers,
   floating food, melted-looking edges.
5. **Text** — any lettering at all is a rejection; generated text is garbled.
6. **Branding** — no logos, no recognisable trademarked cup shapes.
7. **Uniqueness** — no two items sharing a composition, prop set or crop.
8. **Series coherence** — same counter, same lighting language.

Failures are regenerated per item, not accepted and worked around.

## Manifest fields

Once generated, `src/data/concessionMedia.ts` records per image:

```ts
interface GeneratedConcessionImage {
  itemId: string;
  basePath: string;
  widths: number[];
  alt: string;
  sourceType: 'ai-generated';
  model: string;
  generatedAt: string;
  prompt: string;
  seed?: string;
  aspectRatio: '4:3';
  illustrative: true;
}
```

The photographer attribution fields (`creator`, `provider`, `licence`,
`licenceUrl`, `sourcePage`) are **removed** at the same time. Leaving a real
photographer's name on a generated image would be a false credit, and
`validate:content` will fail on any item that still carries one alongside
`sourceType: 'ai-generated'`.

## Disclosure

Because these are generated representations, a concise disclosure appears on
the concessions route, in the booking concessions step, and in About — not over
every image.

- **English:** Concession images are AI-generated illustrations. Actual presentation may vary.
- **বাংলা:** কনসেশন পণ্যের ছবিগুলো এআই দিয়ে তৈরি নমুনা চিত্র। পরিবেশন ভিন্ন হতে পারে।

Both go through the existing i18n resources.
