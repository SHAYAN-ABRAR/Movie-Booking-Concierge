import {
  BOOKING_FEE_PER_TICKET,
  isWeekend,
  seatPrice,
  ticketCategoryById,
  ticketPrice,
} from '@/data/pricing';
import { concessionById } from '@/data/concessions';
import { insurancePolicy } from '@/data/policies';
import { movieFor, screenFor, seatMapFor } from '@/data/schedule';
import { certificates } from '@/data/pricing';
import type { SeatClass, Showtime, TicketCategory } from '@/data/types';

/**
 * Booking arithmetic.
 *
 * Every total in the interface — the sticky summary, the review page, the
 * confirmation, and every figure Max quotes — comes through these functions.
 * There is no second implementation for the assistant to drift away from.
 */

export interface TicketCounts {
  child: number;
  student: number;
  adult: number;
  senior: number;
}

export const emptyTicketCounts: TicketCounts = { child: 0, student: 0, adult: 0, senior: 0 };

export function totalTickets(counts: TicketCounts): number {
  return counts.child + counts.student + counts.adult + counts.senior;
}

export interface SeatLine {
  seatId: string;
  seatClass: SeatClass;
  category: TicketCategory;
  /** Price before the category multiplier. */
  seatPrice: number;
  /** Price after the category multiplier. */
  price: number;
  /** Saving from the category multiplier, if any. */
  categoryDiscount: number;
}

export interface ConcessionLine {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  seatLines: SeatLine[];
  concessionLines: ConcessionLine[];
  ticketSubtotal: number;
  /** Total saved by child / student / senior categories. */
  categorySavings: number;
  /** Saving from the before-three matinee rule. */
  matineeSavings: number;
  concessionSubtotal: number;
  concessionSavings: number;
  bookingFee: number;
  insuranceFee: number;
  total: number;
  seatCount: number;
}

export const emptyQuote: Quote = {
  seatLines: [],
  concessionLines: [],
  ticketSubtotal: 0,
  categorySavings: 0,
  matineeSavings: 0,
  concessionSubtotal: 0,
  concessionSavings: 0,
  bookingFee: 0,
  insuranceFee: 0,
  total: 0,
  seatCount: 0,
};

export function seatClassOf(showtime: Showtime, seatId: string): SeatClass {
  for (const row of seatMapFor(showtime)) {
    for (const seat of row.seats) {
      if (seat.id === seatId) return seat.seatClass;
    }
  }
  return 'regular';
}

/**
 * Assigns ticket categories to seats. Cheaper categories are placed on the
 * cheaper seats, which is the arrangement the customer would pick themselves.
 */
export function assignCategories(
  showtime: Showtime,
  seatIds: string[],
  counts: TicketCounts,
  pinned: Record<string, TicketCategory> = {},
): Record<string, TicketCategory> {
  const weekend = isWeekend(showtime.date);
  const ordered = [...seatIds].sort((a, b) => {
    const priceA = seatPrice({
      seatClass: seatClassOf(showtime, a),
      format: showtime.format,
      matinee: showtime.matinee,
      weekend,
    });
    const priceB = seatPrice({
      seatClass: seatClassOf(showtime, b),
      format: showtime.format,
      matinee: showtime.matinee,
      weekend,
    });
    return priceB - priceA || a.localeCompare(b);
  });

  const remaining: TicketCounts = { ...counts };
  const result: Record<string, TicketCategory> = {};

  // Honour any category the customer pinned to a specific seat first.
  for (const seatId of ordered) {
    const pin = pinned[seatId];
    if (pin && remaining[pin] > 0) {
      result[seatId] = pin;
      remaining[pin] -= 1;
    }
  }

  // Most expensive seats take the full-price categories.
  const order: TicketCategory[] = ['adult', 'student', 'senior', 'child'];
  for (const seatId of ordered) {
    if (result[seatId]) continue;
    const next = order.find((category) => remaining[category] > 0);
    if (!next) continue;
    result[seatId] = next;
    remaining[next] -= 1;
  }

  return result;
}

