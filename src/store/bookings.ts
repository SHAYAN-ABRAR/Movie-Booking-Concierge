import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hashString } from '@/lib/deterministic';
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
 * Booking reference.
 *
 * Deterministic in its inputs — the same screening, seats and guest always
 * produce the same code — with an unambiguous alphabet (no I, O, 0 or 1).
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
  return `NK-${code}`;
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
