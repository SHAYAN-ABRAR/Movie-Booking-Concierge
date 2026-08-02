import { cinemaBySlug, cinemaById, cinemas, cities, screenById } from './cinemas';
import { allGenres, comingSoon, movieById, movieBySlug, movies, nowShowing } from './movies';
import {
  availabilityFor,
  cinemaFor,
  movieFor,
  screenFor,
  seatClassesIn,
  showtimesForCinemaDate,
  showtimesForDate,
} from './schedule';
import { isMatinee, isWeekend, priceRangeFor } from './pricing';
import { minutesFromTime, timeOfDay } from '../lib/datetime';
import type {
  Format,
  Genre,
  Language,
  Movie,
  ScreeningAccessibility,
  Showtime,
} from './types';

export * from './types';
export * from './cinemas';
export * from './movies';
export * from './pricing';
export * from './concessions';
export * from './offers';
export * from './policies';
export * from './schedule';
export * from './assetManifest';

/* ════════════════════════════════════════════════════════════════════════
   FILTERS
   One implementation, shared by the catalogue UI, the showtimes page and
   Max. When Max applies "sci-fi tonight after 8", it runs exactly the code
   the filter bar runs — there is no second, divergent search path.
   ════════════════════════════════════════════════════════════════════════ */

export interface MovieFilter {
  query?: string;
  genres?: Genre[];
  languages?: Language[];
  formats?: Format[];
  cinemaIds?: string[];
  date?: string;
  accessibility?: ScreeningAccessibility[];
  /** Inclusive upper bound on runtime, in minutes. */
  maxRuntime?: number;
  /** Inclusive upper bound on the cheapest adult ticket, in taka. */
  maxPrice?: number;
  status?: 'now-showing' | 'coming-soon' | 'all';
  /** Earliest acceptable start time, "HH:mm". */
  after?: string;
  /** Latest acceptable start time, "HH:mm". */
  before?: string;
  certificates?: Movie['certificate'][];
}

export const emptyMovieFilter: MovieFilter = {};

export function isFilterActive(filter: MovieFilter): boolean {
  return activeFilterCount(filter) > 0;
}

export function activeFilterCount(filter: MovieFilter): number {
  let count = 0;
  if (filter.query?.trim()) count += 1;
  if (filter.genres?.length) count += 1;
  if (filter.languages?.length) count += 1;
  if (filter.formats?.length) count += 1;
  if (filter.cinemaIds?.length) count += 1;
  if (filter.accessibility?.length) count += 1;
  if (filter.maxRuntime !== undefined) count += 1;
  if (filter.maxPrice !== undefined) count += 1;
  if (filter.after) count += 1;
  if (filter.before) count += 1;
  if (filter.certificates?.length) count += 1;
  if (filter.date) count += 1;
  return count;
}

function matchesText(movie: Movie, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    movie.title,
    movie.titleBn ?? '',
    movie.tagline,
    movie.director,
    movie.synopsis,
    ...movie.cast,
    ...movie.genres,
  ]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

/** The cheapest adult ticket for a screening, excluding the booking fee. */
export function cheapestAdultSeatPrice(showtime: Showtime): number {
  const { min } = priceRangeFor({
    format: showtime.format,
    matinee: showtime.matinee,
    weekend: isWeekend(showtime.date),
    seatClasses: seatClassesIn(showtime),
  });
  return min;
}

/** Does a screening satisfy the schedule-shaped parts of a filter? */
export function showtimeMatches(showtime: Showtime, filter: MovieFilter): boolean {
  if (filter.cinemaIds?.length && !filter.cinemaIds.includes(showtime.cinemaId)) return false;
  if (filter.formats?.length && !filter.formats.includes(showtime.format)) return false;
  if (filter.languages?.length && !filter.languages.includes(showtime.language)) return false;
  if (filter.accessibility?.length) {
    const has = filter.accessibility.every((a) => showtime.accessibility.includes(a));
    if (!has) return false;
  }
  const start = minutesFromTime(showtime.time);
  if (filter.after && start < minutesFromTime(filter.after)) return false;
  if (filter.before && start > minutesFromTime(filter.before)) return false;
  if (filter.maxPrice !== undefined && cheapestAdultSeatPrice(showtime) > filter.maxPrice) return false;
  return true;
}

