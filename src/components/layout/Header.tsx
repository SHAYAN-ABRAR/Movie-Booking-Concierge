import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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

/**
 * The masthead.
 *
 * A hard bar, edge to edge, closed by a 2px rule. Nothing floats, nothing is
 * rounded and nothing is translucent enough to let the page show through as
 * mush — the backdrop blur exists only so that type scrolling underneath does
 * not fight the nav.
 *
 * The active route is marked by a vermilion slab sitting *on* the header's
 * bottom rule rather than by colouring the label, so the marker reads at a
 * glance from across the page and does not depend on the customer being able
 * to tell two greys apart.
 */
export function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header
      data-app-header
      className="sticky top-0 z-40 border-b-2 border-content bg-surface/95 backdrop-blur-[8px]"
    >
      <div className="shell flex h-(--header-h) items-stretch gap-4">
        <Link
          to="/"
          className="flex shrink-0 items-center py-3 transition-opacity duration-[--dur-fast] hover:opacity-70"
          aria-label={t('nav.home')}
        >
          <Logo />
        </Link>

        <nav aria-label={t('nav.primary')} className="ml-4 hidden lg:block xl:ml-8">
          <ul className="flex h-full items-stretch">
            {primaryNav.map((item) => (
              <li key={item.to} className="flex">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center px-3.5 xl:px-4',
                      'text-[0.6875rem] font-bold uppercase tracking-[0.14em]',
                      '[&:lang(bn)]:text-[0.8125rem] [&:lang(bn)]:tracking-normal',
                      'transition-colors duration-[--dur-fast]',
                      isActive ? 'text-content' : 'text-content-muted hover:text-content',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {t(item.key)}
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute inset-x-0 -bottom-0.5 block h-[3px] origin-left bg-accent',
                          'transition-transform duration-[--dur-base] ease-[--ease-out]',
                          isActive ? 'scale-x-100' : 'scale-x-0',
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="mr-1 hidden md:block">
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

          {/* Visible at every width. Hiding the one action the whole product
              exists for below 640px left a phone with no route to booking
              except the menu. It is compact enough at 360px to sit beside the
              bell and the menu control without crowding either. */}
          <Button asChild variant="accent" size="sm" className="ml-1 px-2.5 sm:px-3.5">
            <Link to="/showtimes">{t('nav.book')}</Link>
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
        <SheetContent side="right" className="p-0" showClose={false}>
          <div className="flex items-center justify-between border-b-2 border-content px-5 py-4">
            <SheetTitle className="eyebrow text-content">{t('nav.menu')}</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('common.actions.close')}>
                <X aria-hidden="true" />
              </Button>
            </SheetClose>
          </div>
          <nav aria-label={t('nav.mobile')} className="flex-1 overflow-y-auto px-5 py-5">
            {/* The mobile programme index is numbered exactly like the printed
                one, so the two never feel like different products. */}
            <ul>
              {primaryNav.map((item, i) => {
                const active = location.pathname === item.to;
                return (
                  <li key={item.to}>
                    <SheetClose asChild>
                      <NavLink
                        to={item.to}
                        className={cn(
                          'flex items-baseline gap-4 border-b border-hairline py-4',
                          active ? 'text-content' : 'text-content-muted',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'numeral shrink-0 text-[0.6875rem] font-bold',
                            active ? 'text-accent' : 'text-content-faint',
                          )}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="font-display text-[1.75rem] uppercase leading-none">
                          {t(item.key)}
                        </span>
                        {active ? (
                          <span aria-hidden="true" className="ml-auto block h-2.5 w-2.5 self-center bg-accent" />
                        ) : null}
                      </NavLink>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {secondaryNav.map((item) => (
                <li key={item.to}>
                  <SheetClose asChild>
                    <NavLink
                      to={item.to}
                      className="block py-1 text-[0.8125rem] text-content-muted underline-offset-4 hover:text-content hover:underline"
                    >
                      {t(item.key)}
                    </NavLink>
                  </SheetClose>
                </li>
              ))}
            </ul>
            <div className="mt-7 border-t border-hairline pt-5">
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
