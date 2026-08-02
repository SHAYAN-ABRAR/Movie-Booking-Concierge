import { useMemo } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { getMovie, getCinema } from '@/data';
import { quoteBooking, totalTickets } from '@/lib/bookingMath';
import { getShowtime } from '@/data/schedule';
import { useBooking } from '@/store/booking';
import { useBookings } from '@/store/bookings';
import { usePreferences } from '@/store/preferences';
import { useWatches } from '@/store/watches';
import type { MovieFilter } from '@/data';
import type { MaxContext } from './types';
import type { CertificateCode } from '@/data/types';
import { checkAgeCategories } from '@/lib/bookingMath';

/**
 * Assembles what Max can see, fresh on every turn.
 *
 * Only customer-facing state goes in. No store internals, no persistence keys,
 * no implementation details — Max should never be able to leak how the app is
 * put together into a reply.
 */
export function useMaxContext(): MaxContext {
  const location = useLocation();
  const params = useParams();
  const [search] = useSearchParams();

  const booking = useBooking();
  const bookings = useBookings((s) => s.bookings);
  const watches = useWatches((s) => s.watches);
  const preferredCinema = usePreferences((s) => s.cinemaId);
  const accessibility = usePreferences((s) => s.accessibility);

  return useMemo(() => {
    // What the customer is looking at, as opposed to what they are booking.
    const routeMovie = params.slug ? getMovie(params.slug) : null;
    const routeBookingMovie = params.movieSlug ? getMovie(params.movieSlug) : null;
    const routeCinema = params.slug && location.pathname.startsWith('/cinemas') ? getCinema(params.slug) : null;

    const showtimeParam = search.get('showtime');
    const viewedShowtime = showtimeParam ? getShowtime(showtimeParam) : null;

    const activeFilter: MovieFilter = {
      ...(search.get('q') ? { query: search.get('q')! } : {}),
      ...(search.get('genre') ? { genres: search.get('genre')!.split(',') as MovieFilter['genres'] } : {}),
      ...(search.get('lang') ? { languages: search.get('lang')!.split(',') as MovieFilter['languages'] } : {}),
      ...(search.get('cinema') ? { cinemaIds: search.get('cinema')!.split(',') } : {}),
      ...(search.get('date') ? { date: search.get('date')! } : {}),
      ...(search.get('after') ? { after: search.get('after')! } : {}),
      ...(search.get('before') ? { before: search.get('before')! } : {}),
    };

    const bookingShowtime = booking.showtimeId ? getShowtime(booking.showtimeId) : null;
    const quote = quoteBooking({
      showtime: bookingShowtime,
      seatIds: booking.seatIds,
      counts: booking.counts,
      seatCategories: booking.seatCategories,
      concessions: booking.concessions,
      insurance: booking.insurance,
    });

    // Mirror the wizard's own gate, so Max explains the same blocker the
    // Continue button is showing rather than a second opinion.
    const inWizard = location.pathname.startsWith('/booking/');
    const ticketCount = totalTickets(booking.counts);
    const movieForBooking = booking.movieId ? getMovie(booking.movieId) : null;
    const ageCheck = movieForBooking
      ? checkAgeCategories(movieForBooking.certificate as CertificateCode, booking.counts)
      : null;

    let blocker: string | null = null;
    if (inWizard) {
      if (booking.step === 'session' && !bookingShowtime) blocker = 'no screening chosen yet';
      else if (booking.step === 'tickets' && ticketCount === 0) blocker = 'no tickets added yet';
      else if (booking.step === 'tickets' && ageCheck?.blocking) blocker = 'an age-category conflict';
      else if (booking.step === 'seats' && booking.seatIds.length !== ticketCount) {
        blocker = `${Math.abs(ticketCount - booking.seatIds.length)} seat(s) still to choose`;
      } else if (booking.step === 'guest' && !booking.guest) blocker = 'guest details incomplete';
      else if (booking.step === 'payment' && !booking.paymentMethod) blocker = 'no payment method chosen';
    }

    return {
      route: location.pathname,
      movieId: routeMovie?.id ?? routeBookingMovie?.id ?? null,
      cinemaId: routeCinema?.id ?? booking.cinemaId ?? preferredCinema,
      date: booking.date ?? search.get('date'),
      showtimeId: booking.showtimeId ?? viewedShowtime?.id ?? null,
      activeFilter,
      booking: {
        step: inWizard ? booking.step : null,
        movieId: booking.movieId,
        showtimeId: booking.showtimeId,
        counts: booking.counts,
        seatIds: booking.seatIds,
        concessions: booking.concessions,
        insurance: booking.insurance,
        subtotal: quote.total,
        blocker,
      },
      localBookings: bookings.map((b) => b.reference),
      watchIds: watches.map((w) => w.id),
      accessibilityPreferences: accessibility,
      now: new Date(),
    };
  }, [
    location.pathname,
    params.slug,
    params.movieSlug,
    search,
    booking,
    bookings,
    watches,
    preferredCinema,
    accessibility,
  ]);
}

