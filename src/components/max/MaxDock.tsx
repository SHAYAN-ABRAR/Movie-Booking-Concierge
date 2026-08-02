import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { MaxMark } from '@/components/brand/Logo';
import { Sheet, SheetContent } from '@/components/ui/overlay';
import { useMax } from '@/store/max';
import { useBooking } from '@/store/booking';
import { useActiveSeconds, useIsDesktop, useSessionFlag } from '@/hooks';
import { useMotionPreferences } from '@/motion';
import { ease, spring } from '@/motion/tokens';
import { cn } from '@/lib/utils';

/**
 * Max's engine — the language pipeline, the skills and the block renderers —
 * is a few tens of kilobytes that nobody needs before they ask a question. The
 * launcher ships in the entry chunk; the panel arrives when it is opened.
 */
const MaxPanel = lazy(() => import('./MaxPanel').then((mod) => ({ default: mod.MaxPanel })));

function PanelFallback() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-content-muted">
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      <span>Opening Max…</span>
    </div>
  );
}

const NUDGE_AFTER_SECONDS = 120;

/**
 * The Max dock: launcher, nudge and panel.
 *
 * Desktop opens a non-modal anchored panel so the page behind stays readable
 * and usable — the point of a concierge is that you can act on what it says.
 * Mobile opens a modal bottom sheet, because a side panel on a phone is just a
 * worse full-screen dialog.
 */
