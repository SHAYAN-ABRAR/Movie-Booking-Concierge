import { useLocation, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getCinema, getMovie } from '@/data';

/**
 * The document title, for every route, in one place.
 *
 * Done centrally rather than with a `useDocumentTitle` call inside each of the
 * sixteen route components: the title is derived entirely from the URL, and
 * sixteen call sites is sixteen chances for one route to be forgotten or to
 * drift into a different format.
 *
 * Proper nouns — a film's title, a venue's name — are *not* translated. They
 * are what the thing is called.
 */
export function useRouteTitle() {
  const { t } = useTranslation();
  // `useLocation`, not `window.location`: the latter is not reactive, so the
  // title would lag one navigation behind.
  const { pathname } = useLocation();

  const movie = useMatch('/movies/:slug');
  const cinema = useMatch('/cinemas/:slug');
  const booking = useMatch('/booking/:movieSlug');
  const confirmation = useMatch('/booking-confirmation/:bookingId');

  const staticTitles: Array<[string, string]> = [
    ['/', t('metadata.home')],
    ['/movies', t('movies.nowShowing')],
    ['/showtimes', t('showtimes.title')],
    ['/cinemas', t('cinemas.title')],
    ['/concessions', t('concessions.title')],
    ['/offers', t('offers.title')],
    ['/ticket-prices', t('ticketPrices.title')],
    ['/bookings', t('bookings.title')],
    ['/about', t('about.title')],
    ['/contact', t('contact.title')],
  ];

  let page: string | null = null;

  if (movie) page = getMovie(movie.params.slug ?? '')?.title ?? t('movies.nowShowing');
  else if (cinema) page = getCinema(cinema.params.slug ?? '')?.name ?? t('cinemas.title');
  else if (booking)
    page = getMovie(booking.params.movieSlug ?? '')?.title ?? t('metadata.booking');
  else if (confirmation) page = t('metadata.confirmation');
  else {
    page =
      staticTitles.find(([path]) => path === pathname)?.[1] ??
      t('metadata.notFound');
  }

  useDocumentTitle(page);
}
