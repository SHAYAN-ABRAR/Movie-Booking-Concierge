#!/usr/bin/env node
/**
 * One-off authoring tool. Not part of the build, not shipped.
 *
 * Finds a real, commercially-licensed photograph for every item on the counter
 * via the Openverse API (no key required), downloads it once, converts it to
 * AVIF / WebP / JPEG at three widths, and records full attribution.
 *
 * The running application never contacts an image host.
 *
 *   node scripts/fetch-concession-photos.mjs
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/** One search per item. No item may share a photograph with another. */
const ITEMS = [
  { id: 'con-popcorn-salt-r', q: 'popcorn bucket cinema' },
  { id: 'con-popcorn-salt-l', q: 'popcorn', alts: ['popcorn bowl', 'popped corn snack', 'popcorn kernels bowl'] },
  { id: 'con-popcorn-caramel', q: 'caramel popcorn' },
  { id: 'con-popcorn-cheese', q: 'cheese popcorn snack' },
  { id: 'con-cola-r', q: 'glass of cola ice', alts: ['soft drink glass ice cubes', 'iced drink glass table', 'soda pour glass'] },
  {
    id: 'con-cola-l',
    q: 'iced drink tall glass',
    pin: '5c904f83-e083-4b71-a791-7035732835eb',
    alts: ['tall glass fizzy drink ice', 'cold drink glass ice'],
  },
  { id: 'con-lassi', q: 'milkshake glass', alts: ['smoothie glass drink', 'milk drink glass', 'yogurt smoothie'] },
  { id: 'con-lemon-soda', q: 'lemon soda lime drink' },
  { id: 'con-tea', q: 'masala chai tea cup' },
  { id: 'con-samosa', q: 'samosa fried snack' },
  { id: 'con-chicken-roll', q: 'kathi roll', alts: ['chicken wrap sandwich', 'shawarma wrap', 'chicken roll food'] },
  { id: 'con-nachos', q: 'nachos cheese sauce' },
  { id: 'con-mishti', q: 'indian sweets', alts: ['mithai sweets box', 'laddu sweets', 'dessert sweets plate'] },
  { id: 'con-choc-icecream', q: 'chocolate ice cream', alts: ['ice cream scoop bowl', 'ice cream dessert', 'gelato chocolate'] },
  { id: 'con-combo-two', q: 'movie snacks', alts: ['snack platter', 'popcorn and soda', 'cinema food tray'] },
  { id: 'con-combo-family', q: 'party snacks table', alts: ['sharing platter food', 'snack spread table', 'finger food platter'] },
];

const OUT = 'public/media/concessions';
const WIDTHS = [480, 800, 1200];
mkdirSync(OUT, { recursive: true });

/** Licences that permit commercial reuse with attribution. */
const OK_LICENCES = new Set(['by', 'by-sa', 'cc0', 'pdm', 'by-nd']);

async function search(query) {
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
    `&license_type=commercial&size=large&mature=false&page_size=12`;
  const res = await fetch(url, { headers: { 'User-Agent': 'grandplex-movie-booking-demo/1.0' } });
  if (!res.ok) throw new Error(`search ${res.status}`);
  const json = await res.json();
  return json.results ?? [];
}

const only = process.argv.slice(2);
const existing = existsSync('concession-photos.json')
  ? JSON.parse(readFileSync('concession-photos.json', 'utf8'))
  : [];

const usedIds = new Set(existing.map((e) => e.openverseId));
const manifest = only.length ? existing.filter((e) => !only.includes(e.itemId)) : [];

for (const item of ITEMS) {
  if (only.length && !only.includes(item.id)) continue;
  let chosen = null;
  let buffer = null;

  const queries = [item.q, ...(item.alts ?? [])];
  const results = [];
  for (const query of queries) {
    results.push(...(await search(query)));
    if (results.length >= 24) break;
  }

  const ordered = item.pin
    ? [...results.filter((r) => r.id === item.pin), ...results]
    : results;

  for (const candidate of ordered) {
    if (usedIds.has(candidate.id)) continue;
    if (!OK_LICENCES.has(candidate.license)) continue;
    if (!candidate.url) continue;

    try {
      const res = await fetch(candidate.url, { headers: { 'User-Agent': 'grandplex-movie-booking-demo/1.0' } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      // Reject anything too small to be a card photograph, and anything
      // portrait — the card slot is landscape.
      if (!meta.width || meta.width < 800) continue;
      if (!meta.height || meta.height > meta.width * 1.35) continue;
      // An alpha channel means a cut-out — clip art, not photography.
      if (meta.hasAlpha) continue;
      // Line art and cut-outs have very few distinct colours; photographs do not.
      const stats = await sharp(buf).stats();
      const spread = stats.channels.reduce((sum, c) => sum + c.stdev, 0) / stats.channels.length;
      if (spread < 28) continue;
      chosen = candidate;
      buffer = buf;
      break;
    } catch {
      // Dead link or an unsupported format — try the next candidate.
    }
  }

  if (!chosen || !buffer) {
    console.error(`NO USABLE PHOTO for ${item.id} ("${item.q}")`);
    process.exitCode = 1;
    continue;
  }

  usedIds.add(chosen.id);
  const slug = item.id.replace(/^con-/, '');
  const meta = await sharp(buffer).metadata();

  const widths = [];
  for (const width of WIDTHS) {
    if (meta.width && width > meta.width) continue;
    // 4:3, cropped to the middle — the counter slot is a fixed ratio.
    const pipeline = sharp(buffer).resize({
      width,
      height: Math.round((width / 4) * 3),
      fit: 'cover',
      position: 'centre',
    });
    await pipeline.clone().avif({ quality: 55 }).toFile(join(OUT, `${slug}-${width}.avif`));
    await pipeline.clone().webp({ quality: 78 }).toFile(join(OUT, `${slug}-${width}.webp`));
    await pipeline.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, `${slug}-${width}.jpg`));
    widths.push(width);
  }

  manifest.push({
    itemId: item.id,
    slug,
    basePath: `/media/concessions/${slug}`,
    widths,
    openverseId: chosen.id,
    title: chosen.title ?? null,
    creator: chosen.creator ?? 'Unknown',
    creatorUrl: chosen.creator_url ?? null,
    sourcePage: chosen.foreign_landing_url ?? null,
    sourceFile: chosen.url,
    provider: chosen.provider ?? 'openverse',
    licence: `CC ${String(chosen.license).toUpperCase()} ${chosen.license_version ?? ''}`.trim(),
    licenceUrl: chosen.license_url ?? null,
    originalWidth: meta.width ?? null,
    originalHeight: meta.height ?? null,
    downloadedAt: '2026-08-03',
  });

  console.error(`ok ${slug} ← ${chosen.provider} ${chosen.license} (${meta.width}×${meta.height})`);
}

manifest.sort((a, b) => ITEMS.findIndex((i) => i.id === a.itemId) - ITEMS.findIndex((i) => i.id === b.itemId));
writeFileSync('concession-photos.json', JSON.stringify(manifest, null, 2));
console.error(`\nwrote concession-photos.json (${manifest.length}/${ITEMS.length})`);
if (!existsSync(OUT)) process.exitCode = 1;