export interface QuoteInput {
  showtime: Showtime | null;
  seatIds: string[];
  counts: TicketCounts;
  seatCategories?: Record<string, TicketCategory>;
  concessions?: Record<string, number>;
  insurance?: boolean;
}

export function quoteBooking(input: QuoteInput): Quote {
  const { showtime, seatIds } = input;
  if (!showtime) return emptyQuote;

  const weekend = isWeekend(showtime.date);
  const categories =
    input.seatCategories && Object.keys(input.seatCategories).length === seatIds.length
      ? input.seatCategories
      : assignCategories(showtime, seatIds, input.counts, input.seatCategories);

  const seatLines: SeatLine[] = seatIds.map((seatId) => {
    const seatClass = seatClassOf(showtime, seatId);
    const category = categories[seatId] ?? 'adult';
    const base = seatPrice({ seatClass, format: showtime.format, matinee: showtime.matinee, weekend });
    const price = ticketPrice({
      seatClass,
      format: showtime.format,
      matinee: showtime.matinee,
      weekend,
      category,
    });
    return { seatId, seatClass, category, seatPrice: base, price, categoryDiscount: base - price };
  });

  const ticketSubtotal = seatLines.reduce((sum, line) => sum + line.price, 0);
  const categorySavings = seatLines.reduce((sum, line) => sum + line.categoryDiscount, 0);

  // What the same seats would have cost outside the before-three window.
  const matineeSavings = showtime.matinee
    ? seatLines.reduce((sum, line) => {
        const full = ticketPrice({
          seatClass: line.seatClass,
          format: showtime.format,
          matinee: false,
          weekend,
          category: line.category,
        });
        return sum + (full - line.price);
      }, 0)
    : 0;

  const concessionEntries = Object.entries(input.concessions ?? {}).filter(([, qty]) => qty > 0);
  const concessionLines: ConcessionLine[] = concessionEntries.flatMap(([itemId, quantity]) => {
    const item = concessionById.get(itemId);
    if (!item) return [];
    const size = item.size ? ` (${item.size})` : '';
    return [
      {
        itemId,
        name: `${item.name}${size}`,
        quantity,
        unitPrice: item.price,
        total: item.price * quantity,
      },
    ];
  });

  // The published Family of Four offer, applied from the booking's own shape.
  const counts = tallyCategories(seatLines);
  const familyBoxLine = concessionLines.find((line) => line.itemId === 'con-combo-family');
  const familyQualifies = counts.adult >= 2 && counts.child >= 2;
  const concessionSavings = familyBoxLine && familyQualifies ? 200 : 0;

  const concessionSubtotal =
    concessionLines.reduce((sum, line) => sum + line.total, 0) - concessionSavings;

  const bookingFee = seatIds.length * BOOKING_FEE_PER_TICKET;
  const insuranceFee = input.insurance ? insurancePolicy.fee : 0;

  return {
    seatLines,
    concessionLines,
    ticketSubtotal,
    categorySavings,
    matineeSavings,
    concessionSubtotal,
    concessionSavings,
    bookingFee,
    insuranceFee,
    total: ticketSubtotal + concessionSubtotal + bookingFee + insuranceFee,
    seatCount: seatIds.length,
  };
}

export function tallyCategories(seatLines: SeatLine[]): TicketCounts {
  const counts: TicketCounts = { ...emptyTicketCounts };
  for (const line of seatLines) counts[line.category] += 1;
  return counts;
}

/* ── Age-category checks ───────────────────────────────────────────────── */

export interface AgeCheck {
  ok: boolean;
  /** The certificate that triggered the check. */
  certificateLabel: string;
  guidance: string;
  /** Which selected categories are the problem. */
  offendingCategories: TicketCategory[];
  /** True when the film cannot be sold to this mix at all. */
  blocking: boolean;
  message: string;
}

/**
 * Compares the selected ticket categories with the film's certificate.
 *
 * This never removes a ticket, never claims that anyone's age has been
 * verified, and never asserts legal compliance. It explains which category
 * triggered the warning and leaves the decision to the customer.
 */
