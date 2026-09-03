import { useEffect, useRef } from 'react';
import { usePreferences } from '@/store/preferences';
import type { AppTheme } from '@/store/preferences';

/**
 * Keeps the document in step with the stored preferences.
 *
 * The pre-paint script in `index.html` stamps `lang`, `data-theme`,
 * `color-scheme` and the theme-colour meta before React exists. This takes over
 * afterwards, so a toggle changes the same four things the bootstrap set.
 *
 * It never *reads* the DOM to decide anything — the store is the single source
 * of truth and the DOM is its output.
 */

const THEME_COLOR: Record<AppTheme, string> = {
  light: '#EAE6DE',
  dark: '#0E0E10',
};

/** How long the colour-transition class stays on. Matches globals.css. */
const TRANSITION_MS = 200;

export function usePreferenceEffects() {
  const locale = usePreferences((s) => s.locale);
  const theme = usePreferences((s) => s.theme);

  // The first run is the hydration pass, where the DOM already matches what the
  // bootstrap wrote. Transitioning then would fade the page in on load.
  const settled = useRef(false);
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    const alreadyCorrect = root.getAttribute('data-theme') === theme;

    // Only animate a *change* the customer asked for, and only when they have
    // not asked for less motion.
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (settled.current && !alreadyCorrect && !reduced) {
      root.classList.add('theme-transition');
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(() => {
        root.classList.remove('theme-transition');
        transitionTimer.current = null;
      }, TRANSITION_MS);
    }

    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[theme]);

    settled.current = true;
  }, [theme]);

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      document.documentElement.classList.remove('theme-transition');
    },
    [],
  );
}
