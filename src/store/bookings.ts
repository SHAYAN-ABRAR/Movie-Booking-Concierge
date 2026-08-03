import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';
import { hashString } from '@/lib/deterministic';
import {
  BOOKING_REFERENCE_PATTERN,
  LEGACY_REFERENCE_PREFIXES,
  brand,
} from '@/config/brand';
import type { Format, SeatClass, TicketCategory } from '@/data/types';
import type { PaymentMethodId } from './booking';

export interface BookedSeat {
  seatId: string;
  seatClass: SeatClass;
  category: TicketCategory;
  price: number;
}

export interface BookedConcession {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CompletedBooking {
  reference: string;
  createdAt: string;
  movieId: string;
  movieTitle: string;
  cinemaId: string;
  cinemaName: string;
  /**
   * Snapshotted so the ticket can print an address even if the venue is later
   * renamed, moved or removed from the catalogue. Optional because bookings
   * saved before this field existed are still valid history.
   */
  cinemaAddress?: string;
  /** Local poster path, snapshotted so the ticket survives a catalogue change. */
  moviePoster?: string;
  screenId: string;
  screenName: string;
  showtimeId: string;
  date: string;
  time: string;
  format: Format;
  seats: BookedSeat[];
  concessions: BookedConcession[];
  ticketSubtotal: number;
  concessionSubtotal: number;
  bookingFee: number;
  insuranceFee: number;
  total: number;
  insurance: boolean;
  paymentMethod: PaymentMethodId;
  guestName: string;
  /** Kept locally so duplicate detection and lost-property reports can use it. */
  guestEmail: string;
  guestPhone: string;
  guestNote: string;
}

/**
 * Shape validation for records read back from localStorage.
 *
 * A completed booking is the only thing in this product a customer cannot
 * recreate, and it lives in storage that a browser extension, an older build or
 * a half-finished write can corrupt. Without validation one bad record throws
 * during render and takes the whole page down — a blank screen where a ticket
 * should be. Invalid records are dropped; every valid one is preserved.
 *
 * Deliberately permissive about unknown extra keys, so a record written by a
 * newer build still loads in an older one.
 */
const bookedSeatSchema = z.object({
  seatId: z.string().min(1),
  seatClass: z.string().min(1),
  category: z.string().min(1),
  price: z.number().finite(),
});

const bookedConcessionSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  unitPrice: z.number().finite(),
  total: z.number().finite(),
});

export const completedBookingSchema = z.object({
  reference: z.string().min(1),
  createdAt: z.string().min(1),
  movieId: z.string().min(1),
  movieTitle: z.string().min(1),
  moviePoster: z.string().optional(),
  cinemaId: z.string().min(1),
  cinemaName: z.string().min(1),
  cinemaAddress: z.string().optional(),
  screenId: z.string().min(1),
  screenName: z.string().min(1),
  showtimeId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  format: z.string().min(1),
  seats: z.array(bookedSeatSchema).min(1),
  concessions: z.array(bookedConcessionSchema),
  ticketSubtotal: z.number().finite(),
  concessionSubtotal: z.number().finite(),
  bookingFee: z.number().finite(),
  insuranceFee: z.number().finite(),
  total: z.number().finite(),
  insurance: z.boolean(),
  paymentMethod: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string(),
  guestPhone: z.string(),
  guestNote: z.string(),
});

/** Keeps every record that parses; reports how many were discarded. */
export function parseStoredBookings(value: unknown): {
  bookings: CompletedBooking[];
  discarded: number;
} {
  if (!Array.isArray(value)) return { bookings: [], discarded: 0 };
  const bookings: CompletedBooking[] = [];
  let discarded = 0;
  for (const entry of value) {
    const parsed = completedBookingSchema.safeParse(entry);
    if (parsed.success) bookings.push(entry as CompletedBooking);
    else discarded += 1;
  }
  return { bookings, discarded };
}

/**
 * Booking reference.
 *
 * Deterministic in its inputs — the same screening, seats and guest always
 * produce the same code — with an unambiguous alphabet (no I, O, 0 or 1).
 *
 * The prefix comes from `brand`, so new references read `GP-`. Only the prefix
 * changed at the rebrand: the code after it is generated exactly as before, so
 * a booking made yesterday and the same booking made today differ by three
 * characters and nothing else.
 *
 * References already issued as `NK-` are **not** rewritten. They are printed on
 * tickets, saved in calendars and quoted down the phone; changing one would
 * break the only thing tying a customer to their booking. `isBookingReference`
 * accepts both, and `docs/grandplex-migration.md` records the decision.
 */
