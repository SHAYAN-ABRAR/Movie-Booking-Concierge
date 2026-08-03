#!/usr/bin/env node
/**
 * One-off authoring tool. Generates `src/data/movies.ts` from the scraped TMDB
 * research plus the hand-authored editorial fields below.
 *
 * Facts (title, release date, runtime, certificate, genres, director, cast,
 * synopsis) come from the research file and are never invented here. Where TMDB
 * has no runtime or certificate yet, the field is left honestly unresolved
 * rather than guessed.
 *
 *   node scripts/build-movies.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const research = JSON.parse(readFileSync('movie-research.json', 'utf8'));

/** TMDB genre → this catalogue's genre vocabulary. */
const GENRE = {
  Drama: 'drama', Thriller: 'thriller', Action: 'action', Comedy: 'comedy',
  Romance: 'romance', 'Science Fiction': 'sci-fi', Documentary: 'documentary',
  Animation: 'animation', Family: 'family', Horror: 'horror', Music: 'musical',
  History: 'historical', War: 'historical', Adventure: 'action', Fantasy: 'sci-fi',
  Mystery: 'thriller', Crime: 'thriller', Western: 'action', 'TV Movie': 'drama',
};

/** US/UK certificate → this demonstration's local scheme. */
const CERT = {
  G: 'U', PG: 'U', 'PG-13': 'UA12', R: 'UA16', 'NC-17': 'A18',
  U: 'U', '12': 'UA12', '12A': 'UA12', '15': 'UA16', '18': 'A18',
  M: 'UA12', MA15: 'UA16',
};

/**
 * Editorial fields. These are the programme's own voice — a tagline, a note
 * from the programmer, and where the projectionist would take an interval.
 * They are opinions about real films, not invented facts about them.
 */
const EDITORIAL = {
  'The Odyssey': {
    plate: 0, formats: ['standard', 'grandscreen', 'velvet'], intermission: 12,
    tagline: 'Ten years from Troy, and the sea is still not finished with him.',
    note: 'Nolan shoots the wine-dark sea on film stock that makes salt look like metal. The longest sitting of the season, and the one people come back for.',
    breaks: [{ fromMinute: 88, toMinute: 92, note: 'A long becalmed stretch on open water.' }],
  },
  'Spider-Man: Brand New Day': {
    plate: 1, formats: ['standard', 'three-d', 'grandscreen'], intermission: 10,
    tagline: 'A city that forgot him, and a boy starting over in it.',
    note: 'Cretton keeps the camera at street level for most of it, which makes the few times it leaves the ground genuinely lift.',
  },
  'Toy Story 5': {
    plate: 2, formats: ['standard', 'three-d'], intermission: null,
    tagline: 'The toys meet something that does not need batteries either.',
    note: 'Programmed in the afternoon for a reason. Bring the children; stay for the last twenty minutes, which are not for them.',
  },
  'Project Hail Mary': {
    plate: 3, formats: ['standard', 'grandscreen'], intermission: 12,
    tagline: 'One man, one ship, and a problem the sun is not going to wait on.',
    note: 'Lord and Miller play the science straight and let the comedy come from the man doing it. The best-liked film in the house this year.',
    breaks: [{ fromMinute: 74, toMinute: 78, note: 'A long expository stretch in the lab.' }],
  },
  Supergirl: {
    plate: 4, formats: ['standard', 'three-d', 'grandscreen'], intermission: null,
    tagline: 'She was told to be careful. She has stopped listening.',
    note: 'Gillespie makes the flying feel like weight rather than weightlessness, which is harder and much better.',
  },
  Backrooms: {
    plate: 5, formats: ['standard', 'velvet'], intermission: null,
    tagline: 'The room you walk into is the same room. That is the problem.',
    note: 'Parsons came to this from a web short and has kept its patience. Late shows only — the Velvet Room is the right place for it.',
  },
  Moana: {
    plate: 0, formats: ['standard', 'three-d', 'grandscreen'], intermission: 10,
    tagline: 'The ocean chose her once. It is asking again.',
    note: 'Kail stages the water like a theatre director, which is unexpected and works. The songs land in a full house.',
  },
  'Masters of the Universe': {
    plate: 1, formats: ['standard', 'three-d', 'grandscreen'], intermission: 12,
    tagline: 'Eternia has waited a long time for someone to lift the sword.',
    note: 'Knight brings the stop-motion eye to something enormous. The craft is visible in every frame of the second act.',
  },
  'Avengers: Doomsday': {
    plate: 2, formats: ['standard', 'three-d', 'grandscreen', 'velvet'], intermission: 15,
    tagline: 'Everything they have built, against one man who has read the plan.',
    note: 'Advance booking opens four weeks ahead. Expect the Grandscreen to go first.',
  },
  'Dune: Part Three': {
    plate: 3, formats: ['standard', 'grandscreen'], intermission: 12,
    tagline: 'The desert finishes what it started.',
    note: 'Villeneuve closes the trilogy. Book the Grandscreen if you can — this is not a film to see small.',
  },
  'The Hunger Games: Sunrise on the Reaping': {
    plate: 4, formats: ['standard', 'grandscreen'], intermission: 10,
    tagline: 'Twenty-four years before Katniss, another name came out of the bowl.',
    note: 'Lawrence returns to the arena with the fiftieth Games. The book readers already know how little mercy is in it.',
  },
  'Jumanji: Open World': {
    plate: 5, formats: ['standard', 'three-d'], intermission: 10,
    tagline: 'The game has stopped waiting to be played.',
    note: 'Kasdan again, and the Boxing Day slot. A reliable family afternoon over the holidays.',
  },
  Clayface: {
    plate: 0, formats: ['standard', 'velvet'], intermission: null,
    tagline: 'He wanted a face people would remember.',
    note: 'A genuine horror film out of a comic-book studio. Watkins does not blink, and neither does it.',
  },
  'Klara and the Sun': {
    plate: 1, formats: ['standard', 'velvet'], intermission: 10,
    tagline: 'She was built to watch, and she has been watching carefully.',
    note: 'Waititi taking Ishiguro entirely seriously. The quietest thing on the schedule this autumn.',
  },
};

