import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetClose } from '@/components/ui/overlay';
import { LocationSwitcher } from './LocationSwitcher';
import { AlertBell } from './AlertBell';

const primaryNav = [
  { to: '/movies', label: 'Programme' },
  { to: '/showtimes', label: 'Showtimes' },
  { to: '/cinemas', label: 'Cinemas' },
  { to: '/concessions', label: 'Counter' },
  { to: '/offers', label: 'Offers' },
];

const secondaryNav = [
  { to: '/ticket-prices', label: 'Ticket prices' },
  { to: '/bookings', label: 'My bookings' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header
      data-app-header
      className="sticky top-0 z-40 border-b border-hairline bg-paper/92 backdrop-blur-[6px]"
    >
      <div className="shell flex h-16 items-center gap-3">
        <Link
          to="/"
          className="shrink-0 rounded-sm py-1 text-ink transition-opacity hover:opacity-75"
          aria-label="Nokshi Cinemas — home"
        >
          <Logo />
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative block rounded-sm px-3 py-2 text-sm font-semibold transition-colors',
                      isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 -bottom-px block h-[2px] bg-marigold"
                        />
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden md:block">
            <LocationSwitcher />
          </div>

          <AlertBell />

          <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
            <Link to="/showtimes">
              <Ticket aria-hidden="true" />
              Book
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="p-0">
          <div className="flex items-center border-b border-hairline px-5 py-4">
            <SheetTitle className="text-lg">Menu</SheetTitle>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="space-y-1">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <SheetClose asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between border-b border-hairline py-3.5 font-display text-xl transition-colors',
                          isActive ? 'text-ink' : 'text-ink-muted',
                        )
                      }
                    >
                      {item.label}
                      {location.pathname === item.to ? (
                        <span aria-hidden="true" className="size-1.5 bg-marigold" />
                      ) : null}
                    </NavLink>
                  </SheetClose>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-1">
              {secondaryNav.map((item) => (
                <li key={item.to}>
                  <SheetClose asChild>
                    <NavLink to={item.to} className="block py-2 text-[0.9375rem] text-ink-muted">
                      {item.label}
                    </NavLink>
                  </SheetClose>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-hairline pt-5">
              <p className="eyebrow mb-3">Your cinema</p>
              <LocationSwitcher fullWidth />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
