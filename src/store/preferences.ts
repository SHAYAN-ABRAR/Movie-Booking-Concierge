import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** Interface language. Not the same thing as a film's audio language. */
export type AppLocale = 'en' | 'bn';
export type AppTheme = 'light' | 'dark';

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['en', 'bn'];
export const DEFAULT_LOCALE: AppLocale = 'en';

export function isLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'bn';
}

export function isTheme(value: unknown): value is AppTheme {
  return value === 'light' || value === 'dark';
}

/**
 * The locale to use when the customer has never chosen one.
 *
 * Bangla only when the browser actually asks for it. Guessing from anything
 * else — a timezone, an IP — would be a worse default than English.
 */
export function detectLocale(): AppLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of languages) {
    if (typeof tag === 'string' && tag.toLowerCase().startsWith('bn')) return 'bn';
  }
  return DEFAULT_LOCALE;
}

/**
 * The theme to use when the customer has never chosen one.
 *
 * Read once, at first run. It is deliberately *not* a live subscription: once
 * somebody picks a theme here, the operating system changing at sunset must not
 * silently overrule them.
 */
export function detectTheme(): AppTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export interface AccessibilityPreferences {
  /** Prefer screenings with wheelchair spaces. */
  wheelchair: boolean;
  /** Prefer screenings with captions on screen. */
  openCaptions: boolean;
  /** Prefer seats near an aisle and close to the entrance. */
  reducedWalking: boolean;
  /** Prefer audio-described screenings. */
  audioDescription: boolean;
}

interface PreferencesState {
  /** The customer's chosen venue. Persists across the whole site. */
  cinemaId: string | null;
  /** Whether the location has been chosen deliberately or merely defaulted. */
  cinemaChosen: boolean;
  accessibility: AccessibilityPreferences;
  /** Whether the browser notification permission prompt has already been shown. */
  notificationPromptShown: boolean;
  /** Interface language. */
  locale: AppLocale;
  /** Light or dark appearance. */
  theme: AppTheme;
  /**
   * False until the customer picks a theme themselves. Until then the stored
   * theme is only the system's opinion, and re-reading the system on a later
   * visit is correct. After an explicit choice it never is.
   */
  themeChosen: boolean;
  /** False until the customer picks a language themselves. Same reasoning. */
  localeChosen: boolean;
  setCinema: (cinemaId: string | null, deliberate?: boolean) => void;
  setAccessibility: (patch: Partial<AccessibilityPreferences>) => void;
  markNotificationPromptShown: () => void;
  setLocale: (locale: AppLocale) => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  reset: () => void;
}

/** The shape persisted to storage. Actions are never written. */
type PersistedPreferences = Pick<
  PreferencesState,
  | 'cinemaId'
  | 'cinemaChosen'
  | 'accessibility'
  | 'notificationPromptShown'
  | 'locale'
  | 'theme'
  | 'themeChosen'
  | 'localeChosen'
>;

const defaultAccessibility: AccessibilityPreferences = {
  wheelchair: false,
  openCaptions: false,
  reducedWalking: false,
  audioDescription: false,
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      cinemaId: null,
      cinemaChosen: false,
      accessibility: defaultAccessibility,
      notificationPromptShown: false,
      locale: detectLocale(),
      theme: detectTheme(),
      themeChosen: false,
      localeChosen: false,
      setCinema: (cinemaId, deliberate = true) =>
        set((state) => ({ cinemaId, cinemaChosen: deliberate || state.cinemaChosen })),
      setAccessibility: (patch) =>
        set((state) => ({ accessibility: { ...state.accessibility, ...patch } })),
      markNotificationPromptShown: () => set({ notificationPromptShown: true }),
      setLocale: (locale) => set({ locale, localeChosen: true }),
      setTheme: (theme) => set({ theme, themeChosen: true }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark', themeChosen: true })),
      reset: () =>
        // Deliberately keeps `locale` and `theme`. "Reset" here means the
        // customer's *venue and access* choices; wrenching the interface back
        // into another language is not what anybody means by it.
        set((state) => ({
          cinemaId: null,
          cinemaChosen: false,
          accessibility: defaultAccessibility,
          notificationPromptShown: false,
          locale: state.locale,
          theme: state.theme,
        })),
    }),
    {
      name: 'nokshi.preferences.v1',
      version: 2,
      storage: createJSONStorage(() => localStorage),

      // Only real preferences are written. Actions were never meant to be
      // persisted and listing the fields explicitly keeps it that way.
      partialize: (state): PersistedPreferences => ({
        cinemaId: state.cinemaId,
        cinemaChosen: state.cinemaChosen,
        accessibility: state.accessibility,
        notificationPromptShown: state.notificationPromptShown,
        locale: state.locale,
        theme: state.theme,
        themeChosen: state.themeChosen,
        localeChosen: state.localeChosen,
      }),

      /**
       * v1 → v2 adds locale and theme. Every v1 field is carried through
       * untouched: a customer who had chosen Bashundhara and turned on captions
       * still has both after upgrading.
       */
      migrate: (persisted, version) => {
        const previous = (persisted ?? {}) as Partial<PersistedPreferences>;
        if (version >= 2) return previous as PersistedPreferences;
        return {
          ...previous,
          locale: detectLocale(),
          theme: detectTheme(),
          themeChosen: false,
          localeChosen: false,
        } as PersistedPreferences;
      },

      /**
       * Storage is not trustworthy — an older build, a half-finished write or a
       * browser extension can all leave a malformed record. Anything unreadable
       * falls back to a sane value rather than throwing during hydration.
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedPreferences>;
        const accessibility =
          saved.accessibility && typeof saved.accessibility === 'object'
            ? { ...defaultAccessibility, ...saved.accessibility }
            : defaultAccessibility;

        return {
          ...current,
          cinemaId: typeof saved.cinemaId === 'string' ? saved.cinemaId : null,
          cinemaChosen: saved.cinemaChosen === true,
          accessibility,
          notificationPromptShown: saved.notificationPromptShown === true,
          // A saved choice wins. Anything else re-reads the system, which is
          // what "no choice yet" should mean on every visit.
          locale: saved.localeChosen === true && isLocale(saved.locale) ? saved.locale : detectLocale(),
          theme: saved.themeChosen === true && isTheme(saved.theme) ? saved.theme : detectTheme(),
          themeChosen: saved.themeChosen === true,
          localeChosen: saved.localeChosen === true,
        };
      },
    },
  ),
);

export function hasAnyAccessibilityPreference(prefs: AccessibilityPreferences): boolean {
  return Object.values(prefs).some(Boolean);
}
