import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

/**
 * The GrandPlex wordmark.
 *
 * Text-led, built from the design system rather than dropped in as artwork, so
 * it inherits the display face, the signal and the theme without a second set
 * of assets to keep in step.
 *
 * The idea is unchanged from the first mark and better executed: **GRAND** is
 * the room, set plain; **PLEX** is what is projected into it — the same word,
 * same weight, knocked out of a solid vermilion block. Half the wordmark is a
 * printed slab, which is the whole design system in eight characters.
 *
 * Deliberately *not*: a reel, a play triangle, a gradient, a sparkle, a crown,
 * or "GP" in a glowing circle.
 *
 * The wordmark is Latin in both interface languages. A logo is a piece of
 * artwork, not a translatable string — see `docs/grandplex-brand-system.md`.
 */
export function Logo({
  className,
  size = 'md',
  /** For placement on a dark ground that is not the theme's own surface. */
  onDark = false,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
}) {
  const scale = {
    sm: 'text-[0.9375rem]',
    md: 'text-[1.15rem]',
    lg: 'text-[2.25rem] sm:text-[3rem]',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-stretch leading-none',
        onDark ? 'text-paper' : 'text-content',
        className,
      )}
      // One accessible name for the whole mark. Without this a screen reader
      // reads the two spans as two separate words.
      role="img"
      aria-label={brand.name}
    >
      <span
        aria-hidden="true"
        className={cn(
          'font-display uppercase leading-none tracking-[-0.035em]',
          'py-[0.14em] pr-[0.1em]',
          scale,
        )}
      >
        Grand
      </span>
      {/* The projected half. A solid block, square corners, knocked out — it is
          the same mark whether the page behind it is bone or pitch. */}
      <span
        aria-hidden="true"
        className={cn(
          'bg-signal font-display uppercase leading-none tracking-[-0.035em] text-white',
          'px-[0.16em] py-[0.14em]',
          scale,
        )}
      >
        Plex
      </span>
    </span>
  );
}

/**
 * The compact monogram, for the favicon and anywhere the full wordmark would
 * set below about 14px. The same idea reduced to a square: the projected block
 * with the initials knocked out of it.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label={brand.name}
      className={cn(
        'grid aspect-square place-items-center bg-signal font-display text-[0.58em]',
        'uppercase leading-none tracking-[-0.02em] text-white',
        className,
      )}
    >
      <span aria-hidden="true">{brand.monogram}</span>
    </span>
  );
}

/**
 * Max's mark. A typographic monogram in a hard square — deliberately not a
 * robot, a sparkle or a glowing orb. It belongs to this product and reads at
 * 20px.
 */
export function MaxMark({
  className,
  tone = 'default',
}: {
  className?: string;
  tone?: 'default' | 'inverse';
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center font-display text-[0.8em] uppercase leading-none',
        tone === 'inverse' ? 'bg-paper text-ink' : 'bg-signal text-white',
        className,
      )}
    >
      M
    </span>
  );
}
