import { useEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/popover';
import { SkipLink } from '@/components/common';
import { Header } from './Header';
import { Footer } from './Footer';
import { MaxDock } from '@/components/max/MaxDock';
import { DemoAlertRunner } from '@/components/max/DemoAlertRunner';
import { MotionProvider, PageTransition, RouteProgress } from '@/motion';
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary';

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
      setMessage(title ? `${title}. Page loaded.` : 'Page loaded.');
    }, 220);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export function Layout() {
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