/** Does a film satisfy the catalogue-shaped parts of a filter? */
export function movieMatches(movie: Movie, filter: MovieFilter): boolean {
  if (filter.status && filter.status !== 'all' && movie.status !== filter.status) return false;
  if (filter.query && !matchesText(movie, filter.query)) return false;
  if (filter.genres?.length && !filter.genres.some((g) => movie.genres.includes(g))) return false;
  if (filter.languages?.length && !filter.languages.includes(movie.language)) return false;
  if (filter.formats?.length && !filter.formats.some((f) => movie.formats.includes(f))) return false;
  if (filter.certificates?.length && !filter.certificates.includes(movie.certificate)) return false;
  if (filter.maxRuntime !== undefined && movie.runtimeMinutes > filter.maxRuntime) return false;
  return true;
}

/**
 * Films matching a filter. When the filter constrains anything about the
 * schedule, a film only survives if it actually has a screening that fits.
 */
export function filterMovies(filter: MovieFilter): Movie[] {
  const scheduleConstrained =
    Boolean(filter.date) ||
    Boolean(filter.cinemaIds?.length) ||
    Boolean(filter.accessibility?.length) ||
    Boolean(filter.after) ||
    Boolean(filter.before) ||
    filter.maxPrice !== undefined;

  const pool = movies.filter((m) => movieMatches(m, filter));
  if (!scheduleConstrained) return pool;

  const date = filter.date;
  return pool.filter((movie) => {
    if (movie.status === 'coming-soon') return false;
    const dates = date ? [date] : [];
    if (dates.length === 0) return true;
    return dates.some((d) =>
      showtimesForDate(d).some((s) => s.movieId === movie.id && showtimeMatches(s, filter)),
    );
  });
}

/** Screenings on a date matching a filter, optionally for one film. */
export function filterShowtimes(
  date: string,
  filter: MovieFilter,
  movieId?: string,
): Showtime[] {
  const source = filter.cinemaIds?.length
    ? filter.cinemaIds.flatMap((id) => showtimesForCinemaDate(id, date))
    : showtimesForDate(date);

  return source.filter((showtime) => {
    if (movieId && showtime.movieId !== movieId) return false;
    if (!showtimeMatches(showtime, filter)) return false;
    const movie = movieById.get(showtime.movieId);
    if (!movie) return false;
    // Genre, runtime, certificate and free-text apply to the film behind the screening.
    const filmOnly: MovieFilter = {
      ...(filter.query !== undefined ? { query: filter.query } : {}),
      ...(filter.genres !== undefined ? { genres: filter.genres } : {}),
      ...(filter.certificates !== undefined ? { certificates: filter.certificates } : {}),
      ...(filter.maxRuntime !== undefined ? { maxRuntime: filter.maxRuntime } : {}),
    };
    return movieMatches(movie, filmOnly);
  });
}

