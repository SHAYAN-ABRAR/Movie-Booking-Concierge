import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  LanguageToggle,
  PreferenceControls,
  ThemeToggle,
} from '@/components/preferences/PreferenceControls';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetClose } from '@/components/ui/overlay';
import { LocationSwitcher } from './LocationSwitcher';
import { AlertBell } from './AlertBell';

/**
 * Nav entries carry a translation key rather than a label. `as const` keeps the
 * keys literal, so `t(item.key)` stays checked against the catalogue and a
 * renamed key breaks the build instead of printing itself into the header.
 */
const primaryNav = [
  { to: '/movies', key: 'nav.programme' },
  { to: '/showtimes', key: 'nav.showtimes' },
  { to: '/cinemas', key: 'nav.cinemas' },
  { to: '/concessions', key: 'nav.counter' },
  { to: '/offers', key: 'nav.offers' },
] as const;

const secondaryNav = [
  { to: '/ticket-prices', key: 'nav.ticketPrices' },
  { to: '/bookings', key: 'nav.myBookings' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.contact' },
] as const;

export function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header
      data-app-header
      className="sticky top-0 z-40 border-b border-hairline bg-surface/92 backdrop-blur-[6px]"
    >
      <div className="shell flex h-16 items-center gap-3">
        <Link
          to="/"
          className="shrink-0 rounded-sm py-1 text-content transition-opacity hover:opacity-75"
          aria-label={t('nav.home')}
        >
          <Logo />
        </Link>

        <nav aria-label={t('nav.primary')} className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative block rounded-sm px-3 py-2 text-sm font-semibold transition-colors',
                      isActive ? 'text-content' : 'text-content-muted hover:text-content',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {t(item.key)}
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

          {/* Language needs room for "বাংলা", so it appears from lg; appearance
              is icon-only and compact enough to keep from md. Both are in the
              mobile sheet, so nothing is unreachable at any width. */}
          <LanguageToggle className="hidden lg:inline-flex" label={t('preferences.language.label')} />
          <ThemeToggle
            className="hidden md:inline-flex"
            label={t('preferences.appearance.label')}
            lightLabel={t('preferences.appearance.light')}
            darkLabel={t('preferences.appearance.dark')}
          />

          <AlertBell />

          <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
            <Link to="/showtimes">
              <Ticket aria-hidden="true" />
              {t('nav.book')}
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t('nav.openMenu')}
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
            <SheetTitle className="text-lg">{t('nav.menu')}</SheetTitle>
          </div>
          <nav aria-label={t('nav.mobile')} className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="space-y-1">
              {primaryNav.map((item) => (
                <li key={item.to}>
                  <SheetClose asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between border-b border-hairline py-3.5 font-display text-xl transition-colors',
                          isActive ? 'text-content' : 'text-content-muted',
                        )
                      }
                    >
                      {t(item.key)}
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
                    <NavLink to={item.to} className="block py-2 text-[0.9375rem] text-content-muted">
                      {t(item.key)}
                    </NavLink>
                  </SheetClose>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-hairline pt-5">
              <p className="eyebrow mb-3">{t('nav.yourCinema')}</p>
              <LocationSwitcher fullWidth />
            </div>
            <div className="mt-6 border-t border-hairline pb-2 pt-5">
              <PreferenceControls
                languageLabel={t('preferences.language.heading')}
                appearanceLabel={t('preferences.appearance.heading')}
                lightLabel={t('preferences.appearance.light')}
                darkLabel={t('preferences.appearance.dark')}
              />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
