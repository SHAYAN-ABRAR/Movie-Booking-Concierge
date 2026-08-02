import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CinematicArtwork } from '@/components/visual/CinematicArtwork';
import { CertificateChip } from './Chips';
import { formatRuntime } from '@/lib/datetime';
import { artworkFor } from '@/data/artwork';
import { genreLabels, languageLabels } from '@/data';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * A catalogue entry.
 *
 * The whole card is one link and the artwork's SVG is `aria-hidden`, so
 * assistive technology gets a single meaningful target rather than a picture
 * link followed by a duplicate text link.
 *
 * Interaction is driven by CSS `group-hover` *and* `group-focus-within`, not by
 * pointer events. That is deliberate: a keyboard user tabbing to this card sees
 * exactly the same response a mouse user does, for free and with no JavaScript.
 * Nothing that appears on hover carries information — the contextual cue is a
 * restatement of where the link already goes.
 */
export function MovieCard({
  movie,
  className,
  showSynopsis = false,
  /** Lets the artwork's single moving layer run. Off in dense grids. */
  animated = false,
}: {
  movie: Movie;
  className?: string;
  showSynopsis?: boolean;
  animated?: boolean;
}) {
  const direction = artworkFor(movie);

  return (
    <article className={cn('group relative', className)}>
      <Link
        to={`/movies/${movie.slug}`}
        className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        {/* The frame lifts; the artwork inside it drifts a little further, so
            the composition reads as sitting behind glass rather than sliding. */}
        <div
          className={cn(
            'relative overflow-hidden',
            'transition-[transform,box-shadow] duration-[--dur-base] ease-[--ease-out]',
            'group-hover:-translate-y-1 group-focus-within:-translate-y-1',
            'shadow-[0_1px_0_0_rgb(20_22_31_/_0.08)]',
            'group-hover:shadow-[0_18px_36px_-20px_rgb(20_22_31_/_0.45)]',
            'group-focus-within:shadow-[0_18px_36px_-20px_rgb(20_22_31_/_0.45)]',
          )}
        >
          <div className="transition-transform duration-[--dur-slow] ease-[--ease-out] group-hover:scale-[1.035] group-focus-within:scale-[1.035]">
            <CinematicArtwork movie={movie} variant="card" animated={animated} />
          </div>

          {/* Projected light crossing the frame on approach. Decorative only. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12',
              'bg-gradient-to-r from-transparent via-white/12 to-transparent',
              'opacity-0 transition-all duration-[--dur-slow] ease-[--ease-out]',
              'group-hover:left-[110%] group-hover:opacity-100',
              'group-focus-within:left-[110%] group-focus-within:opacity-100',
              'motion-reduce:hidden',
            )}
          />

          {/* A rule drawn along the bottom edge in the film's own accent. */}
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0',
              'transition-transform duration-[--dur-base] ease-[--ease-out]',
              'group-hover:scale-x-100 group-focus-within:scale-x-100',
            )}
            style={{ backgroundColor: direction.accent }}
          />
        </div>

        <div className="mt-3.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-content-muted">
            <CertificateChip code={movie.certificate} />
            <span className="numeral">{formatRuntime(movie.runtimeMinutes)}</span>
            <span aria-hidden="true">·</span>
            <span>{languageLabels[movie.language]}</span>
          </p>

          <p className="mt-1.5 text-[0.8125rem] text-content-faint">
            {movie.genres.map((g) => genreLabels[g]).join(' · ')}
          </p>

          {showSynopsis ? (
            <p className="mt-2.5 line-clamp-3 text-[0.875rem] leading-6 text-content-muted">
              {movie.tagline}
            </p>
          ) : null}

          {/* Restates the destination. It is never the only route to this
              information, so nothing is lost on a touch device. */}
          <p
            aria-hidden="true"
            className={cn(
              'mt-2.5 inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-content',
              'opacity-0 transition-opacity duration-[--dur-fast]',
              'group-hover:opacity-100 group-focus-within:opacity-100',
              // Touch devices never receive hover, so the cue is simply always on.
              '[@media(hover:none)]:opacity-100',
            )}
          >
            View showtimes
            <ArrowUpRight
              className="size-3.5 transition-transform duration-[--dur-base] ease-[--ease-out] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </p>
        </div>
      </Link>
    </article>
  );
}

/** The compact form used in rails and in Max's result blocks. */
export function MovieTile({ movie, className }: { movie: Movie; className?: string }) {
  return (
    <Link
      to={`/movies/${movie.slug}`}
      className={cn(
        'group flex gap-3 border border-hairline bg-surface-raised p-2.5',
        'transition-colors duration-[--dur-fast] hover:border-hairline-strong',
        className,
      )}
    >
      <CinematicArtwork movie={movie} variant="mark" className="size-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base leading-tight group-hover:underline">
          {movie.title}
        </h3>
        <p className="mt-1 truncate text-xs text-content-muted">
          {formatRuntime(movie.runtimeMinutes)} · {languageLabels[movie.language]}
        </p>
        <p className="mt-1 truncate text-xs text-content-faint">
          {movie.genres.map((g) => genreLabels[g]).join(', ')}
        </p>
      </div>
    </Link>
  );
}
