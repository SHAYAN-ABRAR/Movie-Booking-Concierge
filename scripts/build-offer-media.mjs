#!/usr/bin/env node
/**
 * Turns the AI-generated offer artwork into shipped responsive assets and
 * rewrites `src/data/offerMedia.ts`.
 *
 * Reads:  reference-assets/generated/offers/source/<offerId>.jpg
 * Writes: public/media/offers/<offerId>-<width>.{avif,webp,jpg}
 *         src/data/offerMedia.ts
 *
 * Offers are illustration rather than photography, and deliberately so. A
 * promotion is not a place or a thing, so photographing it would mean either
 * inventing a scene or reaching for stock; a screenprinted poster is what a
 * cinema would actually put on the wall. It also keeps the three image sets
 * distinguishable at a glance — foyers are photographs, the counter is
 * photographs, offers are prints.
 *
 * **No figure is ever drawn into the artwork.** Every prompt forbids lettering,
 * and each composition was generated with a deliberately empty region. The
 * amount — ৳60, 15%, and so on — is rendered as real text over that region by
 * `OfferArtwork`, so it stays crisp, selectable, and translatable into Bengali
 * numerals. `textAnchor` records which region was left open; `textTone` records
 * whether that region is bone or charcoal.
 *
 * The art direction, the discarded first direction and the review checklist are
 * in `docs/offer-ai-image-manifest.md` rather than repeated five times here.
 *
 * One-off authoring tool; the application never runs it.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE = 'reference-assets/generated/offers/source';
const OUT_DIR = 'public/media/offers';
const WIDTHS = [640, 1024, 1600];

const MODEL = 'OpenAI GPT image generation (ChatGPT)';
const GENERATED_AT = '2026-09-05';

/**
 * Where each composition was left open, and what ink reads there.
 *
 * Both axes, not just the horizontal one. Recording only "right" put the
 * family-box figure straight onto a seat back, because that composition is
 * open across its *top* right rather than down its whole right side.
 */
const LAYOUT = {
  'off-matinee': { textAnchor: 'right', textAlign: 'center', textTone: 'ink' },
  'off-family-four': { textAnchor: 'right', textAlign: 'top', textTone: 'ink' },
  'off-late-repertory': { textAnchor: 'left', textAlign: 'bottom', textTone: 'paper' },
  'off-sensory': { textAnchor: 'left', textAlign: 'center', textTone: 'ink' },
  'off-student-weeknight': { textAnchor: 'left', textAlign: 'center', textTone: 'ink' },
};

/**
 * Alt text. The artwork carries meaning, so it gets described — but the offer's
 * own title and terms sit beside it as real text, so this describes the picture
 * rather than restating the deal.
 */
const ALT = {
  'off-matinee':
    'A screenprinted poster: an oversized clock reading just before three, throwing a red beam over rows of cinema seats',
  'off-family-four':
    'A screenprinted poster: four cinema seats side by side, two large and two small, sharing one box of popcorn',
  'off-late-repertory':
    'A screenprinted poster: a projector throwing a red beam across a darkened auditorium to a blank screen, a crescent moon above',
  'off-sensory':
    'A screenprinted poster: a pendant house light lit to only half its cone, with sound waves fading away beside it',
  'off-student-weeknight':
    'A screenprinted poster: a red lanyard and blank identity card hung over the back of a cinema seat',
};

const PROMPT = {
  'off-matinee':
    'An oversized clock face cropped by the left edge, hands a few minutes before three, over a simplified row of cinema seat backs. Right third left open.',
  'off-family-four':
    'Four cinema seats seen straight on — two adult-height, two child-height — with one shared popcorn box on the middle armrest. Upper right left open.',
  'off-late-repertory':
    'A projector in the upper left throwing a hard-edged wedge of light diagonally to a blank screen at the lower right, seat backs below, a crescent moon in the dark. Lower left left open.',
  'off-sensory':
    'A pendant house light hanging from the top edge, its light cone filled to only half its height, with diminishing concentric sound arcs beside it. Left half left open.',
  'off-student-weeknight':
    'A cinema seat seen from behind at the right, a lanyard draped over its back with a completely blank identity card hanging from it. Left half left open.',
};

