import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TicketCategory } from '@/data/types';
import { emptyTicketCounts, type TicketCounts } from '@/lib/bookingMath';

/**
 * The in-progress booking.
 *
 * Persisted to localStorage under a versioned key so a refresh, a wrong turn
 * or an accidental back-navigation never costs the customer their selections.
 * Changing an upstream choice clears only what it actually invalidates.
 */

export const bookingSteps = [
  'session',
  'tickets',
  'seats',
  'concessions',
  'guest',
  'payment',
  'review',
] as const;

export type BookingStep = (typeof bookingSteps)[number];

export const stepLabels: Record<BookingStep, string> = {
  session: 'Screening',
  tickets: 'Tickets',
  seats: 'Seats',
  concessions: 'Add-ons',
  guest: 'Your details',
  payment: 'Payment',
  review: 'Review',
};

export type PaymentMethodId = 'card' | 'mfs' | 'net-banking' | 'gift-card' | 'counter';

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  note: string;
}

interface BookingState {
  movieId: string | null;
  cinemaId: string | null;
  date: string | null;
  showtimeId: string | null;
  counts: TicketCounts;
  seatIds: string[];
  seatCategories: Record<string, TicketCategory>;
  concessions: Record<string, number>;
  insurance: boolean;
  guest: GuestDetails | null;
  paymentMethod: PaymentMethodId | null;
  /** The customer has read and accepted the age-category warning. */
  ageAcknowledged: boolean;
  /** The customer has confirmed they want a second, similar booking. */
  duplicateAcknowledged: boolean;
  step: BookingStep;
  /** Seats Max has proposed but not applied. Never applied without confirmation. */
  proposedSeatIds: string[];

  startFor: (movieId: string) => void;
  setMovie: (movieId: string) => void;
  setCinema: (cinemaId: string | null) => void;
  setDate: (date: string | null) => void;
  setShowtime: (showtimeId: string | null) => void;
  setCounts: (counts: TicketCounts) => void;
  setCount: (category: TicketCategory, value: number) => void;
  toggleSeat: (seatId: string, limit: number) => void;
  setSeats: (seatIds: string[]) => void;
  clearSeats: () => void;
  setSeatCategory: (seatId: string, category: TicketCategory) => void;
  setConcession: (itemId: string, quantity: number) => void;
  clearConcessions: () => void;
  setInsurance: (value: boolean) => void;
  setGuest: (guest: GuestDetails) => void;
  setPaymentMethod: (method: PaymentMethodId | null) => void;
  acknowledgeAge: (value: boolean) => void;
  acknowledgeDuplicate: (value: boolean) => void;
  setStep: (step: BookingStep) => void;
  proposeSeats: (seatIds: string[]) => void;
  clearProposal: () => void;
  reset: () => void;
}

const initial = {
  movieId: null,
  cinemaId: null,
  date: null,
  showtimeId: null,
  counts: { ...emptyTicketCounts },
  seatIds: [] as string[],
  seatCategories: {} as Record<string, TicketCategory>,
  concessions: {} as Record<string, number>,
  insurance: false,
  guest: null,
  paymentMethod: null,
  ageAcknowledged: false,
  duplicateAcknowledged: false,
  step: 'session' as BookingStep,
  proposedSeatIds: [] as string[],
};

export const useBooking = create<BookingState>()(
  persist(
    (set, get) => ({
      ...initial,

      startFor: (movieId) =>
        set((state) =>
          state.movieId === movieId
            ? { step: 'session' }
            : { ...initial, counts: { ...emptyTicketCounts }, movieId, cinemaId: state.cinemaId },
        ),

      setMovie: (movieId) =>
        set((state) =>
          state.movieId === movieId
            ? {}
            : // A different film invalidates the screening and everything after it.
              {
                movieId,
                showtimeId: null,
                seatIds: [],
                seatCategories: {},
                proposedSeatIds: [],
                ageAcknowledged: false,
                duplicateAcknowledged: false,
              },
        ),

      setCinema: (cinemaId) =>
        set((state) =>
          state.cinemaId === cinemaId
            ? {}
            : // A different venue invalidates the screening and the seats.
              { cinemaId, showtimeId: null, seatIds: [], seatCategories: {}, proposedSeatIds: [] },
        ),

      setDate: (date) =>
        set((state) =>
          state.date === date
            ? {}
            : { date, showtimeId: null, seatIds: [], seatCategories: {}, proposedSeatIds: [] },
        ),

      setShowtime: (showtimeId) =>
        set((state) =>
          state.showtimeId === showtimeId
            ? {}
            : // Seats belong to one screening only.
              { showtimeId, seatIds: [], seatCategories: {}, proposedSeatIds: [] },
        ),

      setCounts: (counts) => set({ counts }),

      setCount: (category, value) =>
        set((state) => ({
          counts: { ...state.counts, [category]: Math.max(0, value) },
        })),

      toggleSeat: (seatId, limit) => {
        const { seatIds } = get();
        if (seatIds.includes(seatId)) {
          const next = seatIds.filter((id) => id !== seatId);
          const seatCategories = { ...get().seatCategories };
          delete seatCategories[seatId];
          set({ seatIds: next, seatCategories });
          return;
        }
        if (seatIds.length >= limit) return;
        set({ seatIds: [...seatIds, seatId] });
      },

      setSeats: (seatIds) => set({ seatIds, proposedSeatIds: [] }),
      clearSeats: () => set({ seatIds: [], seatCategories: {}, proposedSeatIds: [] }),

      setSeatCategory: (seatId, category) =>
        set((state) => ({ seatCategories: { ...state.seatCategories, [seatId]: category } })),

      setConcession: (itemId, quantity) =>
        set((state) => {
          const next = { ...state.concessions };
          if (quantity <= 0) delete next[itemId];
          else next[itemId] = quantity;
          return { concessions: next };
        }),

      clearConcessions: () => set({ concessions: {} }),
      setInsurance: (insurance) => set({ insurance }),
      setGuest: (guest) => set({ guest }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      acknowledgeAge: (ageAcknowledged) => set({ ageAcknowledged }),
      acknowledgeDuplicate: (duplicateAcknowledged) => set({ duplicateAcknowledged }),
      setStep: (step) => set({ step }),
      proposeSeats: (proposedSeatIds) => set({ proposedSeatIds }),
      clearProposal: () => set({ proposedSeatIds: [] }),

      reset: () => set({ ...initial, counts: { ...emptyTicketCounts } }),
    }),
    {
      name: 'nokshi.booking.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // The guest's contact details are never written to storage — they live in
      // memory for the length of the session only.
      partialize: (state) => {
        const { guest: _guest, ...rest } = state;
        return rest;
      },
      migrate: (persisted, version) => {
        if (version === 0) return { ...initial, ...(persisted as object) };
        return persisted as BookingState;
      },
    },
  ),
);

export function stepIndex(step: BookingStep): number {
  return bookingSteps.indexOf(step);
}

export function nextStep(step: BookingStep): BookingStep {
  return bookingSteps[Math.min(bookingSteps.length - 1, stepIndex(step) + 1)]!;
}

export function previousStep(step: BookingStep): BookingStep {
  return bookingSteps[Math.max(0, stepIndex(step) - 1)]!;
}
