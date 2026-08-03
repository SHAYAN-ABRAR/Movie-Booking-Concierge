#!/usr/bin/env node
/**
 * Finds customer-facing English that never went through `t()`.
 *
 * The translation catalogue can be in perfect parity and the interface can
 * still be half English, because a string that was never extracted has no key
 * to be out of parity with. This is the check for *that* — the one failure
 * `check:i18n` structurally cannot see.
 *
 * Two kinds of finding:
 *
 *   1. A JSX text node with real words in it — `<p>Choose a showtime</p>`.
 *   2. A string literal passed to a prop that is displayed — `title="Filters"`,
 *      `aria-label="Close"`, `placeholder="Search…"`.
 *
 * Deliberately not a parser. A parser would be more precise and would also be a
 * dependency and a maintenance burden for a project check; the heuristics below
 * are tuned to this codebase and the allowlist carries a reason per entry.
 *
 * Run: `node scripts/check-untranslated.mjs [--list]`
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { glob } from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listOnly = process.argv.includes('--list');

/**
 * A ratchet, not a wall.
 *
 * The localization pass translated the whole application except the five files
 * below, which are long-form prose (the booking wizard's step copy, the two
 * essay pages, the contact forms and Max's panel chrome). Failing the build on
 * them today would leave the gate permanently red and therefore ignored.
 *
 * Instead the count may only go *down*. Adding a new hard-coded English string
 * anywhere fails immediately; finishing one of the files below and forgetting
 * to lower this number also fails, which is the point — the number has to be
 * maintained, so it stays honest.
 *
 * Remaining, and why each is prose rather than chrome:
 *   src/components/booking/steps.tsx  56  wizard step copy and guidance
 *   src/components/max/MaxPanel.tsx   23  concierge panel chrome and disclosure
 *   src/routes/Contact.tsx            22  contact routes, forms, hours
 *   src/routes/About.tsx              15  the essay about the build
 *   src/routes/TicketPrices.tsx       11  the worked pricing example
 */
const BASELINE = 127;

/**
 * Files exempt from the sweep, each for a stated reason. "It is hard" is not a
 * reason; every entry here is something a customer never reads as prose.
 */
const EXEMPT = new Map([
  ['src/i18n/resources/en.ts', 'It is the English catalogue.'],
  ['src/i18n/resources/bn.ts', 'It is the Bangla catalogue.'],
  ['src/test/setup.ts', 'Test harness.'],
]);

/** Props whose string value is rendered or announced. */
const TEXT_PROPS = [
  'title',
  'label',
  'aria-label',
  'aria-description',
  'placeholder',
  'lede',
  'eyebrow',
  'linkLabel',
  'body',
  'summary',
  'detail',
  'alt',
  'heading',
  'lightLabel',
  'darkLabel',
  'languageLabel',
  'appearanceLabel',
];

/**
 * Strings that read like prose but are not shown: test ids, enum values,
 * class fragments, and the handful of brand words that are the same in every
 * language.
 */
const IGNORE_VALUE = [
  /^[a-z][a-z0-9-]*$/, // kebab or single lower-case token: an id or enum
  /^[A-Z][A-Z0-9_]*$/, // SCREAMING_CASE constant
  /^\W+$/, // punctuation or an arrow only
  /^Nokshi( Cinemas)?$/, // the brand, unchanged in both languages
  /^Max$/, // the concierge's name
];

const hasWords = (value) => /[A-Za-z]{2,}/.test(value);

function findings(source, file) {
  const out = [];
  const lines = source.split('\n');
  // Prose inside a `{/* … */}` or `/* … */` block is a note to the next
  // developer, not copy. Tracking the open/close across lines matters: the
  // continuation lines of a multi-line comment look exactly like interface text.
  let inComment = false;

  lines.forEach((line, index) => {
    const at = `${file}:${index + 1}`;
    const trimmed = line.trim();

    const opens = /\{?\/\*/.test(line);
    const closes = /\*\/\}?/.test(line);
    const wasInComment = inComment;
    if (opens && !closes) inComment = true;
    else if (closes && !opens) inComment = false;
    if (wasInComment || (opens && closes && !/\S.*\{?\/\*/.test(trimmed))) return;

    // Comments and imports carry no interface copy.
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('{/*') ||
      trimmed.startsWith('import ')
    ) {
      return;
    }

    for (const prop of TEXT_PROPS) {
      const match = new RegExp(`\\b${prop}=(["'])([^"']{2,})\\1`).exec(line);
      const value = match?.[2];
      if (value && hasWords(value) && !IGNORE_VALUE.some((re) => re.test(value))) {
        out.push({ at, kind: `${prop}=`, text: value });
      }
    }

    // A JSX text node: a line that is bare prose between tags, with no braces.
    if (
      /^[A-Z(]/.test(trimmed) &&
      !trimmed.includes('{') &&
      !trimmed.includes('=') &&
      !trimmed.includes('<') &&
      // Statements, not prose: a call, a member access, a terminated line.
      !trimmed.includes('(') &&
      !trimmed.endsWith(';') &&
      /[A-Za-z]{2,}\s+[A-Za-z]/.test(trimmed) &&
      !IGNORE_VALUE.some((re) => re.test(trimmed))
    ) {
      out.push({ at, kind: 'text', text: trimmed });
    }
  });

  return out;
}

const all = [];
for await (const entry of glob('src/**/*.{ts,tsx}', { cwd: root })) {
  const file = entry.split(path.sep).join('/');
  if (EXEMPT.has(file) || file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
  all.push(...findings(readFileSync(path.join(root, file), 'utf8'), file));
}

if (all.length === 0) {
  console.log('  i18n: no untranslated interface copy found.');
  process.exit(0);
}

const byFile = new Map();
for (const finding of all) {
  const file = finding.at.split(':')[0];
  byFile.set(file, [...(byFile.get(file) ?? []), finding]);
}

const log = all.length > BASELINE || listOnly ? console.error : console.log;

log(`\n  ${all.length} string(s) still hard-coded in English (baseline ${BASELINE}):\n`);
for (const [file, items] of [...byFile].sort((a, b) => b[1].length - a[1].length)) {
  log(`  ${file}  (${items.length})`);
  if (listOnly) for (const i of items) log(`      ${i.at}  ${i.kind}  ${i.text}`);
}
log('');

if (all.length > BASELINE) {
  console.error(
    `  New untranslated copy: ${all.length - BASELINE} more than the baseline of ${BASELINE}.\n` +
      '  Put the string in src/i18n/resources/{en,bn}.ts and render it through t().\n',
  );
  process.exit(1);
}

if (all.length < BASELINE) {
  console.error(
    `  ${BASELINE - all.length} fewer than the baseline — lower BASELINE in this script to ${all.length}\n` +
      '  so the ratchet keeps holding.\n',
  );
  process.exit(1);
}