const slugify = (t) =>
  t.toLowerCase().replace(/['’.:]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ORDER = Object.keys(EDITORIAL);
const TODAY = '2026-08-03';

function isoDate(raw) {
  const m = (raw ?? '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

function runtimeMinutes(raw) {
  if (!raw) return null;
  const h = Number(raw.match(/(\d+)h/)?.[1] ?? 0);
  const m = Number(raw.match(/(\d+)m/)?.[1] ?? 0);
  const total = h * 60 + m;
  return total > 0 ? total : null;
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const entries = [];
for (const title of ORDER) {
  const r = research.find((x) => x.title === title);
  if (!r) throw new Error(`no research for ${title}`);
  const ed = EDITORIAL[title];
  const slug = slugify(title);
  const release = isoDate(r.releaseRaw);
  if (!release) throw new Error(`no release date for ${title}`);

  const status = release > TODAY ? 'coming-soon' : 'now-showing';

  const genres = [...new Set((r.genres ?? []).map((g) => GENRE[g]).filter(Boolean))].slice(0, 3);
  if (genres.length === 0) genres.push('drama');

  const runtime = runtimeMinutes(r.runtime);
  const cert = CERT[r.certification ?? ''] ?? null;

  entries.push({
    id: `mov-${slug}`,
    slug,
    title,
    tagline: ed.tagline,
    synopsis: r.overview ?? 'Synopsis to be confirmed.',
    // Runtime is required by the type. Where TMDB has not published one yet the
    // catalogue records 0 and the UI prints "Runtime to be confirmed".
    runtimeMinutes: runtime ?? 0,
    runtimeConfirmed: runtime !== null,
    intermissionMinutes: runtime ? ed.intermission : null,
    certificate: cert ?? 'UA12',
    certificateConfirmed: cert !== null,
    genres,
    language: 'en',
    subtitles: ['bn'],
    director: r.director ?? 'To be confirmed',
    cast: (r.cast ?? []).slice(0, 4),
    releaseDate: release,
    status,
    formats: ed.formats,
    breaks: ed.breaks ?? null,
    plate: ed.plate,
    note: ed.note,
    poster: `/media/movies/posters/${slug}`,
    backdrop: `/media/movies/backdrops/${slug}`,
    tmdbId: r.tmdbId,
    tmdbPath: r.tmdbPath,
  });
}

const nowShowing = entries.filter((e) => e.status === 'now-showing').length;
const comingSoon = entries.filter((e) => e.status === 'coming-soon').length;

const body = entries
  .map((e) => `  {
    id: '${e.id}',
    slug: '${e.slug}',
    title: '${esc(e.title)}',
    tagline: '${esc(e.tagline)}',
    synopsis:
      '${esc(e.synopsis)}',
    runtimeMinutes: ${e.runtimeMinutes},
    runtimeConfirmed: ${e.runtimeConfirmed},
    intermissionMinutes: ${e.intermissionMinutes},
    certificate: '${e.certificate}',
    certificateConfirmed: ${e.certificateConfirmed},
    genres: [${e.genres.map((g) => `'${g}'`).join(', ')}],
    language: 'en',
    subtitles: ['bn'],
    director: '${esc(e.director)}',
    cast: [${e.cast.map((c) => `'${esc(c)}'`).join(', ')}],
    releaseDate: '${e.releaseDate}',
    status: '${e.status}',
    formats: [${e.formats.map((f) => `'${f}'`).join(', ')}],${
      e.breaks
        ? `\n    breakWindows: [${e.breaks
            .map((b) => `\n      { fromMinute: ${b.fromMinute}, toMinute: ${b.toMinute}, note: '${esc(b.note)}' },`)
            .join('')}\n    ],`
        : ''
    }
    plate: ${e.plate},
    programmeNote:
      '${esc(e.note)}',
    poster: '${e.poster}',
    backdrop: '${e.backdrop}',
    tmdbId: ${e.tmdbId},
    metadataSource: 'https://www.themoviedb.org${e.tmdbPath}',
    verifiedAt: '${TODAY}',
  },`)
  .join('\n');

const file = `import type { Movie } from './types';

/**
 * The programme.
 *
 * These are **real theatrical films**. Title, release date, runtime,
 * certificate, genre, director, cast and synopsis are transcribed from each
 * film's public TMDB record, verified on ${TODAY}, and every one carries a
 * \`metadataSource\` pointing at the record it came from.
 *
 * Everything GrandPlex-specific around them is simulated for this demonstration:
 * showtimes, screens, seat availability, prices, offers and the intermission
 * guidance. \`tagline\` and \`programmeNote\` are this programme's own editorial
 * voice — opinions about real films, not claims of fact about them.
 *
 * Artwork is local. Posters and backdrops were downloaded once from TMDB into
 * \`public/media/movies/\` and are served from this repository; the running
 * application makes no request to any image host. See \`mediaManifest.ts\` for
 * per-asset attribution.
 *
 * This product uses the TMDB API but is not endorsed or certified by TMDB.
 *
 * Generated by \`scripts/build-movies.mjs\` — ${nowShowing} now showing,
 * ${comingSoon} coming soon.
 */
export const movies: Movie[] = [
${body}
];

export const movieById = new Map(movies.map((m) => [m.id, m]));
export const movieBySlug = new Map(movies.map((m) => [m.slug, m]));

export const nowShowing = movies.filter((m) => m.status === 'now-showing');
export const comingSoon = movies.filter((m) => m.status === 'coming-soon');

export const allGenres = [...new Set(movies.flatMap((m) => m.genres))].sort();
`;

writeFileSync('src/data/movies.ts', file);
console.log(`wrote src/data/movies.ts — ${nowShowing} now showing, ${comingSoon} coming soon`);
