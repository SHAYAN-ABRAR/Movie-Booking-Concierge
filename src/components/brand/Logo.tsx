import { cn } from '@/lib/utils';

/**
 * The wordmark.
 *
 * No logo was supplied with this project, so this is an original mark built
 * from the design system itself: the name set in the display face, bracketed
 * by the sprocket rhythm that runs through the whole product. Nokshi — নকশী —
 * is the running-stitch embroidery of Bengal, and a strip of 35mm film carries
 * exactly the same interrupted line down both its edges.
 */
export function Logo({
  className,
  size = 'md',
  showTagline = false,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const scale = {
    sm: { text: 'text-base', dot: 'size-[3px]', gap: 'gap-[3px]' },
    md: { text: 'text-lg', dot: 'size-[3.5px]', gap: 'gap-[3.5px]' },
    lg: { text: 'text-3xl sm:text-4xl', dot: 'size-[6px]', gap: 'gap-[5px]' },
  }[size];

  const sprocket = (
    <span aria-hidden="true" className={cn('flex flex-col', scale.gap)}>
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className={cn('block rounded-[1px] bg-marigold', scale.dot)} />
      ))}
    </span>
  );

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className="inline-flex items-center gap-2">
        {sprocket}
        <span
          className={cn('font-display font-semibold leading-none tracking-[-0.02em]', scale.text)}
          style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 0" }}
        >
          Nokshi
        </span>
        {sprocket}
      </span>
      {showTagline ? (
        <span className="eyebrow mt-1.5 self-center">Cinemas</span>
      ) : (
        <span className="sr-only">Cinemas</span>
      )}
    </span>
  );
}

/**
 * Max's mark. A typographic monogram in the house display face, sitting inside
 * a single sprocket perforation — deliberately not a robot, a sparkle or a
 * glowing orb. It belongs to this product and reads at 20px.
 */
export function MaxMark({ className, tone = 'default' }: { className?: string; tone?: 'default' | 'inverse' }) {
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
