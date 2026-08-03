import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '@/components/ui/popover';
import { SkipLink } from '@/components/common';
import { Header } from './Header';
import { Footer } from './Footer';
import { MaxDock } from '@/components/max/MaxDock';
import { DemoAlertRunner } from '@/components/max/DemoAlertRunner';
import { MotionProvider, PageTransition, RouteProgress } from '@/motion';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';
import { usePreferenceEffects } from '@/components/preferences/usePreferenceEffects';
import { PreferenceAnnouncer } from '@/components/preferences/PreferenceAnnouncer';
import { useRouteTitle } from './useRouteTitle';

/** Returns to the top on navigation, unless the browser is restoring a position. */
function ScrollRestoration() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}

/**
 * Announces the new page to assistive technology after a route change.
 *
 * Focus is deliberately *not* moved: shifting it to `main` makes a screen
 * reader re-read the whole page on every navigation, which is worse than the
 * problem it solves. A polite announcement of the page's own heading tells the
 * user where they are without interrupting or relocating them.
 */
function RouteAnnouncer() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Wait for the incoming route to commit its heading.
    const timer = window.setTimeout(() => {
      const heading = document.querySelector('main h1');
      const title = heading?.textContent?.trim();
      setMessage(title ? t('a11y.pageLoaded', { title }) : t('a11y.pageLoadedFallback'));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [pathname, t]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export function Layout() {
  // Keeps <html lang>, data-theme, color-scheme and the theme-colour meta in
  // step with the store, and runs the short colour transition on an explicit
  // toggle only.
  usePreferenceEffects();

  // `<title>`, per route, in the active language.
  useRouteTitle();

  /*
   * Subscribing here is load-bearing beyond the strings in this file.
   *
   * The domain vocabularies in `@/i18n/domain` are read-through proxies rather
   * than hooks, so the seventy-odd `genreLabels[g]`-style call sites keep
   * working — but a proxy read is not a subscription. This `useTranslation()`
   * is what re-renders the tree on a language change, and every route is a
   * child of this component. `preferences.test.tsx` fails if it is removed.
   */
  useTranslation();

  const location = useLocation();
  const outlet = useOutlet();

  // Keyed by pathname only. A query-string change is a filter change — those
  // animate in place, and re-running a page transition for every ticked
  // checkbox would be both slow and disorienting.
  const routeKey = location.pathname;

  return (
    <MotionProvider>
      <TooltipProvider delayDuration={250} skipDelayDuration={400}>
        <ScrollRestoration />
        <RouteAnnouncer />
        <PreferenceAnnouncer />
        <RouteProgress />
        <SkipLink />
        <div className="relative z-10 flex min-h-dvh flex-col">
          <Header />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            <AppErrorBoundary resetKey={routeKey}>
              <PageTransition routeKey={routeKey}>{outlet}</PageTransition>
            </AppErrorBoundary>
          </main>
          <Footer />
        </div>
        <MaxDock />
        <DemoAlertRunner />
      </TooltipProvider>
    </MotionProvider>
  );
}
