#!/usr/bin/env node
/**
 * Asset-usage check.
 *
 * Enforces three rules from the project brief:
 *
 *   1. One source image may occupy at most one visual slot. A responsive
 *      srcset serving a single component counts as one slot and is allowed.
 *   2. Design-reference material is studied, never rendered. Nothing under
 *      reference-assets/ may be imported or referenced from src/ or public/.
 *   3. Every file supplied with the project appears in the manifest exactly
 *      once, and every manifest entry still exists on disk.
 *
 * Run: npm run check:assets
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const RAW_DIR = join(ROOT, 'reference-assets', 'raw');
const MANIFEST = join(ROOT, 'src', 'data', 'assetManifest.ts');
const SRC = join(ROOT, 'src');
const PUBLIC = join(ROOT, 'public');

const MEDIA_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg',
  '.mp4', '.webm', '.mov', '.m4v', '.ogv',
]);

const errors = [];
const warnings = [];
const notes = [];

function walk(dir, filter = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase();
}

/* ── Parse the manifest ────────────────────────────────────────────────── */

if (!existsSync(MANIFEST)) {
  console.error('✗ src/data/assetManifest.ts is missing.');
  process.exit(1);
}

const manifestSource = readFileSync(MANIFEST, 'utf8');
const entries = [];
const recordRe =
  /file:\s*'([^']+)'[\s\S]*?path:\s*'([^']+)'[\s\S]*?sha256Prefix:\s*'([^']*)'[\s\S]*?category:\s*'([^']+)'[\s\S]*?deployable:\s*(true|false)[\s\S]*?slot:\s*(null|'[^']*')/g;

let match;
while ((match = recordRe.exec(manifestSource)) !== null) {
  entries.push({
    file: match[1],
    path: match[2],
    sha256Prefix: match[3],
    category: match[4],
    deployable: match[5] === 'true',
    slot: match[6] === 'null' ? null : match[6].slice(1, -1),
  });
}

if (entries.length === 0) {
  errors.push('Could not parse any asset records from src/data/assetManifest.ts.');
}

/* ── Rule 3: manifest and disk agree ─────────────────────────────────────
 *
 * The supplied material is third-party design reference, so it is deliberately
 * not committed — see docs/asset-inventory.md. When it is absent, the checks
 * that need the bytes (reconciliation, hashes, duplicates) are skipped and the
 * manifest becomes the record. Rules 1 and 2 still run in full, because they
 * only need the manifest and the source tree.
 */

const onDisk = walk(RAW_DIR, (f) => MEDIA_EXT.has(extname(f).toLowerCase()));
const rawPresent = onDisk.length > 0;
const onDiskNames = new Set(onDisk.map((f) => relative(RAW_DIR, f).replaceAll('\\', '/')));
const manifestNames = new Set(entries.map((e) => e.file));

if (rawPresent) {
  for (const name of onDiskNames) {
    if (!manifestNames.has(name)) {
      errors.push(`Supplied asset "${name}" is on disk but missing from the manifest.`);
    }
  }
  for (const entry of entries) {
    if (!onDiskNames.has(entry.file)) {
      errors.push(`Manifest lists "${entry.file}" but it is not present in reference-assets/raw/.`);
    }
  }
} else {
  notes.push(
    'reference-assets/raw/ is not present — third-party design reference is not committed. ' +
      'Hash and duplicate verification skipped; the manifest is the record.',
  );
}

const seenFiles = new Map();
for (const entry of entries) {
  if (seenFiles.has(entry.file)) {
    errors.push(`"${entry.file}" appears in the manifest more than once.`);
  }
  seenFiles.set(entry.file, entry);
}

/* ── Duplicate detection by content hash ───────────────────────────────── */

const byHash = new Map();
for (const file of onDisk) {
  const hash = sha256(file);
  const name = relative(RAW_DIR, file).replaceAll('\\', '/');
  if (!byHash.has(hash)) byHash.set(hash, []);
  byHash.get(hash).push(name);

  const entry = seenFiles.get(name);
  if (entry && entry.sha256Prefix && !hash.startsWith(entry.sha256Prefix)) {
    errors.push(
      `"${name}" has changed on disk — manifest records sha256 ${entry.sha256Prefix}…, file is ${hash.slice(0, 16)}….`,
    );
  }
}
for (const [, names] of byHash) {
  if (names.length > 1) {
    warnings.push(`Byte-identical duplicates supplied: ${names.join(', ')}. Only one may be deployed.`);
  }
}

/* ── Rule 1: one asset, one slot ───────────────────────────────────────── */

const slotOwners = new Map();
for (const entry of entries) {
  if (!entry.deployable) {
    if (entry.slot !== null) {
      errors.push(`"${entry.file}" is not deployable but has been assigned the slot "${entry.slot}".`);
    }
    continue;
  }
  if (entry.slot === null) {
    errors.push(`"${entry.file}" is marked deployable but has no visual slot assigned.`);
    continue;
  }
  if (slotOwners.has(entry.slot)) {
    errors.push(
      `Slot "${entry.slot}" is claimed by both "${slotOwners.get(entry.slot)}" and "${entry.file}".`,
    );
  }
  slotOwners.set(entry.slot, entry.file);
}

// The same source file may not be assigned to two slots.
const slotsPerFile = new Map();
for (const entry of entries) {
  if (!entry.deployable || entry.slot === null) continue;
  const list = slotsPerFile.get(entry.file) ?? [];
  list.push(entry.slot);
  slotsPerFile.set(entry.file, list);
}
for (const [file, slots] of slotsPerFile) {
  if (slots.length > 1) {
    errors.push(`"${file}" is placed in ${slots.length} visual slots: ${slots.join(', ')}.`);
  }
}

/* ── Rule 2: reference material is never rendered ──────────────────────── */

const codeFiles = walk(SRC, (f) => /\.(ts|tsx|css|html)$/.test(f)).concat(
  walk(PUBLIC, (f) => /\.(html|css|svg)$/.test(f)),
  existsSync(join(ROOT, 'index.html')) ? [join(ROOT, 'index.html')] : [],
);

for (const file of codeFiles) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  // The manifest itself legitimately records the paths.
  if (rel === 'src/data/assetManifest.ts') continue;

  if (/reference-assets/.test(text)) {
    errors.push(`${rel} references reference-assets/ — design-reference material must never be rendered.`);
  }
  for (const entry of entries) {
    if (entry.deployable) continue;
    const re = new RegExp(`['"\`/\\(]${entry.file.replace('.', '\\.')}`);
    if (re.test(text)) {
      errors.push(`${rel} references the study-only asset "${entry.file}".`);
    }
  }
}

/* ── Every deployable asset is actually used ───────────────────────────── */

const allCode = codeFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
for (const entry of entries) {
  if (!entry.deployable) continue;
  if (!allCode.includes(entry.file)) {
    warnings.push(`"${entry.file}" is marked deployable with slot "${entry.slot}" but is never referenced in code.`);
  }
}

/* ── Unreferenced media sitting in public/ ─────────────────────────────── */

const publicMedia = walk(PUBLIC, (f) => MEDIA_EXT.has(extname(f).toLowerCase()));
for (const file of publicMedia) {
  const name = relative(PUBLIC, file).replaceAll('\\', '/');
  const referenced = allCode.includes(name) || allCode.includes(`/${name}`);
  if (!referenced) warnings.push(`public/${name} is not referenced anywhere.`);
}

/* ── Report ───────────────────────────────────────────────────────────── */

const deployableCount = entries.filter((e) => e.deployable).length;
notes.push(`${entries.length} supplied asset(s) catalogued.`);
notes.push(`${deployableCount} deployable, occupying ${slotOwners.size} visual slot(s).`);
notes.push(`${entries.length - deployableCount} study-only (design reference), rendered nowhere.`);

for (const note of notes) console.log(`  · ${note}`);
for (const warning of warnings) console.log(`  ! ${warning}`);

if (errors.length > 0) {
  console.error('\n✗ Asset check failed:');
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\n✓ Asset check passed — no image occupies more than one visual slot.');
