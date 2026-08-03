#!/usr/bin/env node
/**
 * Brand gate.
 *
 * A rebrand is not finished when the header says the new name; it is finished
 * when the old one cannot come back. Strings get reintroduced by copy-paste
 * from an old branch, from a stale doc, or from a component someone forgot to
 * open. This fails the build on any of that.
 *
 * Fails when customer-facing runtime code contains:
 *   - `Nokshi` / `Nokshi Cinemas`
 *   - `নকশি` / `নকশি সিনেমাস`
 *   - a new `NK-` reference being generated
 *   - `nokshi-cinemas` in package metadata
 *
 * Every exception is listed by path with a reason. There is no blanket
 * directory exclusion, because that is how a validator quietly stops working.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { glob } from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Files permitted to contain the old brand, each with the reason it needs to.
 *
 * Documentation about the migration has to be able to name what was migrated
 * from; a validator has to contain the pattern it is looking for.
 */
const ALLOWED_FILES = new Map([
  ['scripts/check-brand.mjs', 'This file. It has to contain what it forbids.'],
  ['src/config/brand.ts', 'Declares the legacy reference prefix that stays readable.'],
  ['docs/grandplex-migration.md', 'Explains the migration; must name the old brand.'],
  ['docs/grandplex-upgrade-audit.md', 'Records the pre-rebrand state.'],
  ['docs/grandplex-upgrade-qa.md', 'Records what was replaced.'],
  ['docs/limitations.md', 'Historical note on the demonstration build.'],
  ['docs/reference-audit.md', 'Pre-rebrand design reference audit.'],
  ['docs/design-directions.md', 'Pre-rebrand design exploration.'],
]);

/**
 * Storage keys keep the old prefix on purpose.
 *
 * They are invisible to customers, and renaming one would strand every booking,
 * preference and Max conversation already written under the old key. A cosmetic
 * rename is not worth losing a customer's booking history over — see
 * `docs/grandplex-migration.md`.
 */
const STORAGE_KEY = /(['"`])nokshi\.[a-z]+\.v\d\1/g;

const FORBIDDEN = [
  { pattern: /Nokshi\s+Cinemas/g, what: 'the old two-word brand' },
  { pattern: /\bNokshi\b/g, what: 'the old brand' },
  { pattern: /নকশি\s+সিনেমাস/g, what: 'the old Bangla brand' },
  { pattern: /নকশি/g, what: 'the old Bangla brand' },
  { pattern: /nokshi-cinemas/g, what: 'the old package name' },
  {
    // Generation, not recognition: `'NK-'` being built into a new reference.
    pattern: /`NK-\$\{|['"]NK-['"]\s*\+|return\s+['"`]NK-/g,
    what: 'generation of a new NK- booking reference',
  },
];

const SCAN = [
  'src/**/*.{ts,tsx,css}',
  'scripts/**/*.mjs',
  'tests/**/*.ts',
  'docs/**/*.md',
  'index.html',
  'package.json',
  'README.md',
  'public/*.svg',
];

const problems = [];

for (const pattern of SCAN) {
  for await (const entry of glob(pattern, { cwd: root })) {
    const file = entry.split(path.sep).join('/');
    if (ALLOWED_FILES.has(file)) continue;

    // Storage keys are removed before scanning, not allowlisted per file — the
    // exemption belongs to the *string*, not to whichever file uses it.
    const source = readFileSync(path.join(root, file), 'utf8').replace(STORAGE_KEY, '');

    for (const { pattern: forbidden, what } of FORBIDDEN) {
      for (const match of source.matchAll(forbidden)) {
        const line = source.slice(0, match.index).split('\n').length;
        problems.push({ file, line, text: match[0].trim(), what });
      }
    }
  }
}

// Package metadata gets its own check: the name field is not prose, and a
// regex over the whole file would also match the description.
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
if (/nokshi/i.test(pkg.name)) {
  problems.push({ file: 'package.json', line: 0, text: pkg.name, what: 'the old package name' });
}

if (problems.length > 0) {
  const seen = new Set();
  const unique = problems.filter((p) => {
    const key = `${p.file}:${p.line}:${p.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.error(`\n  ${unique.length} stale brand reference(s):\n`);
  for (const { file, line, text, what } of unique) {
    console.error(`  ${file}:${line}\n      ${JSON.stringify(text)} — ${what}`);
  }
  console.error('\n  The canonical brand is "GrandPlex". See src/config/brand.ts.\n');
  process.exit(1);
}

console.log('  brand: no stale references; canonical name is "GrandPlex".');
