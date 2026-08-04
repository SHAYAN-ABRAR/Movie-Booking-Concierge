#!/usr/bin/env node
/**
 * One-time, development-only concession image generation.
 *
 * The application never runs this. It has no runtime image dependency, no API
 * key in browser code, and no network call for a concession photograph — the
 * built site serves committed files from `public/media/concessions/`. This
 * script exists to *produce* those files, once, on a developer's machine.
 *
 *   # bash / zsh
 *   OPENAI_API_KEY=sk-… node scripts/generate-concession-images.mjs
 *
 *   # PowerShell — it has no inline VAR=value prefix, so set it first
 *   $env:OPENAI_API_KEY = "sk-…"
 *   node scripts/generate-concession-images.mjs
 *
 *   # one item, after rejecting a defective result
 *   node scripts/generate-concession-images.mjs con-nachos
 *
 * The key is read from the environment and never written anywhere. Passing one
 * item id regenerates just that item, which is what you want after rejecting a
 * defective result — see `docs/concession-ai-image-manifest.md` for the review
 * checklist each image has to pass before it is kept.
 *
 * Originals land in `reference-assets/generated/concessions/originals/` at full
 * resolution so derivatives can be rebuilt without regenerating. Run
 * `node scripts/build-concession-media.mjs` afterwards to produce the AVIF,
 * WebP and JPEG widths and rewrite the manifest.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINALS = path.join(root, 'reference-assets/generated/concessions/originals');

const MODEL = 'gpt-image-1';
/** 4:3 landscape at the largest size the model offers, for crop headroom. */
const SIZE = '1536x1024';

/**
 * The shared art direction.
 *
 * Held in one constant so the sixteen images read as one photographic series
 * rather than sixteen unrelated stock shots — same counter, same lighting
 * language, same lens feel. Only the subject clause changes per item.
 */
const DIRECTION = [
  'Photorealistic premium commercial food photography for a modern cinema concession menu.',
  'Presented in clean unbranded cinema packaging on a refined dark charcoal counter',
  'with a warm cream linen runner and a single restrained marigold-toned prop.',
  'Soft directional studio lighting, realistic texture, appetizing but believable,',
  'editorial composition, shallow but not excessive depth of field, high-end food advertising.',
  'No people, no faces, no hands, no text, no lettering, no logos, no branded cups,',
  'no watermark, no prices, no movie characters, no malformed packaging,',
  'no floating ingredients, no excessive garnish, no plastic-looking food.',
  'Landscape 4:3 composition with safe crop space around the subject.',
].join(' ');

/**
 * Per-item subject clauses.
 *
 * Each one names the portion and the container explicitly, because that is what
 * keeps a "regular" from looking like a "large" and a two-person combo from
 * arriving with four drinks in it. The clauses also deliberately vary angle,
 * colour temperature and prop set so no two images share a composition.
 */
