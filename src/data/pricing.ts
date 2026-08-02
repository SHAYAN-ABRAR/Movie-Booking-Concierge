import type { Certificate, CertificateCode, Format, SeatClass, TicketCategoryRule } from './types';

/**
 * Sample pricing rules — the single source of truth for every price shown
 * anywhere in this application, including Max's calculations.
 *
 * These figures are demonstration data authored for this build. They are not
 * the prices of any real cinema.
 */

export const CURRENCY = 'BDT';
export const CURRENCY_SYMBOL = '৳';

/** Base price per seat class, in whole taka, before format and time adjustments. */
export const seatClassBase: Record<SeatClass, number> = {
  regular: 350,
  premium: 450,
  recliner: 650,
  // Wheelchair spaces and their companion seats are always charged at the
  // regular rate, whatever part of the house they sit in.
  wheelchair: 350,
  companion: 350,
};

/** Format uplift, added to the seat-class base. */
export const formatUplift: Record<Format, number> = {
  standard: 0,
  'three-d': 100,
  grandscreen: 150,
  velvet: 250,
};

/** Screenings starting before this hour are matinee-priced. */
export const MATINEE_BEFORE_HOUR = 15;
export const MATINEE_DISCOUNT = 60;

/** Friday and Saturday are the weekend in this circuit. */
export const WEEKEND_DAYS = [5, 6];
export const WEEKEND_UPLIFT = 50;

/**
 * A per-ticket online booking fee. It is shown on the ticket step, in every
 * running total, in the review breakdown and in every figure Max quotes.
 * There are no other fees, and none are hidden.
 */
export const BOOKING_FEE_PER_TICKET = 20;

export const ticketCategories: TicketCategoryRule[] = [
  {
    id: 'child',
    label: 'Child',
    labelBn: 'শিশু',
    description: 'Ages 3–11. Under 3s are admitted free on a guardian\'s lap and do not need a ticket.',
    multiplier: 0.7,
    ageFrom: 3,
    ageTo: 11,
    countsAsAdult: false,
  },
  {
    id: 'student',
    label: 'Student',
    labelBn: 'শিক্ষার্থী',
    description: 'Valid student ID required at the door. Ages 12 and over.',
    multiplier: 0.85,
    ageFrom: 12,
    ageTo: null,
    countsAsAdult: true,
  },
  {
    id: 'adult',
    label: 'Adult',
    labelBn: 'প্রাপ্তবয়স্ক',
    description: 'Ages 12–59.',
    multiplier: 1,
    ageFrom: 12,
    ageTo: 59,
    countsAsAdult: true,
  },
  {
    id: 'senior',
    label: 'Senior',
    labelBn: 'প্রবীণ',
    description: 'Ages 60 and over. ID may be requested at the door.',
    multiplier: 0.75,
    ageFrom: 60,
    ageTo: null,
    countsAsAdult: true,
  },
];

export const ticketCategoryById = new Map(ticketCategories.map((t) => [t.id, t]));

export const certificates: Record<CertificateCode, Certificate> = {
  U: {
    code: 'U',
    label: 'U — Universal',
    minAge: null,
    guidance: 'Suitable for all ages.',
  },
  UA12: {
    code: 'UA12',
    label: 'U/A 12+',
    minAge: 12,
    guidance:
      'Under 12s are admitted only with an accompanying adult ticket in the same booking.',
  },
  UA16: {
    code: 'UA16',
    label: 'U/A 16+',
    minAge: 16,
    guidance:
      'Under 16s are admitted only with an accompanying adult ticket in the same booking. Contains material some younger viewers may find distressing.',
  },
  A18: {
    code: 'A18',
    label: 'A — 18 and over',
    minAge: 18,
    guidance: 'No admission under 18. Child tickets cannot be sold for this film.',
  },
};

/**
 * The price of one seat, before the ticket-category multiplier.
 * Deterministic and pure — every caller, including Max, uses this function.
 */
export function seatPrice(input: {
  seatClass: SeatClass;
  format: Format;
  matinee: boolean;
  weekend: boolean;
}): number {
  const base = seatClassBase[input.seatClass] + formatUplift[input.format];
  const matinee = input.matinee ? -MATINEE_DISCOUNT : 0;
  const weekend = input.weekend ? WEEKEND_UPLIFT : 0;
  return base + matinee + weekend;
}

/** The price of one ticket: seat price adjusted for the buyer's age category. */
export function ticketPrice(input: {
  seatClass: SeatClass;
  format: Format;
  matinee: boolean;
  weekend: boolean;
  category: TicketCategoryRule['id'];
}): number {
  const rule = ticketCategoryById.get(input.category);
  const multiplier = rule?.multiplier ?? 1;
  return Math.round(seatPrice(input) * multiplier);
}

export function isWeekend(isoDate: string): boolean {
  // Parse as a local date rather than UTC so the weekend flag matches the
  // venue's calendar day rather than the browser's offset from it.
  const [y, m, d] = isoDate.split('-').map(Number);
  const day = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay();
  return WEEKEND_DAYS.includes(day);
}

export function isMatinee(time: string): boolean {
  const hour = Number(time.slice(0, 2));
  return hour < MATINEE_BEFORE_HOUR;
}

/** The full price range across a screening's seat classes, for range labels. */
export function priceRangeFor(input: {
  format: Format;
  matinee: boolean;
  weekend: boolean;
  seatClasses: SeatClass[];
}): { min: number; max: number } {
  const prices = input.seatClasses.map((seatClass) =>
    seatPrice({ seatClass, format: input.format, matinee: input.matinee, weekend: input.weekend }),
  );
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
