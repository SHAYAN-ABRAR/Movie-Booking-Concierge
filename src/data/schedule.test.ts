import { describe, expect, it, beforeEach } from 'vitest';
import {
  __resetScheduleCaches,
  availabilityFor,
  buildShowtimeId,
  getShowtime,
  parseShowtimeId,
  seatMapFor,
  showtimesForCinemaDate,
  showtimesForDate,
} from './schedule';
import { cinemas } from './cinemas';
import { nowShowing, comingSoon } from './movies';
import { dateWindow } from '../lib/datetime';

const today = dateWindow(1)[0]!;

describe('schedule determinism', () => {
  beforeEach(() => __resetScheduleCaches());

  it('produces the same screenings for the same cinema and date', () => {
    const first = showtimesForCinemaDate('cin-dhanmondi', today).map((s) => s.id);
    __resetScheduleCaches();
    const second = showtimesForCinemaDate('cin-dhanmondi', today).map((s) => s.id);
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
  });

  it('produces the same sold seats for a screening across cache resets', () => {
    const showtime = showtimesForCinemaDate('cin-bashundhara', today)[0]!;
    const first = seatMapFor(showtime).flatMap((row) => row.seats.map((s) => `${s.id}:${s.status}`));
    __resetScheduleCaches();
    const again = getShowtime(showtime.id)!;
    const second = seatMapFor(again).flatMap((row) => row.seats.map((s) => `${s.id}:${s.status}`));
    expect(second).toEqual(first);
  });

  it('never schedules a film that has not opened yet', () => {
    const scheduled = new Set(showtimesForDate(today).map((s) => s.movieId));
    for (const movie of comingSoon) {
      expect(scheduled.has(movie.id)).toBe(false);
    }
  });

  it('only schedules films in a screen that supports their format', () => {
    for (const cinema of cinemas) {
      for (const showtime of showtimesForCinemaDate(cinema.id, today)) {
        const movie = nowShowing.find((m) => m.id === showtime.movieId)!;
        expect(movie.formats).toContain(showtime.format);
      }
    }
  });

  it('round-trips a showtime id', () => {
    const id = buildShowtimeId('scr-dh-1', '2026-08-02', '20:45');
    expect(parseShowtimeId(id)).toEqual({
      screenId: 'scr-dh-1',
      date: '2026-08-02',
      time: '20:45',
    });
  });

  it('rejects a malformed showtime id rather than guessing', () => {
    expect(parseShowtimeId('nonsense')).toBeNull();
    expect(parseShowtimeId('scr-dh-1.notadate.2045')).toBeNull();
  });

  it('agrees between the availability badge and the seat map', () => {
    const showtime = showtimesForCinemaDate('cin-uttara', today)[0]!;
    const availability = availabilityFor(showtime);
    const seats = seatMapFor(showtime).flatMap((row) => row.seats);
    const bookable = seats.filter((s) => s.status !== 'unavailable');
    const free = seats.filter((s) => s.status === 'available');

    expect(availability.total).toBe(bookable.length);
    expect(availability.available).toBe(free.length);
    if (availability.available === 0) expect(availability.level).toBe('sold-out');
  });

  it('marks a screening sold out only when nothing is bookable', () => {
    for (const date of dateWindow(3)) {
      for (const showtime of showtimesForDate(date)) {
        const availability = availabilityFor(showtime);
        if (availability.level === 'sold-out') expect(availability.available).toBe(0);
        else expect(availability.available).toBeGreaterThan(0);
      }
    }
  });

  it('keeps wheelchair spaces and companion seats in every house', () => {
    for (const cinema of cinemas) {
      for (const screen of cinema.screens) {
        expect(screen.layout.wheelchairSpaces.length).toBeGreaterThan(0);
        expect(screen.layout.companionSeats.length).toBeGreaterThan(0);
      }
    }
  });

  it('never lists open captions and closed captions as the same marker', () => {
    const all = dateWindow(4).flatMap((date) => showtimesForDate(date));
    const openOnly = all.filter(
      (s) => s.accessibility.includes('open-captions') && !s.accessibility.includes('closed-captions'),
    );
    // The two provisions must be able to occur independently.
    expect(openOnly.length).toBeGreaterThan(0);
  });
});
