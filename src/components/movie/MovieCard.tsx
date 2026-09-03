import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MovieImage } from '@/components/visual/MovieImage';
import { CertificateChip } from './Chips';
import { TrailerButton } from './TrailerDialog';
import { genreLabels, languageLabels } from '@/data';
import { runtimeLabelShort, statusLabel } from '@/lib/movieMeta';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * A catalogue entry.
 *
 * Poster-first and numbered, the way a festival programme numbers its
 * entries — the index is stamped into the top-left corner of the artwork
 * rather than floated over it, so the card reads as a printed plate.
 *
 * The whole card is one link and the artwork's alt text carries the film, so
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
  index,
}: {
  movie: Movie;
  className?: string;
  showSynopsis?: boolean;
  /** Position in the programme. Stamped onto the artwork when given. */
  index?: number;
}) {
  const { t } = useTranslation();
  return (
    <article className={cn('group relative', className)}>
      <Link
        to={`/movies/${movie.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        <div className="relative overflow-hidden bg-surface-sunken">
          <MovieImage
            movie={movie}
            role="poster"
            // One card is ~200px on a phone and ~300px in the widest grid.
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 300px"
            imgClassName={cn(
              'transition-transform duration-[--dur-slow] ease-[--ease-out]',
              'group-hover:scale-[1.035] group-focus-within:scale-[1.035]',
              'motion-reduce:transform-none',
            )}
          />

          {/* The programme number, printed into the corner of the plate. */}
          {index !== undefined ? (
            <span
              aria-hidden="true"
              className="index-mark absolute left-0 top-0 bg-content px-2 py-1 text-[0.8125rem] text-surface"
            >
              {String(index).padStart(2, '0')}
            </span>
          ) : null}

          {/* Status, for a film that is not on sale yet. */}
          {movie.status === 'coming-soon' ? (
            <span className="absolute right-0 top-0 bg-accent px-2 py-1 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-accent-contrast">
              {statusLabel(movie)}
            </span>
          ) : null}

          {/* The projection edge, drawn on from the left on approach. */}
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-x-0 bottom-0 block h-[4px] origin-left scale-x-0 bg-accent',
              'transition-transform duration-[--dur-base] ease-[--ease-out]',
              'group-hover:scale-x-100 group-focus-within:scale-x-100',
            )}
          />
        </div>

        <div className="mt-3.5">
          {/* The title is real text under the poster, not drawn into it. */}
          <h3
            className={cn(
              'font-display text-[1.375rem] uppercase leading-[0.95] [overflow-wrap:anywhere]',
              'transition-colors duration-[--dur-fast]',
              'group-hover:text-accent group-focus-within:text-accent',
            )}
          >
            {movie.title}
          </h3>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-content-muted">
            {movie.certificateConfirmed ? (
              <CertificateChip code={movie.certificate} />
            ) : (
              <span className="border border-hairline-strong px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.08em]">
                {t('movieCard.notYetRated')}
              </span>
            )}
            <span className="numeral">{runtimeLabelShort(movie)}</span>
            <span aria-hidden="true">·</span>
            <span>{languageLabels[movie.language]}</span>
          </p>

          <p className="mt-1.5 text-[0.6875rem] uppercase tracking-[0.1em] text-content-faint">
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
              'mt-2.5 inline-flex items-center gap-1',
              'text-[0.625rem] font-bold uppercase tracking-[0.12em] text-accent',
              'opacity-0 transition-opacity duration-[--dur-fast]',
              'group-hover:opacity-100 group-focus-within:opacity-100',
              // Touch devices never receive hover, so the cue is simply always on.
              '[@media(hover:none)]:opacity-100',
            )}
          >
            {movie.status === 'coming-soon'
              ? t('movieCard.releaseDetails')
              : t('movieCard.viewShowtimes')}
            <ArrowUpRight
              className="size-3.5 transition-transform duration-[--dur-base] ease-[--ease-out] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </p>
        </div>
      </Link>

      {/*
       * A sibling of the Link, never a child of it.
       *
       * The whole card is one anchor, and an interactive control inside an
       * anchor is invalid HTML — the browser resolves the nesting however it
       * likes, and a keyboard user ends up with one focus stop that does two
       * things. Positioning it over the poster keeps it where a pointer expects
       * it while leaving it a separate tab stop.
       *
       * It stays visible on touch, where there is no hover to reveal it.
       */}
      {movie.trailer ? (
        <div
          className={cn(
            'absolute bottom-auto right-0 top-0',
            movie.status === 'coming-soon' ? 'top-7' : '',
            'opacity-0 transition-opacity duration-[--dur-fast]',
            'group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100',
            '[@media(hover:none)]:opacity-100',
          )}
        >
          <TrailerButton
            movie={movie}
            variant="ghost"
            size="icon-sm"
            iconOnly
            className="bg-house/80 text-house-ink backdrop-blur-[2px] hover:bg-accent hover:text-accent-contrast"
          />
        </div>
      ) : null}
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
        'transition-colors duration-[--dur-fast] hover:border-content',
        className,
      )}
    >
      <MovieImage movie={movie} role="poster" sizes="56px" className="w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-[1.0625rem] uppercase leading-none group-hover:text-accent">
          {movie.title}
        </h3>
        <p className="numeral mt-1.5 truncate text-xs text-content-muted">
          {runtimeLabelShort(movie)} · {languageLabels[movie.language]}
        </p>
        <p className="mt-1 truncate text-[0.6875rem] uppercase tracking-[0.08em] text-content-faint">
          {movie.genres.map((g) => genreLabels[g]).join(' · ')}
        </p>
      </div>
    </Link>
  );
}
