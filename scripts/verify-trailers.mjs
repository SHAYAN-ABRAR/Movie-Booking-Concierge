#!/usr/bin/env node
/**
 * Confirms who actually uploaded each trailer.
 *
 * A YouTube search for "official trailer" returns a great many videos whose
 * *titles* say "Sony Pictures Entertainment" and whose *uploader* is a fan
 * aggregator. Titles are written by whoever uploaded the video, so they prove
 * nothing. The channel does.
 *
 * This reads `author_name` from YouTube's public oEmbed endpoint — no key, no
 * quota, no account — and fails any trailer whose channel is not on the
 * official list below.
 *
 * Development-time only. The application never calls this; it ships the
 * verified video ids as committed data.
 *
 *   node scripts/verify-trailers.mjs            # check the committed catalogue
 *   node scripts/verify-trailers.mjs ID [ID…]   # check candidate ids
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Channels whose uploads count as official.
 *
 * Studio and distributor channels only. A channel is added here after checking
 * that it is the studio's own, not a fan channel using the studio's name.
 */
const OFFICIAL_CHANNELS = new Set([
  // ── Studio channels ────────────────────────────────────────────────────
  'Universal Pictures',
  'Sony Pictures Entertainment',
  'Pixar',
  'Disney',
  'Marvel Entertainment',
  'Warner Bros.',
  'DC',
  'Amazon MGM Studios',
  'A24',
  'Paramount Pictures',
  '20th Century Studios',
  'Lionsgate Movies',

  // ── Official franchise channels ────────────────────────────────────────
  // Sony runs @spiderman itself; it is the franchise's own channel, not a
  // fan account borrowing the name.
  'Spider-Man',

  // ── Official regional distributor channels ─────────────────────────────
  // A studio's own territory channel. These publish the same cut under the
  // local release date, and for some titles the full trailer only appears
  // here. Each one was checked to be the distributor's, not a fan mirror.
  'Warner Bros. UK & Ireland',
  'Warner Bros. Australia',
  'LionsgateFilmsUK',
  'Sony Pictures Malaysia',
]);

/**
 * Channels that look official and are not. Kept as a standing reminder that
 * the *title* of a video proves nothing — every one of these has uploaded a
 * video whose title contains a studio's name.
 *
 * "The Rock" is the sharpest case: Dwayne Johnson's own channel posted the
 * Moana trailer. It is authentic, and it is still not the distributor.
 */
const KNOWN_IMPOSTORS = [
  'The Film Scene',
  'Animation Society',
  'Screendollars',
  'IGN',
  'IGN Movie Trailers',
  'ONE Media',
  'OnePress TV',
  'Entertainment Tonight',
  'Rotten Tomatoes Trailers',
  'The Rock',
  'Teaser Universe',
];

async function describe(videoId) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    return { videoId, ok: false, reason: `oEmbed returned ${response.status}` };
  }
  const data = await response.json();
  return {
    videoId,
    ok: OFFICIAL_CHANNELS.has(data.author_name),
    channel: data.author_name,
    title: data.title,
    reason: OFFICIAL_CHANNELS.has(data.author_name)
      ? null
      : KNOWN_IMPOSTORS.includes(data.author_name)
        ? `"${data.author_name}" is a reuploader, whatever its video title claims`
        : `"${data.author_name}" is not a known official studio channel`,
  };
}

const argv = process.argv.slice(2);
let entries;

if (argv.length > 0) {
  entries = argv.map((videoId) => ({ videoId, movie: '(candidate)' }));
} else {
  const { movies } = await import(new URL('../src/data/movies.ts', import.meta.url));
  entries = movies
    .filter((movie) => movie.trailer)
    .map((movie) => ({ videoId: movie.trailer.videoId, movie: movie.title }));

  const missing = movies.filter((movie) => !movie.trailer);
  if (missing.length > 0) {
    console.error(`\n  ${missing.length} film(s) with no trailer record:`);
    for (const movie of missing) console.error(`    ${movie.title}`);
  }
}

const results = await Promise.all(entries.map(({ videoId }) => describe(videoId)));

let failed = 0;
for (const [index, result] of results.entries()) {
  const label = entries[index].movie.padEnd(42);
  if (result.ok) {
    console.log(`  ok    ${label}${result.channel}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${label}${result.reason}`);
    if (result.title) console.error(`        title: ${result.title}`);
  }
}

console.log(
  `\n  ${results.length - failed}/${results.length} verified against an official channel.`,
);
console.log(`  Sources: ${path.relative(root, path.join(root, 'docs/movie-trailer-sources.md'))}\n`);
process.exit(failed > 0 ? 1 : 0);
