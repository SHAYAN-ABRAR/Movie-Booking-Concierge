#!/usr/bin/env node
/**
 * One-off research tool. Not part of the build.
 *
 * Resolves a list of real film titles against TMDB's public pages, scrapes the
 * facts the catalogue needs, and writes them to a JSON file for review before
 * anything is committed to `src/data/movies.ts`.
 *
 * This runs at *authoring* time only. The shipped application makes no network
 * request for movie data or artwork — everything is baked into the repository.
 *
 *   node scripts/fetch-movie-data.mjs > movie-research.json
 */

import { writeFileSync } from 'node:fs';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  // Ask for English metadata; TMDB otherwise localises by IP.
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Films to resolve.
 *
 * `path` pins the exact TMDB record where a title search is ambiguous — "The
 * Odyssey" resolves to a concert film, "Street Fighter" to a 2005 B-movie.
 * Every pinned path was taken from TMDB's own now-playing listing.
 */
const TARGETS = [
  // ── Now showing / recently released ──
  { query: 'The Odyssey', path: '/movie/1368337-the-odyssey', expect: 'now-showing' },
  { query: 'Spider-Man: Brand New Day', path: '/movie/969681-spider-man-brand-new-day', expect: 'now-showing' },
  { query: 'Toy Story 5', path: '/movie/1084244-toy-story-5', expect: 'now-showing' },
  { query: 'Project Hail Mary', path: '/movie/687163-project-hail-mary', expect: 'now-showing' },
  { query: 'Supergirl', path: '/movie/1081003-supergirl', expect: 'now-showing' },
  { query: 'Backrooms', path: '/movie/1083381-backrooms', expect: 'now-showing' },
  { query: 'Moana', path: '/movie/1108427-moana', expect: 'now-showing' },
  { query: 'Masters of the Universe', path: '/movie/454639-masters-of-the-universe', expect: 'now-showing' },
  // ── Coming soon ──
  { query: 'Avengers: Doomsday', expect: 'coming-soon' },
  { query: 'Dune: Part Three', expect: 'coming-soon' },
  { query: 'The Hunger Games: Sunrise on the Reaping', expect: 'coming-soon' },
  // Candidates — only those with a release date after 2026-08-03 are kept.
  { query: 'Klara and the Sun', expect: 'coming-soon' },
  { query: 'Jumanji Open World', expect: 'coming-soon' },
  { query: 'Ebenezer A Christmas Carol', expect: 'coming-soon' },
  { query: 'Clayface', expect: 'coming-soon' },
  { query: 'The Devil Wears Prada 2', expect: 'coming-soon' },
  { query: 'Shrek 5', expect: 'coming-soon' },
];

async function get(url) {
  const res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

const first = (re, html, group = 1) => {
  const m = html.match(re);
  return m ? m[group].trim() : null;
};

async function resolve(query) {
  const html = await get(`https://www.themoviedb.org/search/movie?query=${encodeURIComponent(query)}`);
  // The first result card's movie link.
  const m = html.match(/href="(\/movie\/\d+[^"]*)"/);
  return m ? m[1].split('?')[0] : null;
}

function decode(text) {
  if (!text) return null;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrape(path) {
  const html = await get(`https://www.themoviedb.org${path}`);

  const images = [...html.matchAll(/property="og:image" content="https:\/\/media\.themoviedb\.org\/t\/p\/(\w+)\/([A-Za-z0-9]+\.jpg)"/g)];
  const poster = images.find((i) => i[1] === 'w500')?.[2] ?? null;
  const backdrop = images.find((i) => i[1] !== 'w500')?.[2] ?? null;

  const genres = [...(first(/<span class="genres">(.*?)<\/span>/s, html) ?? '').matchAll(/>([^<]+)<\/a>/g)]
    .map((g) => g[1].trim());

  const crew = [...html.matchAll(
    /<li class="profile">\s*<p>\s*<a href="\/person\/[^"]*">([^<]+)<\/a>\s*<\/p>\s*<p class="character">([^<]+)<\/p>/g,
  )].map((m) => ({ name: m[1].trim(), job: m[2].trim() }));

  const castBlock = html.slice(html.indexOf('id="cast_scroller"'), html.indexOf('id="cast_scroller"') + 9000);
  const cast = [...castBlock.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]).slice(0, 5);

  return {
    tmdbPath: path,
    tmdbId: Number(path.split('/')[2].split('-')[0]),
    title: decode(first(/property="og:title" content="([^"]*)"/, html)),
    releaseRaw: first(/<span class="release">\s*([^<]+?)\s*<\/span>/, html),
    certification: first(/<span class="certification">\s*([^<]+?)\s*<\/span>/, html),
    runtime: first(/<span class="runtime">\s*([^<]+?)\s*<\/span>/, html),
    genres,
    director: crew.find((c) => /Director/.test(c.job))?.name ?? null,
    crew: crew.slice(0, 4),
    cast,
    overview: decode(first(/class="overview" dir="auto">\s*<p>(.*?)<\/p>/s, html)),
    poster,
    backdrop,
  };
}

const out = [];
for (const target of TARGETS) {
  try {
    const path = target.path ?? (await resolve(target.query));
    if (!path) {
      out.push({ query: target.query, error: 'not found' });
      continue;
    }
    const data = await scrape(path);
    out.push({ query: target.query, expect: target.expect, ...data });
    console.error(`ok   ${data.title} — ${data.releaseRaw} — poster ${data.poster ? 'yes' : 'NO'} backdrop ${data.backdrop ? 'yes' : 'NO'}`);
  } catch (error) {
    out.push({ query: target.query, error: String(error) });
    console.error(`FAIL ${target.query}: ${error}`);
  }
}

writeFileSync('movie-research.json', JSON.stringify(out, null, 2));
console.error(`\nwrote movie-research.json (${out.length} entries)`);
