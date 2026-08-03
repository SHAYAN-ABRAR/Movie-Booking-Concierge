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

/**
 * jsdom has no IntersectionObserver, and framer-motion's `whileInView` needs
 * one the moment its features are loaded.
 *
 * This only started mattering when `MotionProvider` moved to eager features:
 * with the old async loader the features never resolved inside a test, so every
 * `whileInView` was silently inert and the tests were not exercising the code
 * that actually ships. They are now.
 *
 * Entries report as intersecting straight away, which is the state a reveal
 * assertion cares about — content must be present, not hidden behind a scroll.
 */
if (!('IntersectionObserver' in window)) {
  class TestIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '0px';
    readonly thresholds: readonly number[] = [0];
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 1,
            time: 0,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
          } as IntersectionObserverEntry,
        ],
        this,
      );
    }

    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: TestIntersectionObserver,
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: TestIntersectionObserver,
  });
}
