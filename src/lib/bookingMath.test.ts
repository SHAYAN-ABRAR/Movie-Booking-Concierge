import { describe, expect, it } from 'vitest';
import {
  assignCategories,
  checkAgeCategories,
  quoteBooking,
  totalTickets,
  emptyTicketCounts,
} from './bookingMath';
import { seatPrice, ticketPrice, isMatinee, isWeekend, BOOKING_FEE_PER_TICKET } from '@/data/pricing';
import { showtimesForCinemaDate, seatMapFor } from '@/data/schedule';
import { dateWindow } from './datetime';

const today = dateWindow(1)[0]!;

describe('pricing rules', () => {
  it('builds a seat price from class, format, time and day', () => {
    expect(seatPrice({ seatClass: 'regular', format: 'standard', matinee: false, weekend: false })).toBe(350);
    expect(seatPrice({ seatClass: 'premium', format: 'standard', matinee: false, weekend: false })).toBe(450);
    expect(seatPrice({ seatClass: 'regular', format: 'three-d', matinee: false, weekend: false })).toBe(450);
    expect(seatPrice({ seatClass: 'regular', format: 'grandscreen', matinee: false, weekend: false })).toBe(500);
    expect(seatPrice({ seatClass: 'recliner', format: 'velvet', matinee: false, weekend: false })).toBe(900);
  });

  it('takes ৳60 off before three and adds ৳50 at the weekend', () => {
    expect(seatPrice({ seatClass: 'regular', format: 'standard', matinee: true, weekend: false })).toBe(290);
    expect(seatPrice({ seatClass: 'regular', format: 'standard', matinee: false, weekend: true })).toBe(400);
    expect(seatPrice({ seatClass: 'regular', format: 'standard', matinee: true, weekend: true })).toBe(340);
  });

  it('applies the age-category multiplier last', () => {
    const base = { seatClass: 'regular', format: 'standard', matinee: false, weekend: false } as const;
    expect(ticketPrice({ ...base, category: 'adult' })).toBe(350);
    expect(ticketPrice({ ...base, category: 'child' })).toBe(245);
    expect(ticketPrice({ ...base, category: 'senior' })).toBe(263);
    expect(ticketPrice({ ...base, category: 'student' })).toBe(298);
  });

  it('charges wheelchair spaces at the regular rate', () => {
    const options = { format: 'grandscreen', matinee: false, weekend: false } as const;
    expect(seatPrice({ ...options, seatClass: 'wheelchair' })).toBe(
      seatPrice({ ...options, seatClass: 'regular' }),
    );
    expect(seatPrice({ ...options, seatClass: 'companion' })).toBe(
      seatPrice({ ...options, seatClass: 'regular' }),
    );
  });

  it('classifies matinee and weekend from real values', () => {
    expect(isMatinee('14:59')).toBe(true);
    expect(isMatinee('15:00')).toBe(false);
    // 2026-08-07 is a Friday; 2026-08-09 a Sunday.
    expect(isWeekend('2026-08-07')).toBe(true);
    expect(isWeekend('2026-08-09')).toBe(false);
  });
});

describe('quoting a booking', () => {
  const showtime = showtimesForCinemaDate('cin-dhanmondi', today)[0]!;
  const freeSeats = seatMapFor(showtime)
    .flatMap((row) => row.seats)
    .filter((seat) => seat.status === 'available')
    .slice(0, 3)
    .map((seat) => seat.id);

  it('charges the booking fee once per ticket and never hides it', () => {
    const quote = quoteBooking({
      showtime,
      seatIds: freeSeats,
      counts: { ...emptyTicketCounts, adult: freeSeats.length },
    });
    expect(quote.bookingFee).toBe(freeSeats.length * BOOKING_FEE_PER_TICKET);
    expect(quote.total).toBe(quote.ticketSubtotal + quote.concessionSubtotal + quote.bookingFee);
  });

  it('adds nothing beyond the lines it reports', () => {
    const quote = quoteBooking({
      showtime,
      seatIds: freeSeats,
      counts: { ...emptyTicketCounts, adult: 2, child: 1 },
      concessions: { 'con-cola-r': 2 },
      insurance: true,
    });
    const sum =
      quote.ticketSubtotal + quote.concessionSubtotal + quote.bookingFee + quote.insuranceFee;
    expect(quote.total).toBe(sum);
  });

  it('returns an empty quote when no screening is chosen', () => {
    const quote = quoteBooking({ showtime: null, seatIds: [], counts: emptyTicketCounts });
    expect(quote.total).toBe(0);
    expect(quote.seatLines).toHaveLength(0);
  });

  it('puts the cheaper categories on the cheaper seats', () => {
    const map = assignCategories(showtime, freeSeats, {
      ...emptyTicketCounts,
      adult: 1,
      child: 2,
    });
    expect(Object.keys(map)).toHaveLength(freeSeats.length);
    expect(Object.values(map).filter((c) => c === 'child')).toHaveLength(2);
    expect(Object.values(map).filter((c) => c === 'adult')).toHaveLength(1);
  });

  it('counts tickets across all categories', () => {
    expect(totalTickets({ child: 1, adult: 2, senior: 1, student: 0 })).toBe(4);
  });
});

describe('age-category checks', () => {
  it('passes a U film with any mix', () => {
    const result = checkAgeCategories('U', { ...emptyTicketCounts, child: 2, adult: 1 });
    expect(result.ok).toBe(true);
    expect(result.blocking).toBe(false);
  });

  it('blocks a child ticket on an 18-rated film and names the category', () => {
    const result = checkAgeCategories('A18', { ...emptyTicketCounts, child: 1, adult: 1 });
    expect(result.ok).toBe(false);
    expect(result.blocking).toBe(true);
    expect(result.offendingCategories).toContain('child');
    expect(result.message).toMatch(/child/i);
  });

  it('warns but does not block a child with no adult on a 12A', () => {
    const result = checkAgeCategories('UA12', { ...emptyTicketCounts, child: 2 });
    expect(result.ok).toBe(false);
    expect(result.blocking).toBe(false);
    expect(result.message).toMatch(/accompanying adult/i);
  });

  it('accepts a child accompanied by an adult on a 12A', () => {
    const result = checkAgeCategories('UA12', { ...emptyTicketCounts, child: 2, adult: 1 });
    expect(result.ok).toBe(true);
  });

  it('never claims that age has been verified', () => {
    const result = checkAgeCategories('A18', { ...emptyTicketCounts, adult: 2 });
    expect(result.message).toMatch(/does not verify/i);
  });
});
