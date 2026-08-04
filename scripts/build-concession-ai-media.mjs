#!/usr/bin/env node
/**
 * Turns the AI-generated concession originals into shipped responsive assets
 * and rewrites `src/data/concessionMedia.ts`.
 *
 * Reads:  reference-assets/generated/concessions/originals/<itemId>.png
 * Writes: public/media/concessions/<name>-<width>.{avif,webp,jpg}
 *         src/data/concessionMedia.ts
 *         docs/concession-ai-image-manifest.md is maintained by hand alongside.
 *
 * The manifest it writes carries AI provenance — model, date, prompt,
 * `illustrative: true` — and deliberately drops the photographer-attribution
 * fields the previous (real-photo) manifest held. Leaving a real creator's name
 * on a generated image would be a false credit, and `validate:content` fails on
 * any item that still has one.
 *
 * One-off authoring tool; the application never runs it.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

// Committed, optimized full-resolution source. The raw PNG originals in
// ../originals are gitignored (35MB); these q90 JPEGs are 3.8MB total and carry
// more than enough fidelity to rebuild the 480/800/1200 derivatives.
const SOURCE = 'reference-assets/generated/concessions/source';
const OUT_DIR = 'public/media/concessions';
const WIDTHS = [480, 800, 1200];

/** Where the model was run and when the set was produced. */
const MODEL = 'OpenAI GPT-4o image generation (ChatGPT)';
const GENERATED_AT = '2026-08-04';

/**
 * Alt text — a caption for someone who cannot see the picture, not a filename.
 * Concise and specific; never "image of …".
 */
const ALT = {
  'con-popcorn-salt-r': 'A single carton of freshly popped salted popcorn',
  'con-popcorn-salt-l': 'A large tub of salted popcorn to share',
  'con-popcorn-caramel': 'A cone of glossy caramel-coated popcorn',
  'con-popcorn-cheese': 'A tray of orange cheddar-dusted popcorn',
  'con-cola-r': 'A regular cup of cola over ice',
  'con-cola-l': 'A large cup of cola over ice',
  'con-lassi': 'A tall glass of sweet lassi topped with cardamom and saffron',
  'con-lemon-soda': 'A glass of fizzy lemon soda with a lemon wheel',
  'con-tea': 'A glass of hot masala tea with whole spices',
  'con-samosa': 'Two vegetable samosas, one broken open to show the filling',
  'con-chicken-roll': 'A chicken roll in a flaky paratha wrap',
  'con-nachos': 'Tortilla chips with cheese sauce and pickled chillies on the side',
  'con-mishti': 'A box of four Bengali milk sweets',
  'con-choc-icecream': 'A tub of chocolate ice cream with a wooden spoon',
  'con-combo-two': 'A sharing set: one large popcorn and two colas on a tray',
  'con-combo-family': 'A family sharing set: two popcorns, four drinks and nachos',
};

/**
 * The distinctive subject clause behind each image. The shared art direction —
 * dark charcoal counter, cream runner, marigold prop, the whole negative-prompt
 * list — is recorded once in `docs/concession-ai-image-manifest.md` rather than
 * repeated sixteen times here.
 */
const PROMPT = {
  'con-popcorn-salt-r': 'A single regular-size portion of salted popcorn in a small kraft carton, one-person portion, lit from the left.',
  'con-popcorn-salt-l': 'A tall large-size round tub of salted popcorn, generous enough for three, shot lower and wider so its greater size reads.',
  'con-popcorn-caramel': 'Caramel popcorn with a glossy amber lacquer, in a paper cone in a metal holder, lit warmer than plain popcorn.',
  'con-popcorn-cheese': 'Cheddar cheese popcorn dusted vivid orange in a shallow wide tray, high three-quarter angle, cool light to keep the orange truthful.',
  'con-cola-r': 'One regular-size cup of dark cola over ice in a matte cream paper cup with a domed lid and straw, a single medium serving.',
  'con-cola-l': 'One noticeably tall large cup of cola over ice in a matte charcoal cup, shot straight on, a second empty cup out of focus behind.',
  'con-lassi': 'Sweet lassi in a tall clear glass tumbler, opaque cream body, frothy collar, cardamom and saffron, diffused backlight.',
  'con-lemon-soda': 'Lemon soda in a tall clear highball, pale straw and fizzy, a lemon wheel on the rim and a small dish of salt, bright cool backlight.',
  'con-tea': 'Hot masala chai in a small glass cup on a dark saucer, milky amber with a wisp of steam, whole spices on the saucer, warm moody light.',
  'con-samosa': 'Exactly two golden vegetable samosas, one broken open to show the potato-and-pea filling, a pot of tamarind chutney beside.',
  'con-chicken-roll': 'A single chicken roll in a flaky paratha wrap, cut to show spiced chicken, onion and green chilli, on a dark slate board.',
  'con-nachos': 'Tortilla chips in a paper boat with a separate ramekin of cheese sauce and a ramekin of pickled chilli — sauce on the side, high angle.',
  'con-mishti': 'Exactly four Bengali milk sweets in a kraft box, one lifted on a fork to show the grainy texture.',
  'con-choc-icecream': 'A single scoop of dark chocolate ice cream in a paper tub, wooden spoon across the rim, softening at one edge, cool crisp light.',
  'con-combo-two': 'A sharing set of exactly three items — one large popcorn and two regular colas — on a tray, all countable.',
  'con-combo-family': 'A family set of exactly seven items — two large popcorns (one salted, one caramel), four colas and one nachos — from above.',
};