/** Context-aware starter prompts. Different on every surface, by design. */
export function suggestedPrompts(context: MaxContext): string[] {
  const route = context.route;

  if (route.startsWith('/booking/')) {
    switch (context.booking.step) {
      case 'seats':
        return [
          'Find three seats near the centre',
          'I need a wheelchair space and a companion seat',
          'Find seats close to an aisle',
          'Keep the tickets under ৳1500',
        ];
      case 'tickets':
        return [
          'How is this price worked out?',
          'What is the child discount?',
          'Is there an age restriction on this film?',
          'What is the cheapest way to book for four?',
        ];
      case 'concessions':
        return [
          'What should four of us get?',
          'Something without dairy',
          'Cheapest thing that feeds two',
          'What does Ticket Cover actually cover?',
        ];
      case 'payment':
      case 'review':
        return [
          'Why is there a booking fee?',
          'When should I arrive?',
          'What if I arrive late?',
          'Can I get a refund?',
        ];
      default:
        return [
          'Find the cheapest showtime',
          'Which screening has open captions?',
          'How long is this film?',
          'Find three seats together',
        ];
    }
  }

  if (route.startsWith('/booking-confirmation/')) {
    return [
      'When should I arrive?',
      'What if I arrive late?',
      'Add this to my calendar',
      'Help me report a lost item',
    ];
  }

  if (route.startsWith('/movies/')) {
    return [
      'Find the cheapest showtime',
      'Which screening has open captions?',
      'How long is this movie?',
      'Find three seats together',
    ];
  }

  if (route.startsWith('/movies')) {
    return [
      'Show sci-fi movies tonight',
      'Only show Bangla films',
      'Find something under two hours',
      'Which films are suitable for children?',
    ];
  }

  if (route.startsWith('/showtimes')) {
    return [
      'Anything after 8 PM tonight?',
      'Show wheelchair-accessible screenings',
      'What is the cheapest screening today?',
      'Compare tonight’s screenings',
    ];
  }

  if (route.startsWith('/cinemas')) {
    return [
      'Is there parking here?',
      'How do I get here?',
      'What is on today?',
      'Is it step-free?',
    ];
  }

  if (route.startsWith('/concessions')) {
    return [
      'What should four of us get?',
      'Something vegan',
      'Nothing with nuts',
      'Cheapest option for two',
    ];
  }

  if (route.startsWith('/bookings')) {
    return [
      'When should I arrive?',
      'Add my booking to the calendar',
      'I left something at the cinema',
      'How do I claim on Ticket Cover?',
    ];
  }

  return [
    'What can I watch tonight?',
    'Find a movie after 8 PM',
    'Show wheelchair-accessible screenings',
    'Help me choose a cinema',
  ];
}