export function checkAgeCategories(
  movieCertificate: keyof typeof certificates,
  counts: TicketCounts,
): AgeCheck {
  const certificate = certificates[movieCertificate];
  const ok: AgeCheck = {
    ok: true,
    certificateLabel: certificate.label,
    guidance: certificate.guidance,
    offendingCategories: [],
    blocking: false,
    message: '',
  };
  if (certificate.minAge === null) return ok;

  const adults = counts.adult + counts.senior + counts.student;

  if (certificate.code === 'A18') {
    if (counts.child > 0) {
      return {
        ...ok,
        ok: false,
        blocking: true,
        offendingCategories: ['child'],
        message:
          'This film is rated 18 and over. Child tickets cannot be sold for it — change that ticket to an adult category, or choose a different film.',
      };
    }
    return {
      ...ok,
      message:
        'This film is rated 18 and over. Everyone in your party must be 18 or older; the door may ask for ID. This site does not verify anyone\'s age.',
    };
  }

  if (counts.child > 0 && adults === 0) {
    return {
      ...ok,
      ok: false,
      blocking: false,
      offendingCategories: ['child'],
      message: `${certificate.label}: under-${certificate.minAge}s are admitted only with an accompanying adult. Your booking has ${counts.child === 1 ? 'a child ticket' : `${counts.child} child tickets`} and no adult, student or senior ticket.`,
    };
  }

  if (counts.child > 0) {
    return {
      ...ok,
      message: `${certificate.label}: ${certificate.guidance} Your booking includes an accompanying adult ticket, so this is fine.`,
    };
  }

  return ok;
}

/* ── Screening helpers used by both the wizard and Max ─────────────────── */

export function seatClassesAvailable(showtime: Showtime): SeatClass[] {
  const screen = screenFor(showtime);
  if (!screen) return ['regular'];
  const classes = new Set<SeatClass>();
  for (const row of seatMapFor(showtime)) {
    for (const seat of row.seats) {
      if (seat.status === 'available') classes.add(seat.seatClass);
    }
  }
  return classes.size ? [...classes] : ['regular'];
}

/** The cheapest and dearest a single adult ticket could cost at a screening. */
export function adultPriceRange(showtime: Showtime): { min: number; max: number } {
  const weekend = isWeekend(showtime.date);
  const classes = seatClassesAvailable(showtime);
  const prices = classes.map((seatClass) =>
    ticketPrice({
      seatClass,
      format: showtime.format,
      matinee: showtime.matinee,
      weekend,
      category: 'adult',
    }),
  );
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** A plain-language explanation of how one seat's price was reached. */
export function explainSeatPrice(showtime: Showtime, seatClass: SeatClass, category: TicketCategory) {
  const weekend = isWeekend(showtime.date);
  const rule = ticketCategoryById.get(category);
  const movie = movieFor(showtime);
  const steps: Array<{ label: string; amount: number }> = [];

  const base = { regular: 350, premium: 450, recliner: 650, wheelchair: 350, companion: 350 }[seatClass];
  steps.push({ label: `${seatClass} seat`, amount: base });

  const uplift = { standard: 0, 'three-d': 100, grandscreen: 150, velvet: 250 }[showtime.format];
  if (uplift) steps.push({ label: formatUpliftLabel(showtime.format), amount: uplift });
  if (showtime.matinee) steps.push({ label: 'Before three', amount: -60 });
  if (weekend) steps.push({ label: 'Friday / Saturday', amount: 50 });

  const beforeCategory = steps.reduce((sum, step) => sum + step.amount, 0);
  const afterCategory = Math.round(beforeCategory * (rule?.multiplier ?? 1));
  if (afterCategory !== beforeCategory) {
    steps.push({
      label: `${rule?.label ?? 'Adult'} rate (×${rule?.multiplier ?? 1})`,
      amount: afterCategory - beforeCategory,
    });
  }
  steps.push({ label: 'Booking fee', amount: BOOKING_FEE_PER_TICKET });

  return {
    steps,
    total: afterCategory + BOOKING_FEE_PER_TICKET,
    movieTitle: movie?.title ?? '',
  };
}

function formatUpliftLabel(format: Showtime['format']): string {
  return {
    standard: '2D',
    'three-d': '3D presentation',
    grandscreen: 'Grandscreen',
    velvet: 'Velvet Room',
  }[format];
}