const ITEMS = {
  'con-popcorn-salt-r':
    'A single regular-size portion of freshly popped salted popcorn in a small plain kraft-paper carton, ' +
    'pale golden kernels with visible sea-salt crystals, a few kernels resting on the counter beside it. ' +
    'Lit from the left. A one-person portion.',

  'con-popcorn-salt-l':
    'A tall large-size bucket of salted popcorn, generous enough to share between three people, ' +
    'plain unbranded cream-and-charcoal bucket overflowing slightly at the rim. ' +
    'Shot from a lower, wider angle than a single portion so the scale reads clearly.',

  'con-popcorn-caramel':
    'Caramel-coated popcorn with a deep glossy amber lacquer on each kernel, in a plain unbranded paper cone ' +
    'standing in a small metal holder, caramel clusters on dark slate beside it. ' +
    'Warm honey-toned lighting, distinctly warmer than the salted popcorn shots.',

  'con-popcorn-cheese':
    'Cheddar cheese popcorn dusted vivid orange, in a shallow wide unbranded paper tray, ' +
    'photographed from a high three-quarter angle, fine cheese powder on the kernels and tray edge. ' +
    'Cool neutral lighting so the orange stays truthful rather than lurid.',

  'con-cola-r':
    'One regular-size cup of dark cola over ice in a plain unbranded matte cream paper cup with a clear lid ' +
    'and straw, condensation beading on the cup. A single medium-height serving.',

  'con-cola-l':
    'One noticeably taller large-size cup of cola with ice, plain unbranded matte charcoal paper cup with ' +
    'clear lid and straw, shot straight on so the height reads, heavy condensation running down the side. ' +
    'A second empty cup lies flat and out of focus behind it.',

  'con-lassi':
    'Sweet lassi, a thick whisked yogurt drink, in a tall clear glass tumbler, soft cream-white body with a ' +
    'light froth collar and a faint dusting of ground cardamom. A small brass spoon beside the glass. ' +
    'Diffused backlight to show the body of the drink.',

  'con-lemon-soda':
    'Lemon soda in a clear tall glass, pale straw colour with fine rising bubbles, one thin lemon wheel on ' +
    'the rim, crushed ice at the base, a tiny dish of salt beside it. Bright cool backlight so the ' +
    'carbonation reads.',

  'con-tea':
    'Masala tea in a small thick-walled glass cup on a dark saucer, deep amber-brown with a milky surface ' +
    'and a fine wisp of steam, a cinnamon stick and two green cardamom pods on the saucer. ' +
    'Warm low side lighting in a darker, moodier register than the cold drinks.',

  'con-samosa':
    'Exactly two golden vegetable samosas, crisp blistered pastry, in a small plain unbranded paper tray ' +
    'with a folded napkin, one broken open to show the spiced potato and pea filling, ' +
    'a tiny pot of dark tamarind chutney beside it.',

  'con-chicken-roll':
    'A single chicken roll — flaky paratha wrapped tightly around spiced chicken with sliced onion and a ' +
    'green chilli, half wrapped in plain unbranded greaseproof paper, cut at one end to show the filling, ' +
    'standing at a slight angle on a dark slate board.',

  'con-nachos':
    'Corn tortilla chips in a plain unbranded shallow paper boat, with a separate small ramekin of warm ' +
    'molten cheese sauce and a second tiny ramekin of sliced pickled green chilli beside it — ' +
    'the sauce served on the side, not poured over. High angle.',

  'con-mishti':
    'Exactly four pieces of Bengali mishti — assorted milk sweets in pale cream and soft brown — arranged in ' +
    'a small plain unbranded box lined with greaseproof paper, one piece lifted slightly to show the texture. ' +
    'Soft even lighting, close overhead three-quarter angle.',

  'con-choc-icecream':
    'A single scoop of dark chocolate ice cream in a small plain unbranded tub with a flat wooden spoon ' +
    'resting across the rim, a light frost on the tub, the scoop just beginning to soften at one edge. ' +
    'Cool crisp lighting, tight composition.',

  // The combos must show exactly what the data says they contain. Getting this
  // wrong is not a cosmetic defect — it is the picture promising a different
  // order from the one the customer is buying.
  'con-combo-two':
    'An interval box for two containing exactly one large bucket of salted popcorn and exactly two ' +
    'regular-size cups of cola with ice — three items in total, no more. Plain unbranded packaging ' +
    'arranged on a serving tray, shot from a slightly elevated angle so all three are countable.',

  'con-combo-family':
    'A family box containing exactly two large buckets of popcorn — one plainly salted and one visibly ' +
    'caramel-glazed — exactly four regular-size cups of soft drink, and exactly one paper boat of nachos ' +
    'with cheese sauce. Seven items in total, no more and no fewer, arranged on a wide serving tray ' +
    'and shot from above so each item is countable.',
};

const key = process.env.OPENAI_API_KEY;
if (!key) {
  // Naming both shells matters: the POSIX `VAR=value command` form fails on
  // PowerShell with a bewildering `CommandNotFoundException` that points at the
  // assignment rather than at the missing variable.
  const powershell = process.platform === 'win32';
  console.error(
    '\n  OPENAI_API_KEY is not set.\n\n' +
      '  This script is development-only and the key is never committed, never\n' +
      '  written to disk and never required at runtime — the application serves\n' +
      '  the committed files it produces.\n\n' +
      (powershell
        ? '    # PowerShell\n' +
          '    $env:OPENAI_API_KEY = "sk-…"\n' +
          '    node scripts/generate-concession-images.mjs\n' +
          '    Remove-Item Env:\\OPENAI_API_KEY\n'
        : '    OPENAI_API_KEY=sk-… node scripts/generate-concession-images.mjs\n'),
  );
  process.exit(1);
}

const requested = process.argv.slice(2);
const targets = requested.length > 0 ? requested : Object.keys(ITEMS);

for (const id of targets) {
  if (!ITEMS[id]) {
    console.error(`  unknown item: ${id}`);
    process.exit(1);
  }
}

await mkdir(ORIGINALS, { recursive: true });

const generatedAt = new Date().toISOString();
const record = [];

for (const id of targets) {
  const prompt = `${ITEMS[id]} ${DIRECTION}`;
  process.stdout.write(`  ${id} … `);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, n: 1, quality: 'high' }),
  });

  if (!response.ok) {
    console.error(`failed (${response.status})\n${await response.text()}`);
    process.exit(1);
  }

  const payload = await response.json();
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) {
    console.error('no image returned');
    process.exit(1);
  }

  const file = path.join(ORIGINALS, `${id}.png`);
  await writeFile(file, Buffer.from(b64, 'base64'));
  console.log('written');

  record.push({ itemId: id, model: MODEL, size: SIZE, generatedAt, prompt });
}

// The provenance sidecar. `build-concession-media.mjs` reads this to write the
// manifest, so the model and prompt travel with the image rather than being
// retyped into documentation by hand.
await writeFile(
  path.join(ORIGINALS, 'generation-log.json'),
  `${JSON.stringify(record, null, 2)}\n`,
  'utf8',
);

console.log(
  `\n  ${record.length} original(s) written to reference-assets/generated/concessions/originals/\n` +
    '  Review each one against the checklist in docs/concession-ai-image-manifest.md,\n' +
    '  regenerate any that fail, then run:\n\n' +
    '    node scripts/build-concession-media.mjs\n',
);
