import type { Resources } from './resources/en';

/**
 * The English resource is declared `as const` so that `t()` gets literal key
 * paths. That also freezes every *value* to a literal, which would demand that
 * the Bangla file repeat the English strings verbatim.
 *
 * This walks the same shape and widens the leaves to `string`, so Bangla is
 * checked for having exactly the right keys — no more, no fewer — while being
 * free to say something different.
 */
export type TranslationShape<T> = {
  [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
};

/** The contract every locale file implements. */
export type LocaleResource = TranslationShape<Resources>;
