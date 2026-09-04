import { useState } from 'react';
import { venueImageBySlug } from '@/data/venueMedia';
import { cn } from '@/lib/utils';

/**
 * A house's foyer.
 *
 * AI-generated illustrations, committed locally and served as three widths in
 * AVIF → WebP → JPEG. Nothing here contacts a remote host. Intrinsic
 * dimensions are always set so the box is reserved before the bytes land and
 * the page does not shift as a venue loads.
 *
 * The customer-facing disclosure that these are generated lives on the cinema
 * pages, once, not stamped over every image — the same rule the counter
 * follows.
 */
export function VenueImage({
  slug,
  className,
  imgClassName,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px',
  priority = false,
}: {
  /** The cinema's slug — the manifest is keyed by it. */
  slug: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const image = venueImageBySlug.get(slug);
  const [failed, setFailed] = useState(false);

  // No image on file, or it failed to decode. A plain sunken panel is a better
  // answer than a broken-image icon, and the venue's name is already set as
  // real text beside it.
  if (!image || failed) {
    return <div className={cn('aspect-[16/9] bg-surface-sunken', className)} aria-hidden="true" />;
  }

  const widest = image.widths[image.widths.length - 1]!;
  const srcSet = (ext: string) =>
    image.widths.map((w) => `${image.basePath}-${w}.${ext} ${w}w`).join(', ');

  return (
    <div className={cn('relative aspect-[16/9] overflow-hidden bg-surface-sunken', className)}>
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <img
          src={`${image.basePath}-${widest}.jpg`}
          srcSet={srcSet('jpg')}
          sizes={sizes}
          width={widest}
          height={Math.round((widest / 16) * 9)}
          alt={image.alt}
          loading={priority ? 'eager' : 'lazy'}
          // Lowercase: React 18 does not recognise the camelCase form and
          // passes it straight through, warning on every render.
          {...{ fetchpriority: priority ? 'high' : 'auto' }}
          decoding={priority ? 'sync' : 'async'}
          onError={() => setFailed(true)}
          className={cn('size-full object-cover', imgClassName)}
        />
      </picture>
    </div>
  );
}
