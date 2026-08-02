import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { routeTransition } from './variants';
import { useMotionPreferences } from './useMotionPreferences';
import { duration, ease } from './tokens';

/* ── Chunk-loading signal ──────────────────────────────────────────────
 *
 * The progress indicator shows exactly while a lazy route chunk is in flight —
 * no invented percentages and no minimum display time. `RouteFallback` flips
 * this on mount and off on unmount, so the bar is a true report of what the
 * application is doing.
 */

let loadingCount = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function beginRouteLoad(): () => void {
  loadingCount += 1;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    loadingCount = Math.max(0, loadingCount - 1);
    emit();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return loadingCount > 0;
}

export function useRouteLoading(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Called by the Suspense fallback for the lifetime of a chunk load. */
export function useReportRouteLoading(): void {
  useEffect(() => beginRouteLoad(), []);
}

/* ── The indicator ─────────────────────────────────────────────────────── */

/**
 * A perforation running along the top edge while a route chunk loads.
 *
 * Film moving through a gate, not a browser progress bar: a strip of sprocket
 * marks that travels, sized and coloured from the house tokens. It occupies no
 * layout space and disappears the moment the chunk resolves.
 */
export function RouteProgress() {
  const loading = useRouteLoading();
  const motion = useMotionPreferences();

  return (
    <AnimatePresence>
      {loading ? (
        <m.div
          key="route-progress"
          role="status"
          aria-label="Loading page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: duration.fast } }}
          transition={{ duration: duration.fast }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden"
        >
          <m.div
            className="h-full w-[200%]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, var(--marigold) 0 6px, transparent 6px 14px)',
            }}
            {...(motion.reduced
              ? { animate: { opacity: 0.7 } }
              : {
                  animate: { x: ['0%', '-50%'] },
                  transition: { duration: 0.9, ease: 'linear', repeat: Infinity },
                })}
          />
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ── Route transition ──────────────────────────────────────────────────── */

/**
 * Wraps the routed outlet so the outgoing view can leave before the next
 * arrives.
 *
 * Keyed by pathname only — a query-string change is a *filter* change, and
 * re-animating the whole page every time somebody ticks a genre would be
 * both slow and disorienting. Filter changes are animated in place instead.
 *
 * `mode="popLayout"` is deliberately not used: it takes the outgoing view out
 * of flow, which collapses the page height and fights scroll restoration.
 */
export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const motion = useMotionPreferences();

  const onExitComplete = useCallback(() => {
    // Scroll restoration is owned by the layout; this only makes sure the
    // browser is not mid-scroll when the incoming view measures itself.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('nokshi:route-settled'));
  }, []);

  if (motion.reduced) {
    return <div key={routeKey}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={onExitComplete}>
      <m.div
        key={routeKey}
        variants={routeTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: duration.route, ease: ease.entrance }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
