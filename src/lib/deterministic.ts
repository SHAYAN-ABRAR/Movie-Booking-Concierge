/**
 * Deterministic pseudo-randomness.
 *
 * Seat availability, screening layouts and demo alert events must be stable:
 * the same showtime has to produce the same sold seats on every render, in
 * every tab, after every reload. Nothing in this application calls Math.random.
 */

/** FNV-1a, 32-bit. Stable across runs and platforms. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32 — small, fast, well-distributed for our purposes. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(seedInput: string): () => number {
  return mulberry32(hashString(seedInput));
}

/** Fisher–Yates using a supplied generator. Does not mutate the input. */
export function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/** A stable integer in [min, max] derived from a string seed. */
export function seededInt(seedInput: string, min: number, max: number): number {
  const rng = rngFor(seedInput);
  return min + Math.floor(rng() * (max - min + 1));
}
