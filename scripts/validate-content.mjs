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

/**
 * Splits the file at each movie's `id:` rather than matching up to the first
 * `\n  },`.
 *
 * The lazy-terminator version broke the moment a movie gained a nested object:
 * `trailer: { … }` closes with a brace at exactly the indentation used as the
 * *movie* terminator, so every block was silently truncated after the trailer
 * and the validator reported that fourteen films had no poster, no backdrop and
 * no metadata source. It failed loudly, which is the only reason this was
 * caught — but it was reporting a fiction.
 *
 * Splitting on the start marker has no terminator to be confused by, so it
 * survives any nesting a movie record grows later.
 */
// `\r?\n`: the working tree is CRLF on Windows and LF in CI, and a validator
// that only passes on one of them is worse than no validator.
const MOVIE_START = /^ {2}\{\r?\n {4}id: '(mov-[^']+)',$/gm;
const starts = [...moviesSource.matchAll(MOVIE_START)];
const movieBlocks = starts.map((match, index) => {
  const from = match.index;
  const to = index + 1 < starts.length ? starts[index + 1].index : moviesSource.length;
  return [moviesSource.slice(from, to), match[1], moviesSource.slice(from, to)];
});
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

  /* ── Trailer ────────────────────────────────────────────────────────
   * A film must either carry a verified official trailer or say plainly
   * that none has been released. What it may not do is carry a trailer with
   * no provenance — an unattributed video id is indistinguishable from a fan
   * upload, and the whole point of the record is that the claim is checkable.
   * `npm run verify:trailers` re-checks the channel against YouTube itself.
   * ────────────────────────────────────────────────────────────────── */
  const hasTrailer = /\btrailer: \{/.test(block);
  const trailerStatus = field(block, 'trailerStatus');

  if (!hasTrailer && !trailerStatus) {
    fail(`${title}: no trailer and no trailerStatus explaining why`);
  }
  if (hasTrailer) {
    const provider = field(block, 'provider');
    const videoId = field(block, 'videoId');
    const channel = field(block, 'officialChannel');
    const trailerVerified = block.match(/officialChannel:[\s\S]*?verifiedAt: '([^']*)'/)?.[1];
    const type = field(block, 'type');

    if (provider !== 'youtube') fail(`${title}: unsupported trailer provider ${provider}`);
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
      fail(`${title}: trailer videoId is not an 11-character YouTube id`);
    }
    if (!channel) fail(`${title}: trailer has no officialChannel — provenance is the evidence`);
    if (!trailerVerified) fail(`${title}: trailer has no verifiedAt date`);
    if (type !== 'official-trailer' && type !== 'official-teaser') {
      fail(`${title}: trailer type must be official-trailer or official-teaser, not ${type}`);
    }
  }

  /* ── Short story ──────────────────────────────────────────────────── */
  const story = block.match(/shortStory:\s*\r?\n?\s*'([\s\S]*?)',\r?\n {2}shortStoryBn/)?.[1];
  const storyBn = block.match(/shortStoryBn:\s*\r?\n?\s*'([\s\S]*?)',\r?\n/)?.[1];

  if (!story) fail(`${title}: no shortStory`);
  if (!storyBn) fail(`${title}: no shortStoryBn`);
  if (storyBn && !/[ঀ-৿]/.test(storyBn)) {
    fail(`${title}: shortStoryBn contains no Bengali characters`);
  }
  if (story) {
    const words = story.split(/\s+/).length;
    // The panel is a fixed slot under a selected film. Much shorter says
    // nothing; much longer stops being read and starts needing a scrollbar.
    if (words < 30) fail(`${title}: shortStory is only ${words} words — too thin to be useful`);
    if (words > 95) fail(`${title}: shortStory is ${words} words — too long for the panel`);

    const synopsis = field(block, 'synopsis');
    if (synopsis && synopsis.trim() === story.trim()) {
      fail(`${title}: shortStory is a copy of the synopsis, not a shorter telling`);
    }
  }

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
const imageIds = [...mediaSource.matchAll(/itemId: '(con-[^']+)'/g)].map((m) => m[1]);

for (const id of itemIds) {
  if (!imageIds.includes(id)) fail(`concession ${id} has no generated image`);
}

const imageBlocks = [...mediaSource.matchAll(/\{\s*\n\s*itemId: '(con-[^']+)',([\s\S]*?)\n  \},/g)];
const imagePaths = [];

for (const [, id, block] of imageBlocks) {
  const base = field(block, 'basePath');
  const alt = field(block, 'alt');
  const sourceType = field(block, 'sourceType');
  const model = field(block, 'model');
  const generatedAt = field(block, 'generatedAt');

  if (!base) { fail(`${id}: no basePath`); continue; }
  if (/^https?:/.test(base)) fail(`${id}: image uses an external runtime URL`);
  if (!alt || alt.length < 8) fail(`${id}: alt text is missing or too short`);

  // AI provenance is required; a stray photographer credit is forbidden.
  if (sourceType !== 'ai-generated') fail(`${id}: sourceType must be 'ai-generated'`);
  if (!model) fail(`${id}: no generation model recorded`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(generatedAt ?? '')) fail(`${id}: no generation date recorded`);
  if (/creator:|licence:|licenceUrl:|sourcePage:/.test(block)) {
    fail(`${id}: still carries photographer attribution on a generated image`);
  }
  imagePaths.push(base);

  const widths = block.match(/widths: \[([^\]]+)\]/)?.[1]?.split(',').map((w) => Number(w.trim())) ?? [];
  if (widths.length === 0) fail(`${id}: no rendered widths`);
  for (const width of widths) {
    for (const ext of ['avif', 'webp', 'jpg']) {
      const path = join('public', `${base}-${width}.${ext}`);
      if (!existsSync(path)) fail(`${id}: missing image file ${path}`);
    }
  }
}

const imageDupes = imagePaths.filter((p, i) => imagePaths.indexOf(p) !== i);
if (imageDupes.length) fail(`concession images reused: ${[...new Set(imageDupes)].join(', ')}`);

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
    `${itemIds.length} counter items with local AI-generated imagery.`,
);
