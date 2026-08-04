import { create } from 'zustand';

/**
 * Which trailer is open, application-wide.
 *
 * There is exactly one player in the tree, mounted once by `Layout`. Every
 * trigger — a movie card, the film page, the story panel, Max — asks this
 * store to show a film, and the single viewer renders it.
 *
 * Two reasons it is a store rather than local state per button:
 *
 *  1. **Max has no button to press.** A typed action executed from the
 *     concierge needs somewhere to say "show this film's trailer" without
 *     reaching into a component's `useState`.
 *  2. **Only one player can ever exist.** With per-button state, a card whose
 *     dialog was opened and then re-rendered under a filter change could leave
 *     a second iframe mounted. One viewer makes that unrepresentable.
 *
 * `returnFocusTo` remembers the element that opened it, because the trigger is
 * not always still mounted when the dialog closes — a card can disappear behind
 * a filter change while the trailer is playing.
 */
interface TrailerViewerState {
  movieId: string | null;
  returnFocusTo: HTMLElement | null;
  open: (movieId: string, trigger?: HTMLElement | null) => void;
  close: () => void;
}

export const useTrailerViewer = create<TrailerViewerState>((set, get) => ({
  movieId: null,
  returnFocusTo: null,

  open: (movieId, trigger = null) => set({ movieId, returnFocusTo: trigger }),

  close: () => {
    const { returnFocusTo } = get();
    set({ movieId: null, returnFocusTo: null });
    // After the dialog has unmounted, not during — focusing an element while
    // Radix is still restoring focus itself puts them in a fight.
    if (returnFocusTo?.isConnected) {
      requestAnimationFrame(() => returnFocusTo.focus());
    }
  },
}));
