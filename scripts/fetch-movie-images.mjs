#!/usr/bin/env node
/**
 * One-off authoring tool. Not part of the build, not shipped.
 *
 * Downloads each film's poster and backdrop from TMDB **once**, converts them
 * to AVIF / WebP / JPEG at several widths, and writes them into
 * `public/media/movies/`. The running application never touches the network for
 * artwork — it serves these local files.
 *
 *   node scripts/fetch-movie-images.mjs
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const RESEARCH = JSON.parse(
  await import('node:fs').then((fs) => fs.promises.readFile('movie-research.json', 'utf8')),
);

/** The catalogue, in the order it will appear in `movies.ts`. */
const SELECTED = [
  // ── Now showing ──
  'The Odyssey',
  'Spider-Man: Brand New Day',
  'Toy Story 5',
  'Project Hail Mary',
  'Supergirl',
  'Backrooms',
  'Moana',
  'Masters of the Universe',
  // ── Coming soon (all verified to release after 2026-08-03) ──
  'Avengers: Doomsday',
  'Dune: Part Three',
  'The Hunger Games: Sunrise on the Reaping',
  'Jumanji: Open World',
  'Clayface',
  'Klara and the Sun',
];

/** TMDB serves the largest useful masters at these widths. */
const SOURCE = { poster: 'w780', backdrop: 'w1280' };

/** Output widths. Posters are 2:3; backdrops are 16:9. */
const WIDTHS = { poster: [200, 400, 600], backdrop: [640, 1280, 1920] };

const ROOT = 'public/media/movies';
const DIRS = { poster: join(ROOT, 'posters'), backdrop: join(ROOT, 'backdrops') };

for (const dir of Object.values(DIRS)) mkdirSync(dir, { recursive: true });

const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/['’.:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const manifest = [];

for (const title of SELECTED) {
  const record = RESEARCH.find((r) => r.title === title);
  if (!record) {
    console.error(`MISSING research for "${title}"`);
    process.exitCode = 1;
    continue;
  }

  const slug = slugify(title);

  for (const role of ['poster', 'backdrop']) {
    const file = record[role];
    if (!file) {
      console.error(`MISSING ${role} for "${title}"`);
      process.exitCode = 1;
      continue;
    }

    const sourceUrl = `https://image.tmdb.org/t/p/${SOURCE[role]}/${file}`;
    const buffer = await download(sourceUrl);
    const meta = await sharp(buffer).metadata();

    const outputs = [];
    for (const width of WIDTHS[role]) {
      // Never upscale past the master.
      if (meta.width && width > meta.width) continue;
      const base = `${slug}-${width}`;
      const pipeline = sharp(buffer).resize({ width, withoutEnlargement: true });

      await pipeline.clone().avif({ quality: 55 }).toFile(join(DIRS[role], `${base}.avif`));
      await pipeline.clone().webp({ quality: 78 }).toFile(join(DIRS[role], `${base}.webp`));
      await pipeline.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(join(DIRS[role], `${base}.jpg`));
      outputs.push(width);
    }

    const largest = outputs[outputs.length - 1];
    const scaled = await sharp(buffer).resize({ width: largest, withoutEnlargement: true }).metadata();

    manifest.push({
      movie: title,
      slug,
      role,
      widths: outputs,
      basePath: `/media/movies/${role}s/${slug}`,
      source: sourceUrl,
      sourcePage: `https://www.themoviedb.org${record.tmdbPath}`,
      provider: 'TMDB',
      originalWidth: meta.width ?? null,
      originalHeight: meta.height ?? null,
      processedWidth: scaled.width ?? null,
      processedHeight: scaled.height ?? null,
    });

    console.error(`ok ${slug} ${role} → ${outputs.join(', ')}`);
  }
}

writeFileSync('movie-images.json', JSON.stringify(manifest, null, 2));
console.error(`\nwrote movie-images.json (${manifest.length} entries)`);

// Guard: no two films may share a source image.
const seen = new Map();
for (const entry of manifest) {
  if (seen.has(entry.source)) {
    console.error(`DUPLICATE source image: ${entry.movie} reuses ${seen.get(entry.source)}`);
    process.exitCode = 1;
  }
  seen.set(entry.source, entry.movie);
}
if (!existsSync(ROOT)) process.exitCode = 1;
