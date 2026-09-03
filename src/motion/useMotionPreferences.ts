import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { duration, spring, tween } from './tokens';
import type { ease } from './tokens';
import type { DurationToken, SpringToken } from './tokens';

/**
 * Motion preferences.
 *
 * The global CSS `0.01ms` override handles CSS transitions, but it cannot
 * change *logic* — whether a hero auto-advances, whether a parallax listener is
 * attached, whether an animated number counts or just prints. Anything that
 * changes behaviour rather than appearance asks this hook.
 */
export function useMotionPreferences() {
  const reducedRaw = useReducedMotion();
  const reduced = reducedRaw === true;

  return {
    reduced,

    /** A tween that collapses to nothing when reduced motion is on. */
    tween(token: DurationToken = 'base', curve: keyof typeof ease = 'editorial', delay = 0): Transition {
      if (reduced) return { duration: 0 };
      return tween(token, curve, delay);
    },

    /** A spring that degrades to an instant change when reduced motion is on. */
    spring(token: SpringToken = 'surface'): Transition {
      if (reduced) return { duration: 0 };
      return spring[token];
    },

    /** Picks between a motion value and its reduced-motion equivalent. */
    pick<T>(motionValue: T, reducedValue: T): T {
      return reduced ? reducedValue : motionValue;
    },

    /** Stagger step, always 0 under reduced motion. */
    stagger(step: number): number {
      return reduced ? 0 : step;
    },

    /** Raw duration in seconds, 0 under reduced motion. */
    seconds(token: DurationToken): number {
      return reduced ? 0 : duration[token];
    },
  };
}

/**
 * True while the tab is actually visible.
 *
 * Every ambient animation — the hero sequence, the steel drift, the
 * showtimes clock — gates on this, so a backgrounded tab does no work.
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden,
  );

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

/**
 * True on devices with a precise pointer.
 *
 * Pointer-tracking effects attach only when this is true, so touch devices
 * never pay for a listener they cannot trigger.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(pointer: fine)');
    const onChange = (event: MediaQueryListEvent) => setFine(event.matches);
    setFine(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return fine;
}
