import { cinemaById, cinemas, screenById } from './cinemas';
import { movieById, nowShowing } from './movies';
import { isMatinee, isWeekend } from './pricing';
import type {
  Cinema,
  Movie,
  Screen,
  ScreeningAccessibility,
  Seat,
  SeatClass,
  SeatRow,
  SeatStatus,
  Showtime,
} from './types';
import { rngFor, seededInt, seededShuffle } from '../lib/deterministic';
import { fromIsoDate, minutesFromTime, timeFromMinutes } from '../lib/datetime';

/**
 * The schedule engine.
 *
 * Everything here is a pure function of (cinema, screen, date, film). The same
 * inputs always produce the same screenings and the same sold seats — across
 * reloads, tabs and days. There is no live inventory and nothing is fetched.
 */

interface ScheduleConfig {
  firstShow: number;
  lastShow: number;
  filmsPerScreen: number;
}

const scheduleConfig: Record<string, ScheduleConfig> = {
  'cin-dhanmondi': { firstShow: 11 * 60, lastShow: 23 * 60 + 15, filmsPerScreen: 2 },
  'cin-bashundhara': { firstShow: 10 * 60 + 30, lastShow: 23 * 60 + 45, filmsPerScreen: 2 },
  'cin-uttara': { firstShow: 11 * 60 + 15, lastShow: 22 * 60 + 45, filmsPerScreen: 2 },
  'cin-agrabad': { firstShow: 11 * 60 + 30, lastShow: 22 * 60 + 45, filmsPerScreen: 2 },
  'cin-zindabazar': { firstShow: 12 * 60, lastShow: 22 * 60 + 30, filmsPerScreen: 2 },
};

const TURNAROUND_MINUTES = 20;

export function buildShowtimeId(screenId: string, date: string, time: string): string {
  return `${screenId}.${date}.${time.replace(':', '')}`;
}