/** Screenings grouped by cinema, for the showtimes page and Max's results. */
export function groupShowtimesByCinema(showtimes: Showtime[]) {
  const map = new Map<string, Showtime[]>();
  for (const showtime of showtimes) {
    const list = map.get(showtime.cinemaId) ?? [];
    list.push(showtime);
    map.set(showtime.cinemaId, list);
  }
  return [...map.entries()]
    .map(([cinemaId, list]) => ({
      cinema: cinemaById.get(cinemaId)!,
      showtimes: list.sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((g) => Boolean(g.cinema))
    .sort((a, b) => a.cinema.name.localeCompare(b.cinema.name));
}

export function groupShowtimesByMovie(showtimes: Showtime[]) {
  const map = new Map<string, Showtime[]>();
  for (const showtime of showtimes) {
    const list = map.get(showtime.movieId) ?? [];
    list.push(showtime);
    map.set(showtime.movieId, list);
  }
  return [...map.entries()]
    .map(([movieId, list]) => ({
      movie: movieById.get(movieId)!,
      showtimes: list.sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((g) => Boolean(g.movie))
    .sort((a, b) => a.movie.title.localeCompare(b.movie.title));
}

export function groupShowtimesByTimeOfDay(showtimes: Showtime[]) {
  const bands = ['morning', 'afternoon', 'evening', 'late'] as const;
  return bands
    .map((band) => ({
      band,
      showtimes: showtimes
        .filter((s) => timeOfDay(s.time) === band)
        .sort((a, b) => a.time.localeCompare(b.time)),
    }))
    .filter((g) => g.showtimes.length > 0);
}

/* ════════════════════════════════════════════════════════════════════════
   CONVENIENCE SELECTORS
   ════════════════════════════════════════════════════════════════════════ */

export function getMovie(slugOrId: string): Movie | null {
  return movieBySlug.get(slugOrId) ?? movieById.get(slugOrId) ?? null;
}

export function getCinema(slugOrId: string) {
  return cinemaBySlug.get(slugOrId) ?? cinemaById.get(slugOrId) ?? null;
}

/** Which films are on at a cinema on a date. */
export function moviesAtCinema(cinemaId: string, date: string): Movie[] {
  const ids = new Set(showtimesForCinemaDate(cinemaId, date).map((s) => s.movieId));
  return [...ids].map((id) => movieById.get(id)).filter((m): m is Movie => Boolean(m));
}

/** Which cinemas are showing a film on a date. */
export function cinemasShowing(movieId: string, date: string) {
  return cinemas.filter((c) => showtimesForCinemaDate(c.id, date).some((s) => s.movieId === movieId));
}

/** The next screening of a film from now, searching forward across dates. */
export function nextScreening(
  movieId: string,
  dates: string[],
  cinemaId?: string,
  now: Date = new Date(),
): Showtime | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const date of dates) {
    const source = cinemaId ? showtimesForCinemaDate(cinemaId, date) : showtimesForDate(date);
    const candidates = source
      .filter((s) => s.movieId === movieId)
      .filter((s) => (date === todayIso ? minutesFromTime(s.time) > nowMinutes : true))
      .filter((s) => availabilityFor(s).level !== 'sold-out')
      .sort((a, b) => a.time.localeCompare(b.time));
    if (candidates[0]) return candidates[0];
  }
  return null;
}

export const languageLabels: Record<Language, string> = {
  bn: 'Bangla',
  en: 'English',
  hi: 'Hindi',
};

export const formatLabels: Record<Format, string> = {
  standard: '2D',
  'three-d': '3D',
  grandscreen: 'Grandscreen',
  velvet: 'Velvet Room',
};

export const formatBlurbs: Record<Format, string> = {
  standard: 'Our standard presentation: 2D, digital projection, 5.1 sound.',
  'three-d': 'Stereoscopic 3D. Glasses are handed out at the door and collected on the way out.',
  grandscreen: 'The largest screens in the circuit, with a wider frame and a 12-channel sound bed.',
  velvet: 'Reclining seats, table service before the feature, and a house that seats under eighty.',
};

export const genreLabels: Record<Genre, string> = {
  drama: 'Drama',
  thriller: 'Thriller',
  action: 'Action',
  comedy: 'Comedy',
  romance: 'Romance',
  'sci-fi': 'Sci-fi',
  documentary: 'Documentary',
  animation: 'Animation',
  family: 'Family',
  horror: 'Horror',
  musical: 'Musical',
  historical: 'Historical',
};

export const accessibilityLabels: Record<ScreeningAccessibility, string> = {
  'open-captions': 'Open captions',
  'closed-captions': 'Closed captions',
  'audio-description': 'Audio description',
  'wheelchair-spaces': 'Wheelchair spaces',
  'hearing-loop': 'Hearing loop',
  'sensory-friendly': 'Sensory friendly',
};

export const accessibilityBlurbs: Record<ScreeningAccessibility, string> = {
  'open-captions': 'Captions are part of the picture. Everyone in the house sees them; no equipment needed.',
  'closed-captions': 'Captions on a personal device collected from the box office. Only you see them.',
  'audio-description': 'A described soundtrack through a headset collected from the box office.',
  'wheelchair-spaces': 'Wheelchair spaces with companion seats immediately alongside.',
  'hearing-loop': 'An induction loop covering the whole house, for hearing aids set to T.',
  'sensory-friendly': 'House lights partly up, sound reduced, no trailers, and freedom to move about.',
};

export {
  allGenres,
  availabilityFor,
  cinemaFor,
  cinemas,
  cities,
  comingSoon,
  movieFor,
  movies,
  nowShowing,
  screenFor,
  screenById,
  seatClassesIn,
  showtimesForCinemaDate,
  showtimesForDate,
  isMatinee,
};
