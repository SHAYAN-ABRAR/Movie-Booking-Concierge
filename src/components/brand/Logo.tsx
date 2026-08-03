import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

/**
 * The GrandPlex wordmark.
 *
 * Text-led, built from the design system rather than dropped in as artwork, so
 * it inherits the display face, the accent and the theme without a second set
 * of assets to keep in step.
 *
 * The idea is a screen in a dark house: **Grand** is the room, set plain in the
 * editorial face; **Plex** is what is projected onto it — same size, same
 * weight, lifted by a thin marigold rule sitting directly under it like the
 * lit edge of a screen. The sprocket column to the left keeps the film-strip
 * rhythm that runs through the rest of the product.
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
    sm: { text: 'text-base', dot: 'size-[3px]', gap: 'gap-[3px]', rule: 'h-[1.5px]' },
    md: { text: 'text-lg', dot: 'size-[3.5px]', gap: 'gap-[3.5px]', rule: 'h-[2px]' },
    lg: { text: 'text-3xl sm:text-4xl', dot: 'size-[6px]', gap: 'gap-[5px]', rule: 'h-[3px]' },
  }[size];

  return (
    <span
      className={cn('inline-flex items-center gap-2', onDark ? 'text-paper' : '', className)}
      // One accessible name for the whole mark. Without this a screen reader
      // reads the two spans as two separate words.
      role="img"
      aria-label={brand.name}
    >
      <span aria-hidden="true" className={cn('flex flex-col', scale.gap)}>
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className={cn('block rounded-[1px] bg-marigold', scale.dot)} />
        ))}
      </span>

      <span
        aria-hidden="true"
        className={cn('font-display font-semibold leading-none tracking-[-0.025em]', scale.text)}
        style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 0" }}
      >
        Grand
        {/* `relative` + an absolutely-placed rule, so the underline cannot
            affect the line box and the header height never shifts. */}
        <span className="relative">
          Plex
          <span
            className={cn(
              'absolute inset-x-0 -bottom-[0.18em] block rounded-[1px] bg-marigold',
              scale.rule,
            )}
          />
        </span>
      </span>
    </span>
  );
}

/**
 * The compact monogram, for the favicon and anywhere the full wordmark would
 * set below about 14px. Same two ideas — the screen rule, the film rhythm —
 * reduced to fit a square.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label={brand.name}
      className={cn(
        'relative grid aspect-square place-items-center border border-current font-display text-[0.62em] font-semibold leading-none',
        className,
      )}
      style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 0" }}
    >
      <span aria-hidden="true">{brand.monogram}</span>
      <span
        aria-hidden="true"
        className="absolute inset-x-[18%] bottom-[15%] block h-[1.5px] rounded-[1px] bg-marigold"
      />
    </span>
  );
}

/**
 * Max's mark. A typographic monogram in the house display face, sitting inside
 * a single sprocket perforation — deliberately not a robot, a sparkle or a
 * glowing orb. It belongs to this product and reads at 20px.
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
        'grid shrink-0 place-items-center rounded-[2px] border font-display text-[0.8em] font-semibold leading-none',
        tone === 'inverse'
          ? 'border-paper/30 bg-paper text-ink'
          : 'border-marigold/40 bg-marigold text-paper',
        className,
      )}
      style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 0" }}
    >
      M
    </span>
  );
}
