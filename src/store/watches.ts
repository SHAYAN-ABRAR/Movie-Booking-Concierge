import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hashString } from '@/lib/deterministic';

/**
 * Local demonstration alerts.
 *
 * These do not monitor anything. There is no server, no polling and no live
 * inventory. A watch stores what the customer asked to be told about, and the
 * app fires a small number of *deterministic, clearly-labelled demo events*
 * so the alert behaviour can actually be seen working.
 *
 * Nothing is emailed, texted, or sent to another device, and a watch cannot
 * survive the browser's storage being cleared. Every surface that shows a
 * watch says so.
 */

export type WatchKind = 'price-drop' | 'premium-seat' | 'adjacent-seats' | 'accessible-seat';

export const watchKindLabels: Record<WatchKind, string> = {
  'price-drop': 'Price drop',
  'premium-seat': 'Premium seat opening',
  'adjacent-seats': 'Seats together',
  'accessible-seat': 'Accessible seat opening',
};

export const watchKindBlurbs: Record<WatchKind, string> = {
  'price-drop': 'Tells you if the sample price for this screening goes down.',
  'premium-seat': 'Tells you if a premium or recliner seat frees up.',
  'adjacent-seats': 'Tells you if enough seats together come back into the map.',
  'accessible-seat': 'Tells you if a wheelchair space or companion seat frees up.',
};

export interface Watch {
  id: string;
  kind: WatchKind;
  showtimeId: string;
  movieId: string;
  cinemaId: string;
  date: string;
  time: string;
  /** Party size, for the seats-together watch. */
  partySize?: number;
  /** The price recorded when the watch was created, for the price-drop watch. */
  referencePrice?: number;
  createdAt: string;
  /** Whether a demo event has already fired for this watch. */
  fired: boolean;
}

export interface Alert {
  id: string;
  watchId: string;
  kind: WatchKind;
  title: string;
  body: string;
  showtimeId: string;
  createdAt: string;
  read: boolean;
}

interface WatchState {
  watches: Watch[];
  alerts: Alert[];
  /** Whether the customer opted into browser notifications. Asked once only. */
  browserNotifications: boolean;
  addWatch: (watch: Omit<Watch, 'id' | 'createdAt' | 'fired'>) => Watch;
  removeWatch: (id: string) => void;
  markFired: (id: string) => void;
  pushAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'read'>) => void;
  markAlertRead: (id: string) => void;
  markAllRead: () => void;
  dismissAlert: (id: string) => void;
  setBrowserNotifications: (value: boolean) => void;
  clearAll: () => void;
}

let sequence = 0;
function makeId(prefix: string, seed: string): string {
  sequence += 1;
  return `${prefix}-${hashString(`${seed}|${sequence}`).toString(36)}`;
}

export const useWatches = create<WatchState>()(
  persist(
    (set, get) => ({
      watches: [],
      alerts: [],
      browserNotifications: false,

      addWatch: (input) => {
        const existing = get().watches.find(
          (w) => w.kind === input.kind && w.showtimeId === input.showtimeId,
        );
        if (existing) return existing;
        const watch: Watch = {
          ...input,
          id: makeId('watch', `${input.kind}|${input.showtimeId}`),
          createdAt: new Date().toISOString(),
          fired: false,
        };
        set((state) => ({ watches: [watch, ...state.watches] }));
        return watch;
      },

      removeWatch: (id) =>
        set((state) => ({
          watches: state.watches.filter((w) => w.id !== id),
          alerts: state.alerts.filter((a) => a.watchId !== id),
        })),

      markFired: (id) =>
        set((state) => ({ watches: state.watches.map((w) => (w.id === id ? { ...w, fired: true } : w)) })),

      pushAlert: (input) =>
        set((state) => ({
          alerts: [
            {
              ...input,
              id: makeId('alert', `${input.watchId}|${input.title}`),
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.alerts,
          ].slice(0, 30),
        })),

      markAlertRead: (id) =>
        set((state) => ({ alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) })),

      markAllRead: () => set((state) => ({ alerts: state.alerts.map((a) => ({ ...a, read: true })) })),

      dismissAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

      setBrowserNotifications: (browserNotifications) => set({ browserNotifications }),

      clearAll: () => set({ watches: [], alerts: [] }),
    }),
    {
      name: 'nokshi.watches.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function unreadAlertCount(alerts: Alert[]): number {
  return alerts.filter((a) => !a.read).length;
}
