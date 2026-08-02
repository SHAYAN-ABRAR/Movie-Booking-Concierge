import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Node 26 exposes a global `localStorage` that is inert unless the runtime is
 * started with `--localstorage-file`, and it shadows jsdom's implementation.
 * The stores genuinely depend on Web Storage, so install a real in-memory one.
 */
function installStorage(key: 'localStorage' | 'sessionStorage') {
  const existing = (window as unknown as Record<string, unknown>)[key];
  if (existing && typeof (existing as Storage).clear === 'function') return;

  const map = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (name) => map.get(name) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (name) => void map.delete(name),
    setItem: (name, value) => void map.set(name, String(value)),
  };

  Object.defineProperty(window, key, { configurable: true, writable: true, value: storage });
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: storage });
}

installStorage('localStorage');
installStorage('sessionStorage');

afterEach(() => {
  cleanup();
  window.localStorage?.clear();
  window.sessionStorage?.clear();
});

// jsdom implements neither of these, and the app queries both.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!window.scrollTo) {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() });
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
