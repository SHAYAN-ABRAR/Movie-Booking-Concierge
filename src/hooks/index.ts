import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 64rem)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Counts seconds the customer is actually *on* the page.
 *
 * The timer pauses whenever the tab is hidden, so a site left open in a
 * background tab never crosses the threshold. Used for Max's single nudge.
 */
export function useActiveSeconds(enabled = true): number {
  const [seconds, setSeconds] = useState(0);
  const accumulated = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let interval: number | undefined;

    const tick = () => {
      accumulated.current += 1;
      setSeconds(accumulated.current);
    };

    const start = () => {
      if (interval === undefined) interval = window.setInterval(tick, 1000);
    };
    const stop = () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  return seconds;
}

/** Reads and writes a value in sessionStorage, surviving reloads but not tabs. */
export function useSessionFlag(key: string): [boolean, () => void] {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });

  const set = useCallback(() => {
    setValue(true);
    try {
      window.sessionStorage.setItem(key, '1');
    } catch {
      // Storage can be unavailable in private modes; the flag simply won't persist.
    }
  }, [key]);

  return [value, set];
}

/** Tracks whether an element can scroll further left or right. */
export function useRailScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ canLeft: false, canRight: false, progress: 0 });

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setState({
      canLeft: node.scrollLeft > 4,
      canRight: node.scrollLeft < max - 4,
      progress: max <= 0 ? 0 : node.scrollLeft / max,
    });
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [measure]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(240, node.clientWidth * 0.8), behavior: 'smooth' });
  }, []);

  return { ref, ...state, scrollBy, measure };
}

/** Announces a message to assistive technology without stealing focus. */
export function useAnnouncer() {
  const [message, setMessage] = useState('');
  const announce = useCallback((text: string) => {
    // Re-setting an identical string would not be re-announced, so nudge it.
    setMessage((previous) => (previous === text ? `${text} ` : text));
  }, []);
  return { message, announce };
}

/** Debounces a rapidly-changing value, for search inputs. */
export function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** True once the component has mounted — for deferring client-only work. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Minutes since local midnight, ticking while the tab is visible.
 *
 * The showtimes page is about time, so it needs to actually know the time.
 * One interval is shared by every consumer through React's own batching, it
 * pauses when the tab is hidden, and it ticks once a minute rather than once a
 * second — a screening does not change status inside sixty seconds.
 */
export function useNowMinutes(): number {
  const read = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };
  const [minutes, setMinutes] = useState(read);

  useEffect(() => {
    let interval: number | undefined;

    const start = () => {
      if (interval === undefined) {
        setMinutes(read());
        interval = window.setInterval(() => setMinutes(read()), 60_000);
      }
    };
    const stop = () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return minutes;
}

/** A stable id for wiring labels and descriptions together. */
export function useId(prefix: string): string {
  return useMemo(() => `${prefix}-${Math.random().toString(36).slice(2, 9)}`, [prefix]);
}