const shortName = (itemId) => itemId.replace(/^con-/, '');

const files = readdirSync(SOURCE).filter((f) => f.endsWith('.jpg'));
const items = files.map((f) => f.replace(/\.jpg$/, ''));

// Everything is regenerated, so start from a clean output directory rather than
// leaving stale derivatives from the previous photo set behind.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];

for (const itemId of items.sort()) {
  const alt = ALT[itemId];
  const prompt = PROMPT[itemId];
  if (!alt || !prompt) throw new Error(`no alt/prompt for ${itemId} — add it before shipping`);

  const name = shortName(itemId);
  const source = sharp(join(SOURCE, `${itemId}.jpg`));
  const meta = await source.metadata();
  if (meta.hasAlpha) throw new Error(`${itemId} has an alpha channel — food photos should be opaque`);

  for (const width of WIDTHS) {
    // Height derived to 4:3, cover-cropped from the centre in the rare case the
    // source is not exactly 4:3. The generated set is already 4:3, so this is a
    // safety net rather than a real crop.
    const height = Math.round((width / 4) * 3);
    const base = sharp(join(SOURCE, `${itemId}.jpg`)).resize(width, height, {
      fit: 'cover',
      position: 'centre',
    });
    await base.clone().avif({ quality: 62 }).toFile(join(OUT_DIR, `${name}-${width}.avif`));
    await base.clone().webp({ quality: 74 }).toFile(join(OUT_DIR, `${name}-${width}.webp`));
    await base.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT_DIR, `${name}-${width}.jpg`));
  }

  manifest.push({ itemId, basePath: `/media/concessions/${name}`, alt, prompt });
  process.stdout.write(`  ${itemId} → ${name} (${WIDTHS.join('/')})\n`);
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = manifest
  .map(
    (m) => `  {
    itemId: '${m.itemId}',
    basePath: '${m.basePath}',
    widths: [${WIDTHS.join(', ')}],
    alt: '${esc(m.alt)}',
    sourceType: 'ai-generated',
    model: '${esc(MODEL)}',
    generatedAt: '${GENERATED_AT}',
    prompt: '${esc(m.prompt)}',
    aspectRatio: '4:3',
    illustrative: true,
  },`,
  )
  .join('\n');

const fileBody = `/**
 * Counter imagery — AI-generated.
 *
 * Every item on the counter has its own generated food photograph, produced
 * once with ${MODEL} on ${GENERATED_AT} and committed to this repository under
 * \`public/media/concessions/\`. No item shares an image with another, and the
 * running application never requests an image from a remote host.
 *
 * These are *illustrations*, not photographs of real GrandPlex servings — the
 * customer-facing disclosure says so (see \`trailer\`/\`concessions.aiDisclosure\`
 * in the i18n resources). Full prompts, the shared art direction and the review
 * record are in \`docs/concession-ai-image-manifest.md\`.
 *
 * Generated by \`scripts/build-concession-ai-media.mjs\`. Do not edit by hand.
 */

export interface GeneratedConcessionImage {
  itemId: string;
  /** Local path without width or extension. */
  basePath: string;
  widths: number[];
  alt: string;
  sourceType: 'ai-generated';
  /** The image-generation model. */
  model: string;
  /** ISO date the set was produced. */
  generatedAt: string;
  /** The distinctive subject clause; shared direction lives in the doc. */
  prompt: string;
  aspectRatio: '4:3';
  /** Always true: a generated representation, not a real serving. */
  illustrative: true;
}

export const concessionImages: GeneratedConcessionImage[] = [
${rows}
];

export const concessionImageById = new Map(concessionImages.map((image) => [image.itemId, image]));
`;

writeFileSync('src/data/concessionMedia.ts', fileBody);
console.log(`\n  ${manifest.length} items → ${OUT_DIR} and src/data/concessionMedia.ts\n`);
