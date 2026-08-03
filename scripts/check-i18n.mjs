#!/usr/bin/env node
/**
 * Translation catalogue gate.
 *
 * TypeScript already guarantees that `bn.ts` has exactly the keys `en.ts` has —
 * `LocaleResource` sees to that, and a missing key is a compile error. This
 * script catches the failures the type system cannot see:
 *
 *   1. Empty or whitespace-only values (a key that "exists" but renders blank).
 *   2. Interpolation drift — `{{page}}` present in one locale, absent or
 *      renamed in the other, which produces a literal `{{page}}` on screen.
 *   3. Strings copied across untranslated, byte for byte.
 *   4. Bangla values containing no Bengali characters at all.
 *   5. Half-finished i18next plurals (`_one` without `_other`).
 *
 * The `.ts` catalogues are imported directly — Node strips the types. There is
 * no build step and no duplicate JSON copy to drift out of date.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = async (locale) => {
  const url = new URL(`../src/i18n/resources/${locale}.ts`, import.meta.url);
  return (await import(url))[locale];
};

/**
 * Paths whose Bangla value is *expected* to match the English one, or to carry
 * no Bengali characters. Each needs a reason — an unexplained entry here is how
 * an untranslated string quietly becomes permanent.
 */
const CERTIFICATE_CODES = [
  'domain.certificates.u.short',
  'domain.certificates.ua12.short',
  'domain.certificates.ua16.short',
  'domain.certificates.a18.short',
];

const CODES_STAY_LATIN =
  'A regulatory certificate code, printed in Latin on every poster and trailer card.';

const PUNCTUATION_ONLY =
  'Nothing but quotation marks around the customer\'s own search text; Bangla uses the same pair.';

/**
 * Strings made only of placeholders and the punctuation joining them. The
 * numbers inside arrive already localized, so there is no Bengali text to add
 * and no meaningful way for the two languages to differ.
 */
const FORMAT_ONLY = [
  ['filters.quotedQuery', PUNCTUATION_ONLY],
  ['home.dateRange', 'Two already-formatted dates joined by an en dash.'],
  ['movieDetails.ageFrom', 'An already-localized age and a plus sign.'],
  ['movieDetails.ageBetween', 'Two already-localized ages joined by an en dash.'],
];

const IDENTICAL_OK = new Map([
  ...CERTIFICATE_CODES.map((at) => [at, CODES_STAY_LATIN]),
  ...FORMAT_ONLY,
]);

const NO_BENGALI_OK = new Map([
  ...CERTIFICATE_CODES.map((at) => [at, CODES_STAY_LATIN]),
  ...FORMAT_ONLY,
]);

const BENGALI = /[ঀ-৿]/;
/**
 * Captures the *name* only, so `{{count, number}}` and `{{count}}` compare
 * equal. The format spec after the comma is i18next's, and a locale is allowed
 * to differ there — Bangla might want a different number style for the same
 * value — but the variable name must match or the placeholder renders raw.
 */
const INTERPOLATION = /\{\{\s*([\w.]+)\s*(?:,[^}]*)?\}\}/g;

function flatten(node, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(node)) {
    const at = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, at, out);
    else out.set(at, value);
  }
  return out;
}

/**
 * `<Trans>` component slots — `<clear>…</clear>`. A locale that drops or
 * renames one loses the link or button it was carrying, silently.
 */
const TAG = /<\/?([a-zA-Z][\w-]*)\s*>/g;

function variablesIn(text) {
  return new Set([...String(text).matchAll(INTERPOLATION)].map((m) => m[1]));
}

function tagsIn(text) {
  return new Set([...String(text).matchAll(TAG)].map((m) => m[1]));
}

const problems = [];
const fail = (locale, at, message) => problems.push({ locale, at, message });

const en = flatten(await load('en'));
const bn = flatten(await load('bn'));

// ── 1. Shape ───────────────────────────────────────────────────────────────
for (const at of en.keys()) if (!bn.has(at)) fail('bn', at, 'missing from the Bangla catalogue');
for (const at of bn.keys()) if (!en.has(at)) fail('bn', at, 'not present in the English catalogue');

// ── 2. Values ──────────────────────────────────────────────────────────────
for (const [locale, catalogue] of [
  ['en', en],
  ['bn', bn],
]) {
  for (const [at, value] of catalogue) {
    if (typeof value !== 'string') {
      fail(locale, at, `expected a string, found ${typeof value}`);
      continue;
    }
    if (value.trim() === '') fail(locale, at, 'is empty');
    if (value !== value.trim()) fail(locale, at, 'has leading or trailing whitespace');
  }
}

// ── 3. Interpolation parity ────────────────────────────────────────────────
for (const [at, english] of en) {
  const bangla = bn.get(at);
  if (typeof english !== 'string' || typeof bangla !== 'string') continue;

  const wanted = variablesIn(english);
  const found = variablesIn(bangla);
  for (const name of wanted) {
    if (!found.has(name)) fail('bn', at, `is missing the {{${name}}} placeholder`);
  }
  for (const name of found) {
    if (!wanted.has(name)) fail('bn', at, `has a {{${name}}} placeholder English does not`);
  }

  const wantedTags = tagsIn(english);
  const foundTags = tagsIn(bangla);
  for (const tag of wantedTags) {
    if (!foundTags.has(tag)) fail('bn', at, `is missing the <${tag}> slot`);
  }
  for (const tag of foundTags) {
    if (!wantedTags.has(tag)) fail('bn', at, `has a <${tag}> slot English does not`);
  }
}

// ── 4. Actually translated ─────────────────────────────────────────────────
for (const [at, english] of en) {
  const bangla = bn.get(at);
  if (typeof english !== 'string' || typeof bangla !== 'string') continue;

  if (english === bangla && !IDENTICAL_OK.has(at)) {
    fail('bn', at, `is identical to English (${JSON.stringify(english)})`);
  }
  if (!BENGALI.test(bangla) && !NO_BENGALI_OK.has(at)) {
    fail('bn', at, `contains no Bengali characters (${JSON.stringify(bangla)})`);
  }
}

// ── 5. Complete plurals ────────────────────────────────────────────────────
for (const [locale, catalogue] of [
  ['en', en],
  ['bn', bn],
]) {
  for (const at of catalogue.keys()) {
    if (!at.endsWith('_one')) continue;
    const other = `${at.slice(0, -'_one'.length)}_other`;
    if (!catalogue.has(other)) fail(locale, at, `has no matching ${path.basename(other)}`);
  }
}

// ── Report ─────────────────────────────────────────────────────────────────
if (problems.length > 0) {
  console.error(`\n  ${problems.length} translation problem(s):\n`);
  for (const { locale, at, message } of problems) {
    console.error(`  ${locale.padEnd(2)}  ${at}\n      ${message}`);
  }
  console.error(`\n  Catalogues: ${path.relative(root, path.join(root, 'src/i18n/resources'))}\n`);
  process.exit(1);
}

console.log(`  i18n: ${en.size} keys, en + bn in parity, all translated.`);
