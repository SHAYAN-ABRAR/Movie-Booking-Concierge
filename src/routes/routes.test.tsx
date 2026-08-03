import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { TooltipProvider } from '@/components/ui/popover';

import { Home } from './Home';
import { Movies } from './Movies';
import { MovieDetails } from './MovieDetails';
import { Showtimes } from './Showtimes';
import { Cinemas } from './Cinemas';
import { CinemaDetails } from './CinemaDetails';
import { Concessions } from './Concessions';
import { Offers } from './Offers';
import { TicketPrices } from './TicketPrices';
import { Bookings } from './Bookings';
import { About } from './About';
import { Contact } from './Contact';
import { Booking } from './Booking';
import { BookingConfirmation } from './BookingConfirmation';
import { NotFound } from './NotFound';

/**
 * Every route is rendered for real.
 *
 * A type error is not the same thing as a crash: these catch the components
 * that compile cleanly and then throw on first render — a missing guard, an
 * undefined index, a selector that returns nothing.
 */
function renderAt(path: string, pattern: string, element: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TooltipProvider>
        <Routes>
          <Route path={pattern} element={element} />
        </Routes>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe('every route renders', () => {
  it('home', () => {
    renderAt('/', '/', <Home />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /book in four steps/i })).toBeInTheDocument();
  });

  it('the catalogue', () => {
    renderAt('/movies', '/movies', <Movies />);
    expect(screen.getByRole('heading', { name: /now showing/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /choose a date/i })).toBeInTheDocument();
  });

  it('a film page, with an honest trailer state', () => {
    renderAt('/movies/the-odyssey', '/movies/:slug', <MovieDetails />);
    expect(screen.getByRole('heading', { name: 'The Odyssey', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no trailer available/i)).toBeInTheDocument();
  });

  it('a film page for an unknown slug falls back rather than throwing', () => {
    renderAt('/movies/does-not-exist', '/movies/:slug', <MovieDetails />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('showtimes', () => {
    renderAt('/showtimes', '/showtimes', <Showtimes />);
    expect(screen.getByRole('heading', { name: /showtimes/i, level: 1 })).toBeInTheDocument();
  });

  it('cinemas', () => {
    renderAt('/cinemas', '/cinemas', <Cinemas />);
    expect(screen.getByRole('heading', { name: /our cinemas/i, level: 1 })).toBeInTheDocument();
  });

  it('a cinema page', () => {
    renderAt('/cinemas/dhanmondi', '/cinemas/:slug', <CinemaDetails />);
    expect(screen.getByRole('heading', { name: /nokshi dhanmondi/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /house policies/i })).toBeInTheDocument();
  });

  it('the counter', () => {
    renderAt('/concessions', '/concessions', <Concessions />);
    expect(screen.getByRole('heading', { name: /food and drink/i, level: 1 })).toBeInTheDocument();
  });

  it('offers', () => {
    renderAt('/offers', '/offers', <Offers />);
    expect(screen.getByRole('heading', { name: /^offers$/i, level: 1 })).toBeInTheDocument();
  });

  it('ticket prices', () => {
    renderAt('/ticket-prices', '/ticket-prices', <TicketPrices />);
    expect(screen.getByRole('heading', { name: /ticket prices/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /the only fee/i })).toBeInTheDocument();
  });

  it('bookings, empty on a fresh browser', () => {
    renderAt('/bookings', '/bookings', <Bookings />);
    expect(screen.getByRole('heading', { name: /my bookings/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no bookings on this device yet/i)).toBeInTheDocument();
  });

  it('about', () => {
    renderAt('/about', '/about', <About />);
    expect(screen.getByRole('heading', { name: /nokshi cinemas/i, level: 1 })).toBeInTheDocument();
  });

  it('contact', () => {
    renderAt('/contact', '/contact', <Contact />);
    expect(screen.getByRole('heading', { name: /contact and support/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it('the booking wizard', () => {
    renderAt('/booking/the-odyssey', '/booking/:movieSlug', <Booking />);
    expect(screen.getByRole('heading', { name: 'The Odyssey', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /booking steps/i })).toBeInTheDocument();
  });

  it('a confirmation for a reference this browser does not have', () => {
    renderAt('/booking-confirmation/NK-XXXXXX', '/booking-confirmation/:bookingId', <BookingConfirmation />);
    expect(screen.getByText(/no booking with that reference/i)).toBeInTheDocument();
  });

  it('not found', () => {
    renderAt('/nowhere', '/nowhere', <NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});

describe('honesty guarantees that must never regress', () => {
  it('labels the schedule as sample data wherever it is shown', () => {
    renderAt('/showtimes', '/showtimes', <Showtimes />);
    expect(screen.getByText(/sample schedule/i)).toBeInTheDocument();
  });

  it('states on the booking flow that no payment is taken', () => {
    renderAt('/booking/the-odyssey', '/booking/:movieSlug', <Booking />);
    expect(screen.getByText(/no payment is taken/i)).toBeInTheDocument();
  });

  it('never renders a password field anywhere in the booking flow', () => {
    const { container } = renderAt('/booking/the-odyssey', '/booking/:movieSlug', <Booking />);
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });

  it('states that prices are sample data on the pricing page', () => {
    renderAt('/ticket-prices', '/ticket-prices', <TicketPrices />);
    expect(screen.getByText(/sample pricing/i)).toBeInTheDocument();
  });

  it('flags incomplete allergen data at the counter rather than implying completeness', () => {
    renderAt('/concessions', '/concessions', <Concessions />);
    expect(screen.getAllByText(/allergen list incomplete/i).length).toBeGreaterThan(0);
  });
});
