import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    target: 'es2022',
    cssTarget: 'chrome111',
    // `manualChunks` is deliberately NOT configured.
    //
    // The previous hand-rolled splitter produced a circular chunk graph —
    // `react-vendor` imported `vendor` (via scheduler) while `vendor` imported
    // `react-vendor` (via react). Rollup cannot order a cycle, so on load one
    // side evaluated with the other still undefined and the app died at
    // `Cannot read properties of undefined (reading 'useLayoutEffect')` with an
    // empty #root. The production bundle never booted.
    //
    // Rollup's default chunking is cycle-free by construction and still splits
    // every dynamic import — the lazy routes and LazyMotion's feature bundle
    // are unaffected. A hand-tuned splitter is not worth a bundle that does not
    // start; see docs/booking-confirmation-root-cause.md.
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