export function parseShowtimeId(
  id: string,
): { screenId: string; date: string; time: string } | null {
  const parts = id.split('.');
  if (parts.length !== 3) return null;
  const [screenId, date, hhmm] = parts as [string, string, string];
  if (!/^\d{4}$/.test(hhmm) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { screenId, date, time: `${hhmm.slice(0, 2)}:${hhmm.slice(2)}` };
}

function isFirstSaturday(iso: string): boolean {
  const d = fromIsoDate(iso);
  return d.getDay() === 6 && d.getDate() <= 7;
}

function screeningAccessibility(
  screen: Screen,
  movie: Movie,
  showtimeId: string,
  date: string,
  startMinutes: number,
): ScreeningAccessibility[] {
  const out: ScreeningAccessibility[] = [];

  // Structural — a property of the room, present at every screening in it.
  for (const feature of ['closed-captions', 'hearing-loop', 'wheelchair-spaces'] as const) {
    if (screen.accessibility.includes(feature)) out.push(feature);
  }

  // Open captions are burned into the print, so they are a scheduling choice
  // rather than a room capability. They are never the same thing as closed
  // captions, and the two are never used interchangeably.
  const saturdayMatinee = fromIsoDate(date).getDay() === 6 && startMinutes < 15 * 60;
  if (movie.slug === 'paper-lantern' && saturdayMatinee) {
    out.push('open-captions');
  } else if (rngFor(`${showtimeId}|open-captions`)() < 0.24) {
    out.push('open-captions');
  }

  // Audio description needs the room's transmitters and a prepared track.
  if (screen.accessibility.includes('audio-description') && rngFor(`${showtimeId}|ad`)() < 0.45) {
    out.push('audio-description');
  }

  // The published sensory-friendly strand: first Saturday of the month, matinee.
  if (
    screen.accessibility.includes('sensory-friendly') &&
    isFirstSaturday(date) &&
    startMinutes < 15 * 60
  ) {
    out.push('sensory-friendly');
  }

  return out;
}

function buildShowtime(
  cinema: Cinema,
  screen: Screen,
  movie: Movie,
  date: string,
  startMinutes: number,
): Showtime {
  const time = timeFromMinutes(startMinutes);
  const id = buildShowtimeId(screen.id, date, time);
  return {
    id,
    movieId: movie.id,
    cinemaId: cinema.id,
    screenId: screen.id,
    date,
    time,
    format: screen.format,
    language: movie.language,
    subtitles: movie.subtitles,
    accessibility: screeningAccessibility(screen, movie, id, date, startMinutes),
    matinee: isMatinee(time),
  };
}

const dayCache = new Map<string, Showtime[]>();

/** Every screening at one cinema on one date. Memoised; pure. */
export function showtimesForCinemaDate(cinemaId: string, date: string): Showtime[] {
  const key = `${cinemaId}|${date}`;
  const cached = dayCache.get(key);
  if (cached) return cached;

  const cinema = cinemaById.get(cinemaId);
  const config = scheduleConfig[cinemaId];
  if (!cinema || !config) {
    dayCache.set(key, []);
    return [];
  }

  const out: Showtime[] = [];
  // A single daily rotation per venue, so films spread across the screens
  // instead of every room independently picking the same crowd-pleaser.
  const rotation = seededShuffle(nowShowing, rngFor(`${cinemaId}|${date}|rotation`));
  let cursor = 0;

  for (const screen of cinema.screens) {
    const picked: Movie[] = [];
    let guard = 0;
    while (picked.length < config.filmsPerScreen && guard < rotation.length * 2) {
      const candidate = rotation[cursor % rotation.length]!;
      cursor += 1;
      guard += 1;
      if (candidate.formats.includes(screen.format) && !picked.includes(candidate)) {
        picked.push(candidate);
      }
    }
    if (picked.length === 0) continue;

    let minute = config.firstShow + seededInt(`${screen.id}|${date}|offset`, 0, 4) * 5;
    let slot = 0;
    while (minute <= config.lastShow) {
      const movie = picked[slot % picked.length]!;
      out.push(buildShowtime(cinema, screen, movie, date, minute));
      const block =
        cinema.trailerMinutes +
        movie.runtimeMinutes +
        (movie.intermissionMinutes ?? 0) +
        TURNAROUND_MINUTES;
      minute += Math.ceil(block / 5) * 5;
      slot += 1;
    }
  }

  // The published late repertory strand: Dhanmondi, Thursdays at 22:45.
  if (cinemaId === 'cin-dhanmondi' && fromIsoDate(date).getDay() === 4) {
    const screen = cinema.screens.find((s) => s.id === 'scr-dh-2');
    const pool = nowShowing.filter((m) => m.formats.includes('standard'));
    const pick = seededShuffle(pool, rngFor(`${date}|repertory`))[0];
    if (screen && pick) {
      const late = buildShowtime(cinema, screen, pick, date, 22 * 60 + 45);
      if (!out.some((s) => s.id === late.id)) out.push(late);
    }
  }

  out.sort((a, b) => (a.time === b.time ? a.screenId.localeCompare(b.screenId) : a.time.localeCompare(b.time)));
  dayCache.set(key, out);
  return out;
}

/** Every screening across the circuit on one date. */
export function showtimesForDate(date: string): Showtime[] {
  return cinemas.flatMap((c) => showtimesForCinemaDate(c.id, date));
}

export function showtimesForMovieDate(movieId: string, date: string, cinemaId?: string): Showtime[] {
  const source = cinemaId ? showtimesForCinemaDate(cinemaId, date) : showtimesForDate(date);
  return source.filter((s) => s.movieId === movieId);
}

/** Resolves a showtime from its id without needing to know the cinema. */
export function getShowtime(id: string): Showtime | null {
  const parsed = parseShowtimeId(id);
  if (!parsed) return null;
  const entry = screenById.get(parsed.screenId);
  if (!entry) return null;
  return showtimesForCinemaDate(entry.cinema.id, parsed.date).find((s) => s.id === id) ?? null;
}

/* ════════════════════════════════════════════════════════════════════════
   SEAT MAPS
   ════════════════════════════════════════════════════════════════════════ */

function seatClassFor(screen: Screen, row: string, seatId: string): SeatClass {
  const { layout } = screen;
  if (layout.wheelchairSpaces.includes(seatId)) return 'wheelchair';
  if (layout.companionSeats.includes(seatId)) return 'companion';
  if (layout.reclinerRows.includes(row)) return 'recliner';
  if (layout.premiumRows.includes(row)) return 'premium';
  return 'regular';
}

/**
 * Expected occupancy for a screening, in 0..1. Drives both the seat map and
 * the availability badge, so the two can never disagree.
 */
function occupancyRate(showtime: Showtime): number {
  const hour = Math.floor(minutesFromTime(showtime.time) / 60);
  const base = hour < 12 ? 0.16 : hour < 17 ? 0.3 : hour < 21 ? 0.56 : 0.34;
  const weekend = isWeekend(showtime.date) ? 0.16 : 0;

  // Some films simply sell better. Stable per film, not per screening.
  const appetite = 0.82 + rngFor(`${showtime.movieId}|appetite`)() * 0.42;

  // Screenings further out are emptier — people have not booked them yet.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAhead = Math.max(
    0,
    Math.round((fromIsoDate(showtime.date).getTime() - today.getTime()) / 86_400_000),
  );
  const proximity = Math.max(0.5, 1 - daysAhead * 0.055);

  // A little screening-level variance so two 8pm shows are not identical.
  const jitter = 0.88 + rngFor(`${showtime.id}|jitter`)() * 0.26;

  return Math.min(0.985, Math.max(0.03, (base + weekend) * appetite * proximity * jitter));
}

const seatMapCache = new Map<string, SeatRow[]>();

