#!/usr/bin/env node
/**
 * Dead utility-class check.
 *
 * Tailwind silently drops a utility whose token was never registered in the
 * theme. `text-house-muted` compiles to nothing at all if `--color-house-muted`
 * is missing — the element just inherits, and the page looks *almost* right.
 * That is exactly what happened to the whole auditorium: three tokens
 * (`house-muted`, `house-faint`, `house-rule`) were used across the seat map,
 * the confirmation ticket and the no-trailer screen without ever being
 * registered, so twenty-odd elements fell back to `currentColor` and the
 * auditorium rendered flat and over-bright for the life of the project.
 *
 * Nothing in typecheck, lint or the test suite can see that. This can: it reads
 * the built stylesheet and asserts that every colour-bearing class written in
 * `src/` actually produced a rule.
 *
 * Runs after `vite build`, because it needs the emitted CSS.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const distAssets = join(root, 'dist', 'assets');

if (!existsSync(distAssets)) {
  console.error('check:classes — dist/assets not found. Run `npm run build` first.');
  process.exit(1);
}

const cssFiles = readdirSync(distAssets).filter((f) => f.endsWith('.css'));
if (cssFiles.length === 0) {
  console.error('check:classes — no stylesheet in dist/assets.');
  process.exit(1);
}
const css = cssFiles.map((f) => readFileSync(join(distAssets, f), 'utf8')).join('\n');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(p);
  }
  return out;
}

/** Prefixes that resolve through the colour palette, and so can die silently. */
const COLOUR_PREFIX =
  /^(?:text|bg|border|fill|stroke|ring|outline|decoration|divide|shadow|accent|caret|from|via|to)-/;

/** Classes that legitimately resolve without a palette token. */
const ALLOWED = new Set([
  'text-center',
  'text-left',
  'text-right',
  'text-balance',
  'text-pretty',
  'text-wrap',
  'text-nowrap',
  'border-solid',
  'border-dashed',
  'border-dotted',
  'border-collapse',
  'border-separate',
  'bg-none',
  'bg-cover',
  'bg-contain',
  'bg-center',
  'bg-transparent',
  'bg-current',
  'shadow-none',
  'outline-none',
  'ring-0',
  'decoration-clone',
  'decoration-slice',
]);

const found = new Map(); // class -> Set("file:line")

for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file).replace(/\\/g, '/');
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      // Scan class-ish tokens. Adjacent matches need a lookahead rather than a
      // consumed delimiter, or every second class on a line is missed.
      for (const m of line.matchAll(/(?<=['"`\s])([a-z][a-z0-9]*(?:-[a-z0-9.]+)+(?:\/\d+)?)(?=['"`\s])/g)) {
        const cls = m[1];
        if (!COLOUR_PREFIX.test(cls) || ALLOWED.has(cls)) continue;
        // Arbitrary values (`bg-[…]`, `shadow-[…]`) are literal, not tokenised.
        if (cls.includes('[')) continue;
        if (!found.has(cls)) found.set(cls, new Set());
        found.get(cls).add(`${rel}:${i + 1}`);
      }
    });
}

const emitted = (cls) => css.includes(`.${cls.replace(/\//g, '\\/').replace(/\./g, '\\.')}`);
const dead = [...found.entries()].filter(([cls]) => !emitted(cls)).sort();

if (dead.length > 0) {
  console.error(`\ncheck:classes — ${dead.length} utility class(es) produced no CSS:\n`);
  for (const [cls, where] of dead) {
    console.error(`  ${cls}`);
    for (const w of where) console.error(`      ${w}`);
  }
  console.error(
    '\nEach of these is almost certainly a palette token missing from `@theme inline`\n' +
      'in src/styles/globals.css. The element is currently inheriting instead.\n',
  );
  process.exit(1);
}

console.log(`check:classes — ${found.size} colour utilities checked, all resolved.`);
