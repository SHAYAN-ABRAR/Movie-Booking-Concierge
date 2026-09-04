#!/usr/bin/env node
/**
 * Turns the AI-generated venue originals into shipped responsive assets and
 * rewrites `src/data/venueMedia.ts`.
 *
 * Reads:  reference-assets/generated/venues/source/<slug>.jpg
 * Writes: public/media/venues/<slug>-<width>.{avif,webp,jpg}
 *         src/data/venueMedia.ts
 *
 * The manifest it writes carries AI provenance — model, date, prompt,
 * `illustrative: true` — for the same reason the counter's does: a generated
 * image that does not say so is the beginning of a lie. `validate:content`
 * fails on any entry missing it.
 *
 * Why venues may be generated at all, when film artwork may not: GrandPlex is
 * fictional. Its five houses do not exist, so an image of one misrepresents
 * nobody. A film poster is real studio artwork and a film still contains real
 * faces — those stay real or stay absent. See docs/venue-ai-image-manifest.md.
 *
 * One-off authoring tool; the application never runs it.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE = 'reference-assets/generated/venues/source';
const OUT_DIR = 'public/media/venues';
const WIDTHS = [640, 1024, 1600];

const MODEL = 'OpenAI GPT image generation (ChatGPT)';
const GENERATED_AT = '2026-09-04';

/**
 * Alt text — a caption for someone who cannot see the picture. Each names the
 * thing that actually distinguishes that house, because "a cinema lobby" five
 * times over is worth less than nothing.
 */
const ALT = {
  dhanmondi:
    'The double-height Dhanmondi foyer at night, lit low, with a mezzanine above and one auditorium door ajar',
  bashundhara:
    'The wide single-storey Bashundhara concourse in daylight, five auditorium doors along one wall beneath a clerestory window',
  uttara:
    'The small Uttara foyer in late-morning sun, street glazing throwing long shadows across the carpet',
  agrabad:
    'The Agrabad foyer five floors up, its full-height window looking out over the container port',
  zindabazar:
    'The narrow Zindabazar foyer at dusk, two auditorium doors and a window onto the lit high street below',
};

/**
 * The distinctive subject clause behind each image. The shared art direction —
 * the concession counter, brass stanchions, blank lightboxes, worn carpet, one
 * door ajar, and the whole negative-prompt list — is recorded once in
 * `docs/venue-ai-image-manifest.md` rather than repeated five times here.
 */
const PROMPT = {
  dhanmondi:
    'A tall double-height cinema foyer six floors up, at night, house lights kept low, mezzanine above, four auditorium doors, the oldest house in the chain.',
  bashundhara:
    'A wide low single-storey cinema concourse in late-morning daylight from a continuous clerestory, five auditorium doors in a row, the largest and newest lobby.',
  uttara:
    'A small low-ceilinged street-level cinema foyer in raking late-morning sun through a glazed shopfront, three auditorium doors, a neighbourhood house.',
  agrabad:
    'A cinema foyer on the fifth floor of a port-city building, one enormous window looking out over a working container port in cool late-afternoon light, three auditorium doors.',
  zindabazar:
    'The narrowest cinema foyer in the chain, third floor above a high street at dusk, two auditorium doors, heavily worn carpet, street lights as soft bokeh through the window.',
};

const files = readdirSync(SOURCE).filter((f) => f.endsWith('.jpg'));
const slugs = files.map((f) => f.replace(/\.jpg$/, '')).sort();

// Everything is regenerated, so start from a clean output directory rather
// than leaving stale derivatives behind.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];

for (const slug of slugs) {
  const alt = ALT[slug];
  const prompt = PROMPT[slug];
  if (!alt || !prompt) throw new Error(`no alt/prompt for ${slug} — add it before shipping`);

  const meta = await sharp(join(SOURCE, `${slug}.jpg`)).metadata();
  if (meta.hasAlpha) throw new Error(`${slug} has an alpha channel — a photograph should be opaque`);

  for (const width of WIDTHS) {
    // Height derived to 16:9, cover-cropped from the centre. The generated set
    // is already 16:9, so this is a safety net rather than a real crop.
    const height = Math.round((width / 16) * 9);
    const base = sharp(join(SOURCE, `${slug}.jpg`)).resize(width, height, {
      fit: 'cover',
      position: 'centre',
    });
    await base.clone().avif({ quality: 60 }).toFile(join(OUT_DIR, `${slug}-${width}.avif`));
    await base.clone().webp({ quality: 72 }).toFile(join(OUT_DIR, `${slug}-${width}.webp`));
    await base
      .clone()
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(join(OUT_DIR, `${slug}-${width}.jpg`));
  }

  manifest.push({ slug, basePath: `/media/venues/${slug}`, alt, prompt });
  process.stdout.write(`  ${slug} (${WIDTHS.join('/')})\n`);
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const rows = manifest
  .map(
    (m) => `  {
    cinemaSlug: '${m.slug}',
    basePath: '${m.basePath}',
    widths: [${WIDTHS.join(', ')}],
    alt: '${esc(m.alt)}',
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
 * Venue imagery — AI-generated.
 *
 * Each of the five houses has its own generated foyer photograph, produced
 * once with ${MODEL} on ${GENERATED_AT} and committed to this repository under
 * \`public/media/venues/\`. No house shares an image with another, and the
 * running application never requests an image from a remote host.
 *
 * These are *illustrations*, not photographs of real rooms — GrandPlex is a
 * demonstration and its venues do not exist. That is precisely why generating
 * them is legitimate where generating a film poster is not: an image of a
 * fictional lobby misrepresents nobody, while a poster is real studio artwork
 * and a still contains real faces.
 *
 * The customer-facing disclosure says so on every cinema page. Full prompts,
 * the shared art direction and the review record are in
 * \`docs/venue-ai-image-manifest.md\`.
 *
 * Generated by \`scripts/build-venue-media.mjs\`. Do not edit by hand.
 */

export interface GeneratedVenueImage {
  cinemaSlug: string;
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
  aspectRatio: '16:9';
  /** Always true: a generated representation, not a real room. */
  illustrative: true;
}

export const venueImages: GeneratedVenueImage[] = [
${rows}
];

export const venueImageBySlug = new Map(venueImages.map((image) => [image.cinemaSlug, image]));
`;

writeFileSync('src/data/venueMedia.ts', fileBody);
console.log(`\n  ${manifest.length} venues → ${OUT_DIR} and src/data/venueMedia.ts\n`);
