import { useState } from 'react';
import { mediaByMovie } from '@/data/mediaManifest';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * Real film artwork.
 *
 * Serves local files only — `public/media/movies/`. Nothing here contacts a
 * remote host, and there is no API key anywhere in the client.
 *
 * Each image ships as AVIF, WebP and JPEG at three widths. `<picture>` lets the
 * browser take the best format it understands; `srcSet` + `sizes` let it take
 * the right width for the slot it is being drawn into.
 *
 * Intrinsic `width`/`height` are always set, so the box is reserved before the
 * bytes arrive and the layout does not shift.
 */

type Role = 'poster' | 'backdrop';

/** Aspect ratio per role. Posters are the conventional 2:3. */
const RATIO: Record<Role, { w: number; h: number; className: string }> = {
  poster: { w: 2, h: 3, className: 'aspect-[2/3]' },
  backdrop: { w: 16, h: 9, className: 'aspect-[16/9]' },
};

interface MovieImageProps {
  movie: Movie;
  role?: Role;
  /**
   * The `sizes` attribute. Get this right and the browser downloads a 200px
   * file for a 200px card instead of a 600px one.
   */
  sizes?: string;
  /** `eager` only for the one image above the fold; everything else is lazy. */
  priority?: boolean;
  className?: string;
  /** Applied to the `<img>` itself — where object-fit/scale transforms belong. */
  imgClassName?: string;
}

export function MovieImage({
  movie,
  role = 'poster',
  sizes,
  priority = false,
  className,
  imgClassName,
}: MovieImageProps) {
  const asset = mediaByMovie.get(movie.id)?.[role];
  const ratio = RATIO[role];
  const [failed, setFailed] = useState(false);

  // No manifest entry, or the file failed to decode. Rather than a broken image
  // icon, fall back to a typeset panel that still names the film.
  if (!asset || failed) {
    return (
      <div
        className={cn(
          'relative grid place-items-center overflow-hidden bg-surface-sunken',
          ratio.className,
          className,
        )}
      >
        <p className="px-4 text-center font-display text-lg leading-tight text-content-muted">
          {movie.title}
        </p>
      </div>
    );
  }

  const widest = asset.widths[asset.widths.length - 1]!;
  const height = Math.round((widest / ratio.w) * ratio.h);
  const srcSet = (ext: string) =>
    asset.widths.map((w) => `${asset.basePath}-${w}.${ext} ${w}w`).join(', ');

  return (
    <div className={cn('relative overflow-hidden bg-surface-sunken', ratio.className, className)}>
      <picture>
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
        <img
          src={`${asset.basePath}-${widest}.jpg`}
          srcSet={srcSet('jpg')}
          sizes={sizes}
          width={widest}
          height={height}
          alt={asset.alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          onError={() => setFailed(true)}
          style={{ objectPosition: asset.focalPoint }}
          className={cn('size-full object-cover', imgClassName)}
        />
      </picture>
    </div>
  );
}

/**
 * The poster as a decorative layer — for places where the film's title is
 * already set as real text beside it and repeating it would be noise.
 */
export function MovieImageDecorative(props: MovieImageProps) {
  const asset = mediaByMovie.get(props.movie.id)?.[props.role ?? 'poster'];
  if (!asset) return <MovieImage {...props} />;
  return (
    <div aria-hidden="true">
      <MovieImage {...props} />
    </div>
  );
}
