import { describe, expect, it } from 'vitest';
import { findSeats, largestContiguousRun, seatAvailabilityByClass } from './seatFinder';
import { seatMapFor, showtimesForDate } from '@/data/schedule';
import { dateWindow } from './datetime';
import type { Showtime } from '@/data/types';

const today = dateWindow(1)[0]!;
const all = showtimesForDate(today);

/** A screening with plenty of room, so the search has something to work with. */
const roomy: Showtime = [...all].sort(
  (a, b) =>
    seatMapFor(b).flatMap((r) => r.seats).filter((s) => s.status === 'available').length -
    seatMapFor(a).flatMap((r) => r.seats).filter((s) => s.status === 'available').length,
)[0]!;

function statusOf(showtime: Showtime, seatId: string) {
  for (const row of seatMapFor(showtime)) {
    const seat = row.seats.find((s) => s.id === seatId);
    if (seat) return seat;
  }
  return null;
}

describe('finding seats', () => {
  it('only ever returns seats that are actually available', () => {
    const { suggestion } = findSeats(roomy, { partySize: 3 });
    expect(suggestion).not.toBeNull();
    for (const seatId of suggestion!.seatIds) {
      expect(statusOf(roomy, seatId)?.status).toBe('available');
    }
  });

  it('returns exactly the number of seats asked for', () => {
    for (const size of [1, 2, 4]) {
      const { suggestion } = findSeats(roomy, { partySize: size });
      expect(suggestion?.seatIds).toHaveLength(size);
    }
  });

  it('is deterministic for the same screening and preferences', () => {
    const first = findSeats(roomy, { partySize: 3, position: 'centre' }).suggestion?.seatIds;
    const second = findSeats(roomy, { partySize: 3, position: 'centre' }).suggestion?.seatIds;
    expect(second).toEqual(first);
  });

  it('keeps a party in one row when it can', () => {
    const { suggestion } = findSeats(roomy, { partySize: 3 });
    expect(suggestion?.split).toBe(false);
    expect(suggestion?.groups).toHaveLength(1);
    const rows = new Set(suggestion!.seatIds.map((id) => id.replace(/\d+$/, '')));
    expect(rows.size).toBe(1);
  });

  it('honours an aisle preference when an aisle seat is free', () => {
    const { suggestion } = findSeats(roomy, { partySize: 2, position: 'aisle' });
    expect(suggestion).not.toBeNull();
    const touchesAisle = suggestion!.seatIds.some((id) => {
      const seat = statusOf(roomy, id);
      return seat?.aisleLeft || seat?.aisleRight;
    });
    expect(touchesAisle).toBe(true);
  });

  it('returns wheelchair spaces with companion seats beside them', () => {
    const withSpaces = all.find((showtime) =>
      seatMapFor(showtime)
        .flatMap((row) => row.seats)
        .some((seat) => seat.seatClass === 'wheelchair' && seat.status === 'available'),
    );
    expect(withSpaces).toBeDefined();

    const { suggestion } = findSeats(withSpaces!, {
      partySize: 2,
      wheelchairSpaces: 1,
      companionSeats: 1,
    });

    expect(suggestion).not.toBeNull();
    const classes = suggestion!.seatIds.map((id) => statusOf(withSpaces!, id)?.seatClass);
    expect(classes).toContain('wheelchair');
    expect(classes).toContain('companion');
  });

  it('explains itself in plain language', () => {
    const { suggestion } = findSeats(roomy, { partySize: 2, position: 'back' });
    expect(suggestion!.reasons.length).toBeGreaterThan(0);
    expect(suggestion!.reasons.join(' ')).toMatch(/row/i);
  });

  it('refuses rather than inventing seats when the party is too large', () => {
    const result = findSeats(roomy, { partySize: 500 });
    expect(result.suggestion).toBeNull();
    expect(result.problem).toBeTruthy();
  });

  it('says so when a budget cannot be met, instead of overshooting it', () => {
    const result = findSeats(roomy, { partySize: 2, budget: 10 });
    expect(result.suggestion).toBeNull();
    expect(result.problem).toMatch(/budget|৳/i);
  });

  it('never exceeds a budget it does satisfy', () => {
    const result = findSeats(roomy, { partySize: 2, budget: 2000 });
    if (result.suggestion) expect(result.suggestion.total).toBeLessThanOrEqual(2000);
  });

  it('reports the largest run and the class breakdown consistently', () => {
    const largest = largestContiguousRun(roomy);
    const byClass = seatAvailabilityByClass(roomy);
    const totalFree = Object.values(byClass).reduce((sum, count) => sum + count, 0);
    expect(largest).toBeLessThanOrEqual(totalFree);
    expect(largest).toBeGreaterThan(0);
  });
});
