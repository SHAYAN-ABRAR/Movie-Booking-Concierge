import { useEffect, useSyncExternalStore } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { routeTransition } from './variants';
import { useMotionPreferences } from './useMotionPreferences';
import { duration, ease } from './tokens';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const loading = useRouteLoading();
  const motion = useMotionPreferences();

  return (
    <AnimatePresence>
      {loading ? (
        <m.div
          key="route-progress"
          role="status"
          aria-label={t('loading.page')}
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
                'repeating-linear-gradient(to right, var(--signal) 0 6px, transparent 6px 14px)',
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
 * Wraps the routed outlet with an **incoming-only** transition.
 *
 * Keyed by pathname only — a query-string change is a *filter* change, and
 * re-animating the whole page every time somebody ticks a genre would be both
 * slow and disorienting. Filter changes are animated in place instead.
 *
 * ── Why there is no `AnimatePresence` here ──────────────────────────────
 *
 * There used to be one, with `mode="wait"`, and it broke every in-app
 * navigation in the product: the outgoing route animated to `opacity: 0` and
 * was then never removed, so the incoming route never mounted and the outlet
 * showed a fully-transparent copy of the previous page forever. That is the
 * "blank booking confirmation" defect — it was never specific to confirmation,
 * it was every link in the application.
 *
 * The trigger was `LazyMotion` loading its feature bundle asynchronously (see
 * MotionProvider). But the deeper problem is the shape: an exit-wait transition
 * around the routed outlet means a single missed completion callback empties
 * the page with no way back. An entrance-only transition cannot do that — the
 * incoming route is mounted by React immediately and merely animates in, so the
 * worst a motion failure can cost is the animation itself.
 *
 * Route transitions are not worth a page that can vanish.
 */
export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const motion = useMotionPreferences();

  if (motion.reduced) {
    return <div key={routeKey}>{children}</div>;
  }

  return (
    <m.div
      // Remounting on the key is what replays the entrance. The variants object
      // still carries an `exit` state; with no AnimatePresence above it, it is
      // simply never used.
      key={routeKey}
      variants={routeTransition}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.route, ease: ease.entrance }}
    >
      {children}
    </m.div>
  );
}