export function makeReference(input: {
  showtimeId: string;
  seatIds: string[];
  email: string;
  createdAt: string;
}): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const seed = `${input.showtimeId}|${[...input.seatIds].sort().join(',')}|${input.email.toLowerCase()}|${input.createdAt}`;
  let value = hashString(seed);
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length) + hashString(`${seed}|${i}`) % 97;
  }
  return `${brand.bookingReferencePrefix}-${code}`;
}

/**
 * True for any reference this build accepts — current `GP-` or historical `NK-`.
 *
 * Every lookup goes through this rather than testing the prefix inline, so
 * there is one place that knows what the legacy prefixes are.
 */
export function isBookingReference(value: string): boolean {
  return BOOKING_REFERENCE_PATTERN.test(value.trim().toUpperCase());
}

/** True for a reference issued before the GrandPlex rebrand. */
export function isLegacyReference(value: string): boolean {
  return LEGACY_REFERENCE_PREFIXES.some((prefix) =>
    value.trim().toUpperCase().startsWith(`${prefix}-`),
  );
}

export interface DuplicateMatch {
  booking: CompletedBooking;
  /** Which fields matched, for an honest explanation of the warning. */
  reasons: string[];
}

interface BookingsState {
  bookings: CompletedBooking[];
  add: (booking: CompletedBooking) => void;
  remove: (reference: string) => void;
  clear: () => void;
  get: (reference: string) => CompletedBooking | undefined;
}

export const useBookings = create<BookingsState>()(
  persist(
    (set, get) => ({
      bookings: [],
      add: (booking) =>
        set((state) => ({
          bookings: [booking, ...state.bookings.filter((b) => b.reference !== booking.reference)],
        })),
      remove: (reference) =>
        set((state) => ({ bookings: state.bookings.filter((b) => b.reference !== reference) })),
      clear: () => set({ bookings: [] }),
      get: (reference) => get().bookings.find((b) => b.reference === reference),
    }),
    {
      name: 'nokshi.bookings.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Validate on the way in. A malformed record is dropped rather than
      // allowed to throw during render — losing one corrupt entry is a far
      // better outcome than a blank page where the ticket should be.
      merge: (persisted, current) => {
        const raw = (persisted as { bookings?: unknown } | undefined)?.bookings;
        const { bookings, discarded } = parseStoredBookings(raw);
        if (discarded > 0) {
          console.warn(
            `GrandPlex: ignored ${discarded} unreadable booking record(s) in local storage. ` +
              `${bookings.length} valid booking(s) kept.`,
          );
        }
        return { ...current, bookings };
      },
    },
  ),
);

/**
 * Looks for an existing booking that this one would duplicate.
 *
 * Only this browser's local history is searched — nothing can be said about
 * bookings made on another device, and the interface never implies otherwise.
 */
export function findDuplicate(
  bookings: CompletedBooking[],
  candidate: {
    movieId: string;
    cinemaId: string;
    date: string;
    time: string;
    email: string;
  },
): DuplicateMatch | null {
  for (const booking of bookings) {
    const sameScreening =
      booking.movieId === candidate.movieId &&
      booking.cinemaId === candidate.cinemaId &&
      booking.date === candidate.date &&
      booking.time === candidate.time;
    if (!sameScreening) continue;

    const reasons = ['the same film', 'the same cinema', 'the same date and time'];
    if (
      candidate.email &&
      booking.guestEmail.toLowerCase().trim() === candidate.email.toLowerCase().trim()
    ) {
      reasons.push('the same email address');
    }
    return { booking, reasons };
  }
  return null;
}

/** Bookings whose screening has not yet started, soonest first. */
export function upcomingBookings(bookings: CompletedBooking[], now = new Date()): CompletedBooking[] {
  return bookings
    .filter((b) => new Date(`${b.date}T${b.time}`).getTime() >= now.getTime())
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

export function pastBookings(bookings: CompletedBooking[], now = new Date()): CompletedBooking[] {
  return bookings
    .filter((b) => new Date(`${b.date}T${b.time}`).getTime() < now.getTime())
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
}