const files = readdirSync(SOURCE).filter((f) => f.endsWith('.jpg'));
const ids = files.map((f) => f.replace(/\.jpg$/, '')).sort();

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];

for (const id of ids) {
  const alt = ALT[id];
  const prompt = PROMPT[id];
  const layout = LAYOUT[id];
  if (!alt || !prompt || !layout) throw new Error(`no alt/prompt/layout for ${id}`);

  const meta = await sharp(join(SOURCE, `${id}.jpg`)).metadata();
  if (meta.hasAlpha) throw new Error(`${id} has an alpha channel`);

  for (const width of WIDTHS) {
    const height = Math.round((width / 16) * 9);
    const base = sharp(join(SOURCE, `${id}.jpg`)).resize(width, height, {
      fit: 'cover',
      position: 'centre',
    });
    await base.clone().avif({ quality: 62 }).toFile(join(OUT_DIR, `${id}-${width}.avif`));
    await base.clone().webp({ quality: 74 }).toFile(join(OUT_DIR, `${id}-${width}.webp`));
    await base
      .clone()
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(OUT_DIR, `${id}-${width}.jpg`));
  }

  manifest.push({ id, basePath: `/media/offers/${id}`, alt, prompt, ...layout });
  process.stdout.write(`  ${id} (${WIDTHS.join('/')})\n`);
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = manifest
  .map(
    (m) => `  {
    offerId: '${m.id}',
    basePath: '${m.basePath}',
    widths: [${WIDTHS.join(', ')}],
    alt: '${esc(m.alt)}',
    textAnchor: '${m.textAnchor}',
    textAlign: '${m.textAlign}',
    textTone: '${m.textTone}',
    sourceType: 'ai-generated',
    model: '${esc(MODEL)}',
    generatedAt: '${GENERATED_AT}',
    prompt: '${esc(m.prompt)}',
    aspectRatio: '16:9',
    illustrative: true,
  },`,
  )
  .join('\n');

const fileBody = `/**
 * Offer artwork — AI-generated.
 *
 * Five screenprinted poster illustrations, produced once with ${MODEL} on
 * ${GENERATED_AT} and committed under \`public/media/offers/\`. No offer shares
 * artwork with another, and the running application never requests an image
 * from a remote host.
 *
 * Illustration rather than photography on purpose: a promotion is not a place
 * or a thing, so photographing one would mean inventing a scene or reaching for
 * stock. It also keeps the three image sets legible — foyers and the counter
 * are photographs, offers are prints.
 *
 * **The figures are not in the pictures.** Every prompt forbade lettering, and
 * each composition was generated with an empty region. The amount is rendered
 * as real text over that region by \`OfferArtwork\` — crisp, selectable, and
 * shown in Bengali numerals in Bangla. \`textAnchor\` is the region that was
 * left open, \`textAlign\` where in it, and \`textTone\` the ink that reads there.
 *
 * Provenance, art direction and the review checklist:
 * \`docs/offer-ai-image-manifest.md\`.
 *
 * Generated by \`scripts/build-offer-media.mjs\`. Do not edit by hand.
 */

export interface GeneratedOfferImage {
  offerId: string;
  /** Local path without width or extension. */
  basePath: string;
  widths: number[];
  alt: string;
  /** Which half of the composition was deliberately left free of detail. */
  textAnchor: 'left' | 'right';
  /** And where in that half — the clear region is not always vertically centred. */
  textAlign: 'top' | 'center' | 'bottom';
  /** Whether that region is light or dark, and so which ink reads on it. */
  textTone: 'ink' | 'paper';
  sourceType: 'ai-generated';
  model: string;
  generatedAt: string;
  prompt: string;
  aspectRatio: '16:9';
  illustrative: true;
}

export const offerImages: GeneratedOfferImage[] = [
${rows}
];

export const offerImageById = new Map(offerImages.map((image) => [image.offerId, image]));
`;

writeFileSync('src/data/offerMedia.ts', fileBody);
console.log(`\n  ${manifest.length} offers → ${OUT_DIR} and src/data/offerMedia.ts\n`);
