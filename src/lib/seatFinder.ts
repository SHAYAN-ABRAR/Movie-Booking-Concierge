import { seatMapFor, screenFor } from '@/data/schedule';
import { isWeekend, seatPrice } from '@/data/pricing';
import type { Seat, SeatClass, SeatRow, Showtime } from '@/data/types';

/**
 * Seat recommendation.
 *
 * Pure and deterministic: the same screening and preferences always produce
 * the same suggestion. Max proposes what this returns — it never applies it
 * without the customer confirming.
 */

export interface SeatPreferences {
  partySize: number;
  position?: 'front' | 'middle' | 'back' | 'centre' | 'aisle';
  wheelchairSpaces?: number;
  companionSeats?: number;
  /** Prefer seats close to the entrance, with the least walking. */
  reducedWalking?: boolean;
  /** Prefer premium or recliner seating. */
  premium?: boolean;
  /** Maximum total seat cost, before category discounts and the booking fee. */
  budget?: number;
}

export interface SeatSuggestion {
  seatIds: string[];
  /** Total seat price before category discounts and the booking fee. */
  total: number;
  /** True when the party could not be seated in one run. */
  split: boolean;
  /** One contiguous run per entry, for explaining a split. */
  groups: Array<{ row: string; seatIds: string[] }>;
  /** Plain-language justification, shown to the customer verbatim. */
  reasons: string[];
}

export interface SeatSearchResult {
  suggestion: SeatSuggestion | null;
  /** Why nothing could be found, when that is the case. */
  problem: string | null;
}

/** Contiguous runs of available seats within one row, aisles breaking a run. */
function runsIn(row: SeatRow, predicate: (seat: Seat) => boolean): Seat[][] {
  const runs: Seat[][] = [];
  let current: Seat[] = [];
  for (const seat of row.seats) {
    if (predicate(seat)) {
      current.push(seat);
      // An aisle to the right ends the physical run of adjacent seats.
      if (seat.aisleRight) {
        if (current.length) runs.push(current);
        current = [];
      }
    } else {
      if (current.length) runs.push(current);
      current = [];
    }
  }
  if (current.length) runs.push(current);
  return runs;
}

function generalSeat(seat: Seat): boolean {
  return (
    seat.status === 'available' && seat.seatClass !== 'wheelchair' && seat.seatClass !== 'companion'
  );
}

