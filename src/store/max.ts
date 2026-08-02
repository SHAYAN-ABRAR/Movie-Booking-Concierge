import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hashString } from '@/lib/deterministic';
import type { MaxMessage } from '@/max/types';

/**
 * Max's conversation state.
 *
 * Persisted to *sessionStorage* rather than localStorage: a conversation is
 * useful across a reload but should not outlive the visit. Nothing here is
 * ever transmitted.
 */

interface MaxState {
  open: boolean;
  messages: MaxMessage[];
  status: 'idle' | 'thinking';
  /** Set when the customer opts into the local Ollama phrasing layer. */
  useOllama: boolean;
  /** Whether a local Ollama daemon was found. Controls whether we offer it. */
  ollamaAvailable: boolean;
  ollamaModels: string[];
  /** Unread assistant replies while the panel is closed. */
  unread: number;

  setOpen: (open: boolean) => void;
  push: (message: Omit<MaxMessage, 'id' | 'createdAt'>) => MaxMessage;
  setStatus: (status: MaxState['status']) => void;
  setOllama: (value: boolean) => void;
  setOllamaAvailability: (available: boolean, models: string[]) => void;
  clearConversation: () => void;
  markRead: () => void;
}

let sequence = 0;

export const useMax = create<MaxState>()(
  persist(
    (set) => ({
      open: false,
      messages: [],
      status: 'idle',
      useOllama: false,
      ollamaAvailable: false,
      ollamaModels: [],
      unread: 0,

      setOpen: (open) => set((state) => ({ open, unread: open ? 0 : state.unread })),

      push: (input) => {
        sequence += 1;
        const message: MaxMessage = {
          ...input,
          id: `m-${hashString(`${input.role}|${input.text}|${sequence}`).toString(36)}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          messages: [...state.messages, message].slice(-60),
          unread:
            input.role === 'assistant' && !state.open ? state.unread + 1 : state.unread,
        }));
        return message;
      },

      setStatus: (status) => set({ status }),
      setOllama: (useOllama) => set({ useOllama }),
      setOllamaAvailability: (ollamaAvailable, ollamaModels) =>
        set((state) => ({
          ollamaAvailable,
          ollamaModels,
          // Never leave the toggle on when the daemon has gone away.
          useOllama: ollamaAvailable ? state.useOllama : false,
        })),

      clearConversation: () => set({ messages: [], status: 'idle', unread: 0 }),
      markRead: () => set({ unread: 0 }),
    }),
    {
      name: 'nokshi.max.v1',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        messages: state.messages,
        useOllama: state.useOllama,
      }),
    },
  ),
);