/** The seat map for a screening. Deterministic, memoised, never re-rolled. */
export function seatMapFor(showtime: Showtime): SeatRow[] {
  const cached = seatMapCache.get(showtime.id);
  if (cached) return cached;

  const entry = screenById.get(showtime.screenId);
  if (!entry) return [];
  const { screen } = entry;
  const { layout } = screen;
  const rate = occupancyRate(showtime);
  const rowCount = layout.rows.length;

  const rows: SeatRow[] = layout.rows.map((row, rowIndex) => {
    const rowFraction = rowCount === 1 ? 0.5 : rowIndex / (rowCount - 1);
    // Demand peaks a little behind the middle of the house.
    const rowPreference = 1 - 0.62 * Math.abs(rowFraction - 0.64);
    const band: SeatRow['band'] =
      rowFraction < 0.34 ? 'front' : rowFraction < 0.68 ? 'middle' : 'back';

    const seats: Seat[] = [];
    let column = 0;
    for (let n = 1; n <= layout.seatsPerRow; n += 1) {
      const seatId = `${row}${n}`;
      column += 1;

      const aisleRight = layout.aislesAfter.includes(n);
      const aisleLeft = layout.aislesAfter.includes(n - 1);
      const seatClass = seatClassFor(screen, row, seatId);

      let status: SeatStatus;
      if (layout.missing?.includes(seatId)) {
        status = 'unavailable';
      } else {
        const centre = (layout.seatsPerRow + 1) / 2;
        const edgeness = Math.abs(n - centre) / centre;
        const centrality = 1 - edgeness;
        const weight = (0.62 + 0.76 * centrality) * (0.68 + 0.62 * rowPreference);

        // Accessible spaces are held back far longer than general seating.
        const accessFactor = seatClass === 'wheelchair' || seatClass === 'companion' ? 0.28 : 1;
        const probability = Math.min(0.99, rate * weight * accessFactor);
        const roll = rngFor(`${showtime.id}|${seatId}`)();

        if (roll < probability) {
          status = 'sold';
        } else if (roll < probability + 0.035) {
          // A thin band of seats another guest is mid-checkout on.
          status = 'held';
        } else {
          status = 'available';
        }
      }

      seats.push({ id: seatId, row, number: n, seatClass, status, column, aisleRight, aisleLeft });
      if (aisleRight) column += 1;
    }

    return { row, seats, band };
  });

  seatMapCache.set(showtime.id, rows);
  return rows;
}

export type AvailabilityLevel = 'available' | 'filling-fast' | 'almost-full' | 'sold-out';

export interface Availability {
  total: number;
  available: number;
  sold: number;
  ratio: number;
  level: AvailabilityLevel;
}

const availabilityCache = new Map<string, Availability>();

export function availabilityFor(showtime: Showtime): Availability {
  const cached = availabilityCache.get(showtime.id);
  if (cached) return cached;

  const rows = seatMapFor(showtime);
  let total = 0;
  let available = 0;
  for (const row of rows) {
    for (const seat of row.seats) {
      if (seat.status === 'unavailable') continue;
      total += 1;
      if (seat.status === 'available') available += 1;
    }
  }

  const sold = total - available;
  const ratio = total === 0 ? 1 : sold / total;
  const level: AvailabilityLevel =
    available === 0 ? 'sold-out' : ratio > 0.9 ? 'almost-full' : ratio > 0.72 ? 'filling-fast' : 'available';

  const result = { total, available, sold, ratio, level };
  availabilityCache.set(showtime.id, result);
  return result;
}

/** Seat classes actually present in a screening's room — used for price ranges. */
export function seatClassesIn(showtime: Showtime): SeatClass[] {
  const entry = screenById.get(showtime.screenId);
  if (!entry) return ['regular'];
  const { layout } = entry.screen;
  const classes = new Set<SeatClass>(['regular']);
  if (layout.premiumRows.length) classes.add('premium');
  if (layout.reclinerRows.length) classes.add('recliner');
  return [...classes];
}

export function screenFor(showtime: Showtime): Screen | null {
  return screenById.get(showtime.screenId)?.screen ?? null;
}

export function movieFor(showtime: Showtime): Movie | null {
  return movieById.get(showtime.movieId) ?? null;
}

export function cinemaFor(showtime: Showtime): Cinema | null {
  return cinemaById.get(showtime.cinemaId) ?? null;
}

/** The screening's end time, including trailers and any listed interval. */
export function screeningEndMinutes(showtime: Showtime): number {
  const movie = movieFor(showtime);
  const cinema = cinemaFor(showtime);
  if (!movie || !cinema) return minutesFromTime(showtime.time);
  return (
    minutesFromTime(showtime.time) +
    cinema.trailerMinutes +
    movie.runtimeMinutes +
    (movie.intermissionMinutes ?? 0)
  );
}

/** Clears memoised schedule data. Only used by tests. */
export function __resetScheduleCaches(): void {
  dayCache.clear();
  seatMapCache.clear();
  availabilityCache.clear();
}