export function findSeats(showtime: Showtime, preferences: SeatPreferences): SeatSearchResult {
  const rows = seatMapFor(showtime);
  const screen = screenFor(showtime);
  if (!screen || rows.length === 0) {
    return { suggestion: null, problem: 'That screening has no seat map in this build.' };
  }

  const weekend = isWeekend(showtime.date);
  const price = (seatClass: SeatClass) =>
    seatPrice({ seatClass, format: showtime.format, matinee: showtime.matinee, weekend });

  const reasons: string[] = [];
  const seatIds: string[] = [];
  const groups: SeatSuggestion['groups'] = [];

  /* ── Accessible seating first, because it is the constraint ────────── */

  const wheelchairWanted = preferences.wheelchairSpaces ?? 0;
  const companionWanted = preferences.companionSeats ?? 0;

  if (wheelchairWanted > 0) {
    const spaces = rows
      .flatMap((row) => row.seats)
      .filter((seat) => seat.seatClass === 'wheelchair' && seat.status === 'available');

    if (spaces.length < wheelchairWanted) {
      return {
        suggestion: null,
        problem:
          spaces.length === 0
            ? 'Every wheelchair space at this screening is taken in the sample data. Another screening, or the house directly, would be the next step.'
            : `Only ${spaces.length} wheelchair space${spaces.length === 1 ? ' is' : 's are'} free at this screening, and you asked for ${wheelchairWanted}.`,
      };
    }

    const chosen = spaces.slice(0, wheelchairWanted);
    seatIds.push(...chosen.map((s) => s.id));
    groups.push({ row: chosen[0]!.row, seatIds: chosen.map((s) => s.id) });
    reasons.push(
      `${wheelchairWanted} wheelchair space${wheelchairWanted === 1 ? '' : 's'} in row ${chosen[0]!.row}, which is level with the entrance and beside an aisle.`,
    );

    if (companionWanted > 0) {
      const companions = rows
        .flatMap((row) => row.seats)
        .filter(
          (seat) =>
            seat.seatClass === 'companion' &&
            seat.status === 'available' &&
            seat.row === chosen[0]!.row,
        )
        .slice(0, companionWanted);

      if (companions.length < companionWanted) {
        reasons.push(
          `Only ${companions.length} companion seat${companions.length === 1 ? '' : 's'} remain beside that space — the rest of your party would sit nearby rather than adjacent.`,
        );
      }
      seatIds.push(...companions.map((s) => s.id));
      if (companions.length) {
        reasons.push(
          `${companions.length} companion seat${companions.length === 1 ? '' : 's'} immediately alongside.`,
        );
      }
    }
  }

  /* ── General seating for whoever is left ───────────────────────────── */

  const remaining = Math.max(0, preferences.partySize - seatIds.length);

  if (remaining > 0) {
    // Score every candidate run, then take the best.
    interface Candidate {
      run: Seat[];
      row: SeatRow;
      score: number;
      cost: number;
    }
    const candidates: Candidate[] = [];

    for (const row of rows) {
      const rowIndex = rows.indexOf(row);
      const rowFraction = rows.length === 1 ? 0.5 : rowIndex / (rows.length - 1);

      for (const run of runsIn(row, generalSeat)) {
        if (run.length < remaining) continue;

        // Slide a window of the needed size along the run.
        for (let offset = 0; offset + remaining <= run.length; offset += 1) {
          const window = run.slice(offset, offset + remaining);
          const cost = window.reduce((sum, seat) => sum + price(seat.seatClass), 0);
          if (preferences.budget !== undefined && cost > preferences.budget) continue;

          const seatsPerRow = screen.layout.seatsPerRow;
          const centre = (seatsPerRow + 1) / 2;
          const windowCentre =
            window.reduce((sum, seat) => sum + seat.number, 0) / window.length;
          const centrality = 1 - Math.abs(windowCentre - centre) / centre;
          const touchesAisle = window.some((seat) => seat.aisleLeft || seat.aisleRight);
          const isPremium = window.every(
            (seat) => seat.seatClass === 'premium' || seat.seatClass === 'recliner',
          );

          let score = 0;

          // House position preference.
          switch (preferences.position) {
            case 'front':
              score += (1 - rowFraction) * 3;
              break;
            case 'back':
              score += rowFraction * 3;
              break;
            case 'middle':
              score += (1 - Math.abs(rowFraction - 0.55) * 2) * 3;
              break;
            case 'centre':
              score += centrality * 3.5;
              break;
            case 'aisle':
              score += touchesAisle ? 3.5 : 0;
              break;
            default:
              // With no stated preference, aim just behind the middle and central.
              score += (1 - Math.abs(rowFraction - 0.6) * 1.6) * 1.6 + centrality * 1.6;
          }

          if (preferences.reducedWalking) {
            // Rows nearest the entrance at the back, and nearest an aisle.
            score += rowFraction * 2 + (touchesAisle ? 1.5 : 0);
          }
          if (preferences.premium) score += isPremium ? 3 : -1;
          if (preferences.budget !== undefined) score += (1 - cost / preferences.budget) * 2;

          // Prefer keeping the party in one run and not stranding single seats.
          const gapLeft = offset;
          const gapRight = run.length - (offset + remaining);
          if (gapLeft === 1 || gapRight === 1) score -= 0.6;

          candidates.push({ run: window, row, score, cost });
        }
      }
    }

    if (candidates.length === 0) {
      // Fall back to a split across the best available runs.
      const pool = rows
        .flatMap((row) => runsIn(row, generalSeat).map((run) => ({ row, run })))
        .filter((entry) => entry.run.length > 0)
        .sort((a, b) => b.run.length - a.run.length);

      const totalFree = pool.reduce((sum, entry) => sum + entry.run.length, 0);
      if (totalFree < remaining) {
        return {
          suggestion: null,
          problem:
            totalFree === 0
              ? 'That screening is sold out in the sample data.'
              : `Only ${totalFree} seat${totalFree === 1 ? '' : 's'} remain at that screening, and you need ${remaining}.`,
        };
      }

      if (preferences.budget !== undefined) {
        return {
          suggestion: null,
          problem: `No run of ${remaining} seats together comes in under ৳${preferences.budget} at this screening. Raising the budget or trying a before-three screening usually finds one.`,
        };
      }

      let left = remaining;
      for (const entry of pool) {
        if (left === 0) break;
        const take = entry.run.slice(0, Math.min(left, entry.run.length));
        seatIds.push(...take.map((s) => s.id));
        groups.push({ row: entry.row.row, seatIds: take.map((s) => s.id) });
        left -= take.length;
      }

      reasons.push(
        `There is no run of ${remaining} seats together left at this screening, so this splits your party across ${groups.length} rows. The closest alternative is a different screening.`,
      );
    } else {
      candidates.sort((a, b) => b.score - a.score || a.cost - b.cost);
      const best = candidates[0]!;
      seatIds.push(...best.run.map((s) => s.id));
      groups.push({ row: best.row.row, seatIds: best.run.map((s) => s.id) });

      const band =
        best.row.band === 'front'
          ? 'toward the front'
          : best.row.band === 'back'
            ? 'toward the back'
            : 'in the middle of the house';
      const aisle = best.run.some((s) => s.aisleLeft || s.aisleRight);

      reasons.push(
        `${best.run.length} seat${best.run.length === 1 ? '' : 's'} together in row ${best.row.row}, ${band}.`,
      );
      if (preferences.position === 'aisle' || aisle) {
        reasons.push(aisle ? 'The run touches an aisle.' : 'No aisle seat was free in a run this size.');
      }
      if (preferences.premium) {
        const allPremium = best.run.every(
          (s) => s.seatClass === 'premium' || s.seatClass === 'recliner',
        );
        reasons.push(
          allPremium
            ? 'All premium or recliner seating.'
            : 'No premium run of this size was free, so this is the best standard block.',
        );
      }
      if (preferences.budget !== undefined) {
        reasons.push(`Seat cost ৳${best.cost}, inside your ৳${preferences.budget} budget.`);
      }
    }
  }

  const total = seatIds.reduce((sum, id) => {
    for (const row of rows) {
      const seat = row.seats.find((s) => s.id === id);
      if (seat) return sum + price(seat.seatClass);
    }
    return sum;
  }, 0);

  return {
    suggestion: {
      seatIds,
      total,
      split: groups.length > 1,
      groups,
      reasons,
    },
    problem: null,
  };
}

/** How many seats are still free, by class — used in Max's explanations. */
export function seatAvailabilityByClass(showtime: Showtime): Record<SeatClass, number> {
  const counts: Record<SeatClass, number> = {
    regular: 0,
    premium: 0,
    recliner: 0,
    wheelchair: 0,
    companion: 0,
  };
  for (const row of seatMapFor(showtime)) {
    for (const seat of row.seats) {
      if (seat.status === 'available') counts[seat.seatClass] += 1;
    }
  }
  return counts;
}

/** The largest number of seats still available together in a single run. */
export function largestContiguousRun(showtime: Showtime): number {
  let best = 0;
  for (const row of seatMapFor(showtime)) {
    for (const run of runsIn(row, generalSeat)) {
      best = Math.max(best, run.length);
    }
  }
  return best;
}
