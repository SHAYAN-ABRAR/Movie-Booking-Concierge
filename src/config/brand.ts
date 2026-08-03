/**
 * The brand, in one place.
 *
 * Before this existed the product name appeared as a literal in forty files —
 * components, stores, both translation catalogues, venue data, tests and
 * documentation — which is why renaming it was a hundred-and-fourteen-edit job
 * rather than a one-line one. Everything that names the product now reads from
 * here.
 *
 * Interface *copy* that happens to mention the brand still lives in the
 * translation catalogues, because that copy is a sentence in a language, not a
 * brand token. What lives here is the identity itself.
 */
export const brand = {
  /**
   * The canonical wordmark. One spelling, one capitalisation: `GrandPlex`.
   * Not `Grandplex`, not `Grand Plex`, not `GRANDPLEX`.
   */
  name: 'GrandPlex',
  displayName: 'GrandPlex',

  /**
   * For running Bangla prose, where the Latin wordmark reads as a foreign
   * object mid-sentence. The *logo* stays `GrandPlex` in both languages —
   * a wordmark is a piece of artwork, not a translatable string.
   */
  banglaName: 'গ্র্যান্ডপ্লেক্স',

  /** The compact monogram, for the favicon and very small contexts. */
  monogram: 'GP',

  /**
   * The prefix for newly generated booking references.
   *
   * References issued before the rebrand start `NK-` and must keep working —
   * they are printed on tickets people already hold. See
   * `LEGACY_REFERENCE_PREFIXES` and `docs/grandplex-migration.md`.
   */
  bookingReferencePrefix: 'GP',

  description: 'A premium movie discovery and local demonstration booking experience.',

  /** The domain used in sample contact details. Not a live host. */
  domain: 'grandplex.example',
} as const;

/**
 * Prefixes this build still recognises on a stored booking.
 *
 * `NK-` is the pre-rebrand prefix. It is read-only history: nothing generates
 * it any more, and `scripts/check-brand.mjs` fails if anything starts. But a
 * reference that is already in someone's browser, on a printed ticket, or in a
 * calendar entry has to keep opening, so every lookup accepts both.
 */
export const LEGACY_REFERENCE_PREFIXES = ['NK'] as const;

/** Every prefix a stored reference may legitimately carry. */
export const ALL_REFERENCE_PREFIXES = [
  brand.bookingReferencePrefix,
  ...LEGACY_REFERENCE_PREFIXES,
] as const;

/**
 * Matches any reference this build accepts, current or historical.
 * Case-sensitive: references are always uppercase.
 */
export const BOOKING_REFERENCE_PATTERN = new RegExp(
  `^(?:${ALL_REFERENCE_PREFIXES.join('|')})-[A-Z0-9]{6}$`,
);

/** The same, unanchored, for pulling a reference out of a sentence Max was given. */
export const BOOKING_REFERENCE_IN_TEXT = new RegExp(
  `\\b(?:${ALL_REFERENCE_PREFIXES.join('|')})-[A-Z0-9]{6}\\b`,
  'i',
);
