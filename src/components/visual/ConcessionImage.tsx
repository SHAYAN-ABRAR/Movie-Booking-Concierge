import { useState } from 'react';
import { concessionImageById } from '@/data/concessionMedia';
import type { ConcessionItem } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * The counter item's generated image.
 *
 * These are AI-generated illustrations, committed locally and served as three
 * widths in AVIF → WebP → JPEG. Intrinsic dimensions are always set so the grid
 * reserves the box before the bytes land and nothing shifts as the counter
 * loads. The customer-facing disclosure that these are illustrations lives on
 * the concessions route and the booking step, not on every card.
 */
export function ConcessionImage({
  item,
  className,
  imgClassName,
  sizes = '(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 30vw',
  priority = false,
}: {
  item: ConcessionItem;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const image = concessionImageById.get(item.id);
  const [failed, setFailed] = useState(false);

  // No image on file, or it failed to decode. A typeset panel naming the item
  // is a better answer than a broken-image icon.
  if (!image || failed) {
    return (
      <div
        className={cn(
          'grid aspect-[4/3] place-items-center bg-surface-sunken px-4 text-center',
          className,
        )}
      >
        <p className="font-display text-base leading-tight text-content-muted">{item.name}</p>
      </div>
    );
  }

  const widest = image.widths[image.widths.length - 1]!;
  const srcSet = (ext: string) =>
    image.widths.map((w) => `${image.basePath}-${w}.${ext} ${w}w`).join(', ');

  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden bg-surface-sunken', className)}>
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <img
          src={`${image.basePath}-${widest}.jpg`}
          srcSet={srcSet('jpg')}
          sizes={sizes}
          width={widest}
          height={Math.round((widest / 4) * 3)}
          alt={image.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('size-full object-cover', imgClassName)}
        />
      </picture>
    </div>
  );
}