export function MaxDock() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isDesktop = useIsDesktop();

  const open = useMax((s) => s.open);
  const setOpen = useMax((s) => s.setOpen);
  const unread = useMax((s) => s.unread);

  const bookingStep = useBooking((s) => s.step);
  const seatIds = useBooking((s) => s.seatIds);
  const counts = useBooking((s) => s.counts);

  const launcherRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const motion = useMotionPreferences();

  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [nudgeDone, markNudgeDone] = useSessionFlag('nokshi.max.nudge');
  const activeSeconds = useActiveSeconds(!nudgeDone);

  /**
   * One light sweep across the launcher, and only when something genuinely
   * new has arrived: the nudge appearing, or an unread reply landing while
   * the panel is closed. It runs once per event and never loops — a control
   * that pulses forever is asking for attention it has not earned.
   */
  const [sweep, setSweep] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);
  const previousUnread = useRef(unread);

  useEffect(() => {
    const gainedUnread = unread > previousUnread.current;
    previousUnread.current = unread;
    if (!gainedUnread && !nudgeVisible) return;
    if (open) return;

    setSweepKey((key) => key + 1);
    setSweep(true);
    const timer = window.setTimeout(() => setSweep(false), 950);
    return () => window.clearTimeout(timer);
  }, [unread, nudgeVisible, open]);

  /* ── Deep link: ?max=open ─────────────────────────────────────────── */
  useEffect(() => {
    if (params.get('max') === 'open' && !open) {
      setOpen(true);
      const next = new URLSearchParams(params);
      next.delete('max');
      setParams(next, { replace: true });
    }
  }, [params, open, setOpen, setParams]);

  /* ── Restore focus to the launcher when the panel closes ──────────── */
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  /**
   * Whether it is a safe moment to show an unsolicited nudge.
   *
   * Not while a dialog or drawer is up, not while someone is typing their
   * details, not during the payment step, and not while the seat map is short
   * of seats — interrupting any of those is exactly the behaviour the nudge is
   * supposed to avoid.
   */
  const isSafeMoment = useCallback((): boolean => {
    if (open) return false;

    const modalOpen = document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
    );
    if (modalOpen) return false;

    const inWizard = location.pathname.startsWith('/booking/');
    if (inWizard) {
      if (bookingStep === 'guest' || bookingStep === 'payment') return false;
      const ticketCount = counts.child + counts.adult + counts.senior + counts.student;
      if (bookingStep === 'seats' && seatIds.length !== ticketCount) return false;
    }

    return true;
  }, [open, location.pathname, bookingStep, counts, seatIds.length]);

  /* ── The single, deferred nudge ───────────────────────────────────── */
  useEffect(() => {
    if (nudgeDone || nudgeVisible || open) return;
    if (activeSeconds < NUDGE_AFTER_SECONDS) return;

    // The threshold may land mid-checkout; hold it until the next safe state
    // rather than dropping it or interrupting.
    if (!isSafeMoment()) return;

    setNudgeVisible(true);
  }, [activeSeconds, nudgeDone, nudgeVisible, open, isSafeMoment, location.pathname, bookingStep]);

  useEffect(() => {
    if (open && nudgeVisible) {
      setNudgeVisible(false);
      markNudgeDone();
    }
  }, [open, nudgeVisible, markNudgeDone]);

  function dismissNudge() {
    setNudgeVisible(false);
    markNudgeDone();
  }

  // The booking wizard and the film page both carry a sticky action bar on
  // small screens; the launcher steps above it rather than sitting on top.
  const hasStickyBar =
    location.pathname.startsWith('/booking/') || /^\/movies\/[^/]+$/.test(location.pathname);

  return (
    <div
      data-print="hide"
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden',
        // The sticky action bars are themselves `lg:hidden`, so the lift is
        // removed again at the breakpoint where they stop existing.
        'pb-[calc(max(1rem,var(--safe-b))+var(--dock-lift))] pr-[max(1rem,var(--safe-r))]',
        'lg:pb-[max(1rem,var(--safe-b))]',
      )}
      style={{ '--dock-lift': hasStickyBar ? '4.25rem' : '0rem' } as React.CSSProperties}
    >
      <div className="shell flex justify-end">
        <div className="pointer-events-auto flex max-w-full flex-col items-end gap-2">
          {/* ── Nudge ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {nudgeVisible && !open ? (
              <m.div
                role="status"
                aria-live="polite"
                initial={motion.reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={motion.reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: motion.reduced ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'relative max-w-[min(20rem,calc(100vw-2rem))] border-2 border-ink bg-paper-raised p-3.5 pr-9',
                  'shadow-[0_16px_40px_-16px_rgb(20_22_31_/_0.4)]',
                )}
              >
                <p className="text-[0.9375rem] font-semibold leading-snug text-ink">
                  Finding it hard to book? Ask me — I can help.
                </p>
                <p className="mt-1 text-[0.8125rem] leading-5 text-ink-muted">
                  I can find movies, compare showtimes and help you choose seats.
                </p>
                <button
                  type="button"
                  onClick={dismissNudge}
                  aria-label="Dismiss this message"
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center text-ink-muted transition-colors hover:bg-ink/10 hover:text-ink"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[7px] right-8 size-3 rotate-45 border-b-2 border-r-2 border-ink bg-paper-raised"
                />
              </m.div>
            ) : null}
          </AnimatePresence>

          {/* ── Desktop panel: anchored, non-modal ────────────────── */}
          <AnimatePresence>
            {open && isDesktop ? (
              <m.aside
                role="complementary"
                aria-labelledby={headingId}
                initial={motion.reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={motion.reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: motion.reduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'flex h-[min(38rem,calc(100dvh-8rem))] w-[26rem] max-w-[calc(100vw-2rem)] flex-col',
                  'border-2 border-ink bg-surface',
                  'shadow-[0_24px_64px_-24px_rgb(20_22_31_/_0.45)]',
                )}
              >
                <Suspense fallback={<PanelFallback />}>
                  <MaxPanel onClose={() => setOpen(false)} headingId={headingId} />
                </Suspense>
              </m.aside>
            ) : null}
          </AnimatePresence>

          {/* ── Launcher ──────────────────────────────────────────────
              Physical rather than decorative: it presses 1px under the
              pointer, lifts on hover, and settles with a spring when it moves
              above a sticky action bar. The one light sweep fires only when
              there is genuinely something new — never on a loop. */}
          <m.button
            ref={launcherRef}
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={
              unread > 0 ? `Ask Max — ${unread} new ${unread === 1 ? 'reply' : 'replies'}` : 'Ask Max'
            }
            layout={motion.reduced ? false : 'position'}
            transition={motion.reduced ? { duration: 0 } : spring.marker}
            whileHover={motion.reduced ? undefined : { y: -2 }}
            whileTap={motion.reduced ? undefined : { y: 1, scale: 0.985 }}
            className={cn(
              'group relative inline-flex min-h-11 items-center gap-2.5 overflow-hidden border-2 border-ink px-3.5 py-2.5',
              'font-sans text-sm font-semibold',
              'transition-[background-color,color,box-shadow] duration-[--dur-fast]',
              open
                ? 'bg-ink text-paper shadow-[0_6px_18px_-10px_rgb(20_22_31_/_0.5)]'
                : 'bg-paper-raised text-ink shadow-[0_10px_30px_-12px_rgb(20_22_31_/_0.45)] hover:bg-ink hover:text-paper hover:shadow-[0_16px_34px_-14px_rgb(20_22_31_/_0.55)]',
            )}
          >
            {/* A single projected sweep when something new has arrived. */}
            {sweep && !motion.reduced ? (
              <m.span
                aria-hidden="true"
                key={sweepKey}
                initial={{ x: '-120%' }}
                animate={{ x: '120%' }}
                transition={{ duration: 0.9, ease: ease.projection }}
                className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-marigold/35 to-transparent"
              />
            ) : null}

            <MaxMark className="relative size-6 text-[0.875rem]" tone={open ? 'inverse' : 'default'} />
            <span className="relative">{open ? 'Close Max' : 'Ask Max'}</span>
            {unread > 0 && !open ? (
              <m.span
                aria-hidden="true"
                initial={motion.reduced ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={motion.reduced ? { duration: 0 } : spring.press}
                className="numeral relative grid min-w-[1.15rem] place-items-center bg-marigold px-1 text-[0.6875rem] font-bold leading-[1.15rem] text-paper"
              >
                {unread}
              </m.span>
            ) : null}
          </m.button>
        </div>
      </div>

      {/* ── Mobile panel: modal bottom sheet ─────────────────────── */}
      {!isDesktop ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            showClose={false}
            aria-labelledby={headingId}
            className="h-[88dvh] max-h-[88dvh] p-0"
          >
            <Suspense fallback={<PanelFallback />}>
              <MaxPanel onClose={() => setOpen(false)} headingId={headingId} />
            </Suspense>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
