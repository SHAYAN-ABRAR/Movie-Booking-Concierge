import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './resources/en';
import { bn } from './resources/bn';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, usePreferences } from '@/store/preferences';
import type { AppLocale } from '@/store/preferences';

/**
 * Localization.
 *
 * Resources are **bundled and initialised synchronously**. That is a deliberate
 * constraint, not a shortcut: an async backend would make the first render
 * suspend, and this application has already shipped one defect where the routed
 * outlet could be empty. Nothing here is allowed to make a route wait.
 *
 * There is no detection plugin either — the preference store already decides
 * the locale (saved choice, else browser language) and stays the single source
 * of truth. i18next just renders what the store says.
 */

export const defaultNS = 'translation' as const;

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bn: { translation: bn },
  },
  lng: usePreferences.getState().locale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...SUPPORTED_LOCALES],
  defaultNS,
  interpolation: {
    // React escapes for us; double-escaping mangles apostrophes and quotes.
    escapeValue: false,
  },
  returnNull: false,
  // A raw key must never reach the interface. In development this shouts;
  // in production the English string is served instead.
  parseMissingKeyHandler: (key) => {
    if (import.meta.env.DEV) console.error(`i18n: missing key "${key}"`);
    return key;
  },
});

/** Keeps i18next in step with the store. Called once, at module load. */
usePreferences.subscribe((state, previous) => {
  if (state.locale !== previous.locale) void i18next.changeLanguage(state.locale);
});

export function currentLocale(): AppLocale {
  return usePreferences.getState().locale;
}

export { i18next };
