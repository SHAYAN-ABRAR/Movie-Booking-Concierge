import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/popover';
import { SkipLink } from '@/components/common';
import { Header } from './Header';
import { Footer } from './Footer';
import { MaxDock } from '@/components/max/MaxDock';
import { DemoAlertRunner } from '@/components/max/DemoAlertRunner';

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

export function Layout() {
  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={400}>
      <ScrollRestoration />
      <SkipLink />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          <Outlet />
        </main>
        <Footer />
      </div>
      <MaxDock />
      <DemoAlertRunner />
    </TooltipProvider>
  );
}
