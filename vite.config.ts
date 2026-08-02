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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // framer-motion is deliberately handed back to Rollup rather than
          // named here. `LazyMotion` dynamically imports its feature bundle,
          // and claiming framer-motion for any manual chunk — including the
          // catch-all `vendor` below — merges that import back into the eager
          // graph and undoes the split. Returning undefined lets Rollup put
          // the ~30 KB feature bundle in its own async chunk.
          if (id.includes('framer-motion')) return undefined;
          if (id.includes('qrcode')) return 'qrcode';
          if (id.includes('@fontsource')) return 'fonts';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('react-hook-form') || id.includes('/zod/') || id.includes('@hookform')) {
            return 'forms';
          }
          if (id.includes('date-fns')) return 'dates';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
            return 'react-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
