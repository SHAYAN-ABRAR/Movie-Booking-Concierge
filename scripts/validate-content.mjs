#!/usr/bin/env node
/**
 * Content validation.
 *
 * Guards the two rules that are easy to break silently and impossible to see in
 * a typecheck:
 *
 *   1. No fictional film may return to the customer-facing catalogue.
 *   2. Every image the application renders must be a real local file with a
 *      recorded source.
 *
 * Run by `npm run validate:content`, and part of `npm run verify`.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const problems = [];
const fail = (message) => problems.push(message);

/* ── The removed fictional catalogue ──────────────────────────────────── */

const RETIRED_TITLES = [
  'Cholonto Chhaya',
  'The Salt Line',
  'Rickshaw City',
  'Nadir Naam Meghna',
  'Kaanch',
  'Nishiddho Raat',
];
const RETIRED_IDS = [
  'mov-cholonto-chhaya',
  'mov-the-salt-line',
  'mov-rickshaw-city',
  'mov-nadir-naam-meghna',
  'mov-kaanch',
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/** Runtime source only — docs may name a removed title in a migration note. */
const runtimeFiles = walk('src').filter((f) => /\.(tsx?|jsx?)$/.test(f));

for (const file of runtimeFiles) {
  const text = readFileSync(file, 'utf8');
  for (const needle of [...RETIRED_TITLES, ...RETIRED_IDS]) {
    if (text.includes(needle)) {
      // The validator's own guard list, and the e2e assertions that check the
      // titles are *gone*, are allowed to name them.
      if (/validate-content|\.spec\.ts$/.test(file)) continue;
      fail(`${relative(process.cwd(), file)} still references the retired title "${needle}"`);
    }
  }
}

/* ── Movies ───────────────────────────────────────────────────────────── */

const moviesSource = readFileSync('src/data/movies.ts', 'utf8');
const manifestSource = readFileSync('src/data/mediaManifest.ts', 'utf8');
const TODAY = '2026-08-03';

const movieBlocks = [...moviesSource.matchAll(/\{\s*\n\s*id: '(mov-[^']+)',([\s\S]*?)\n  \},/g)];
if (movieBlocks.length === 0) fail('could not parse any movies from src/data/movies.ts');

const field = (block, name) => block.match(new RegExp(`${name}: '([^']*)'`))?.[1] ?? null;

let nowShowing = 0;
let comingSoon = 0;

for (const [, id, block] of movieBlocks) {
  const title = field(block, 'title');
  const status = field(block, 'status');
  const release = field(block, 'releaseDate');
  const poster = field(block, 'poster');
  const backdrop = field(block, 'backdrop');
  const verifiedAt = field(block, 'verifiedAt');
  const source = field(block, 'metadataSource');

  if (status === 'now-showing') nowShowing += 1;
  if (status === 'coming-soon') comingSoon += 1;

  if (!poster) fail(`${title}: no poster`);
  if (!backdrop) fail(`${title}: no backdrop`);
  if (!verifiedAt) fail(`${title}: no verification date`);
  if (!source?.startsWith('http')) fail(`${title}: no metadata source`);

  if (status === 'coming-soon' && (!release || release <= TODAY)) {
    fail(`${title}: marked coming-soon but its release date (${release}) is not in the future`);
  }
  if (status === 'now-showing' && release && release > TODAY) {
    fail(`${title}: marked now-showing but does not release until ${release}`);
  }

  // Every declared width must exist on disk, in all three formats.
  for (const [role, base] of [['poster', poster], ['backdrop', backdrop]]) {
    if (!base) continue;
    if (/^https?:/.test(base)) fail(`${title}: ${role} is a remote URL — artwork must be local`);
    const widths = manifestSource
      .match(new RegExp(`basePath: '${base}',\\s*\\n\\s*widths: \\[([^\\]]+)\\]`))?.[1]
      ?.split(',')
      .map((w) => Number(w.trim()));
    if (!widths?.length) {
      fail(`${title}: ${role} "${base}" has no manifest entry`);
      continue;
    }
    for (const width of widths) {
      for (const ext of ['avif', 'webp', 'jpg']) {
        const path = join('public', `${base}-${width}.${ext}`);
        if (!existsSync(path)) fail(`${title}: missing image file ${path}`);
      }
    }
  }
}

if (nowShowing < 8) fail(`only ${nowShowing} now-showing films; at least 8 required`);
if (comingSoon < 6) fail(`only ${comingSoon} coming-soon films; at least 6 required`);

// No two films may share a source image.
const sources = [...manifestSource.matchAll(/source: '([^']+)'/g)].map((m) => m[1]);
const dupes = sources.filter((s, i) => sources.indexOf(s) !== i);
if (dupes.length) fail(`movie artwork reused across films: ${[...new Set(dupes)].join(', ')}`);

/* ── Concessions ──────────────────────────────────────────────────────── */

const concessionsSource = readFileSync('src/data/concessions.ts', 'utf8');
const mediaSource = readFileSync('src/data/concessionMedia.ts', 'utf8');

const itemIds = [...concessionsSource.matchAll(/id: '(con-[^']+)'/g)].map((m) => m[1]);
const photoIds = [...mediaSource.matchAll(/itemId: '(con-[^']+)'/g)].map((m) => m[1]);

for (const id of itemIds) {
  if (!photoIds.includes(id)) fail(`concession ${id} has no photograph`);
}

const photoBlocks = [...mediaSource.matchAll(/\{\s*\n\s*itemId: '(con-[^']+)',([\s\S]*?)\n  \},/g)];
const photoPaths = [];

for (const [, id, block] of photoBlocks) {
  const base = field(block, 'basePath');
  const licence = field(block, 'licence');
  const sourcePage = field(block, 'sourcePage');
  const alt = field(block, 'alt');

  if (!base) { fail(`${id}: no basePath`); continue; }
  if (/^https?:/.test(base)) fail(`${id}: photograph is a remote URL`);
  if (!licence) fail(`${id}: no licence recorded`);
  if (!sourcePage?.startsWith('http')) fail(`${id}: no source page recorded`);
  if (!alt || alt.length < 8) fail(`${id}: alt text is missing or too short`);
  photoPaths.push(base);

  const widths = block.match(/widths: \[([^\]]+)\]/)?.[1]?.split(',').map((w) => Number(w.trim())) ?? [];
  if (widths.length === 0) fail(`${id}: no rendered widths`);
  for (const width of widths) {
    for (const ext of ['avif', 'webp', 'jpg']) {
      const path = join('public', `${base}-${width}.${ext}`);
      if (!existsSync(path)) fail(`${id}: missing image file ${path}`);
    }
  }
}

const photoDupes = photoPaths.filter((p, i) => photoPaths.indexOf(p) !== i);
if (photoDupes.length) fail(`concession photographs reused: ${[...new Set(photoDupes)].join(', ')}`);

/* ── No illustration component may return to the counter ──────────────── */

if (existsSync('src/components/visual/CounterIllustration.tsx')) {
  fail('CounterIllustration.tsx is back — the counter must use photography');
}
for (const file of runtimeFiles) {
  if (/CounterIllustration/.test(readFileSync(file, 'utf8')) && !/validate-content/.test(file)) {
    fail(`${relative(process.cwd(), file)} mounts a concession illustration`);
  }
}

/* ── Report ───────────────────────────────────────────────────────────── */

if (problems.length) {
  console.error(`\nvalidate:content — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  · ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(
  `validate:content — ${movieBlocks.length} films (${nowShowing} now showing, ${comingSoon} coming soon), ` +
    `${itemIds.length} counter items, all artwork local and attributed.`,
);
