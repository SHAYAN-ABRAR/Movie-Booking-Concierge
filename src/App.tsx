import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/routes/Home';
import { NotFound, RouteErrorBoundary } from '@/routes/NotFound';
import { RouteFallback } from '@/routes/RouteFallback';

/**
 * Routing.
 *
 * Home is in the entry chunk because it is nearly always the first paint.
 * Everything else is split, so the seat map, the QR renderer and the booking
 * wizard are not downloaded by someone who only came to read the programme.
 */
const Movies = lazy(() => import('@/routes/Movies').then((m) => ({ default: m.Movies })));
const MovieDetails = lazy(() =>
  import('@/routes/MovieDetails').then((m) => ({ default: m.MovieDetails })),
);
const Showtimes = lazy(() => import('@/routes/Showtimes').then((m) => ({ default: m.Showtimes })));
const Cinemas = lazy(() => import('@/routes/Cinemas').then((m) => ({ default: m.Cinemas })));
const CinemaDetails = lazy(() =>
  import('@/routes/CinemaDetails').then((m) => ({ default: m.CinemaDetails })),
);
const Concessions = lazy(() =>
  import('@/routes/Concessions').then((m) => ({ default: m.Concessions })),
);
const Offers = lazy(() => import('@/routes/Offers').then((m) => ({ default: m.Offers })));
const TicketPrices = lazy(() =>
  import('@/routes/TicketPrices').then((m) => ({ default: m.TicketPrices })),
);
const Booking = lazy(() => import('@/routes/Booking').then((m) => ({ default: m.Booking })));
const Bookings = lazy(() => import('@/routes/Bookings').then((m) => ({ default: m.Bookings })));
const BookingConfirmation = lazy(() =>
  import('@/routes/BookingConfirmation').then((m) => ({ default: m.BookingConfirmation })),
);
const About = lazy(() => import('@/routes/About').then((m) => ({ default: m.About })));
const Contact = lazy(() => import('@/routes/Contact').then((m) => ({ default: m.Contact })));

function split(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      { path: 'movies', element: split(<Movies />) },
      { path: 'movies/:slug', element: split(<MovieDetails />) },
      { path: 'showtimes', element: split(<Showtimes />) },
      { path: 'cinemas', element: split(<Cinemas />) },
      { path: 'cinemas/:slug', element: split(<CinemaDetails />) },
      { path: 'concessions', element: split(<Concessions />) },
      { path: 'offers', element: split(<Offers />) },
      { path: 'ticket-prices', element: split(<TicketPrices />) },
      { path: 'booking/:movieSlug', element: split(<Booking />) },
      { path: 'bookings', element: split(<Bookings />) },
      { path: 'booking-confirmation/:bookingId', element: split(<BookingConfirmation />) },
      { path: 'about', element: split(<About />) },
      { path: 'contact', element: split(<Contact />) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
