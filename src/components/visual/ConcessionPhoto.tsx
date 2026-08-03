import { useState } from 'react';
import { concessionPhotoById } from '@/data/concessionMedia';
import type { ConcessionItem } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * A real photograph of a real item on the counter.
 *
 * Replaces the hand-drawn illustrations entirely — the drawings are gone from
 * the card, not layered behind a picture.
 *
 * Local files only, three widths, AVIF → WebP → JPEG. Intrinsic dimensions are
 * always set so the grid reserves the box before the bytes land and nothing
 * shifts as the counter loads.
 */
export function ConcessionPhoto({
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
  const photo = concessionPhotoById.get(item.id);
  const [failed, setFailed] = useState(false);

  // No photograph on file, or it failed to decode. A typeset panel naming the
  // item is a better answer than a broken-image icon — and it is still not an
  // illustration of the food.
  if (!photo || failed) {
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

  const widest = photo.widths[photo.widths.length - 1]!;
  const srcSet = (ext: string) =>
    photo.widths.map((w) => `${photo.basePath}-${w}.${ext} ${w}w`).join(', ');

  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden bg-surface-sunken', className)}>
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <img
          src={`${photo.basePath}-${widest}.jpg`}
          srcSet={srcSet('jpg')}
          sizes={sizes}
          width={widest}
          height={Math.round((widest / 4) * 3)}
          alt={photo.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('size-full object-cover', imgClassName)}
        />
      </picture>
    </div>
  );
}
