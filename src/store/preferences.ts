import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  setCinema: (cinemaId: string | null, deliberate?: boolean) => void;
  setAccessibility: (patch: Partial<AccessibilityPreferences>) => void;
  markNotificationPromptShown: () => void;
  reset: () => void;
}

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
      setCinema: (cinemaId, deliberate = true) =>
        set((state) => ({ cinemaId, cinemaChosen: deliberate || state.cinemaChosen })),
      setAccessibility: (patch) =>
        set((state) => ({ accessibility: { ...state.accessibility, ...patch } })),
      markNotificationPromptShown: () => set({ notificationPromptShown: true }),
      reset: () =>
        set({
          cinemaId: null,
          cinemaChosen: false,
          accessibility: defaultAccessibility,
          notificationPromptShown: false,
        }),
    }),
    {
      name: 'nokshi.preferences.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function hasAnyAccessibilityPreference(prefs: AccessibilityPreferences): boolean {
  return Object.values(prefs).some(Boolean);
}
