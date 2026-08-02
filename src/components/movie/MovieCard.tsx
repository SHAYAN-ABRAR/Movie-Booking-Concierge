import { Link } from 'react-router-dom';
import { Plate } from '@/components/brand/Plate';
import { CertificateChip } from './Chips';
import { formatRuntime } from '@/lib/datetime';
import { genreLabels, languageLabels } from '@/data';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * A catalogue entry.
 *
 * The whole card is one link, and the plate is decorative, so assistive
 * technology gets a single meaningful target rather than a picture link
 * followed by a duplicate text link.
 */
export function MovieCard({
  movie,
  className,
  showSynopsis = false,
}: {
  movie: Movie;
  className?: string;
  showSynopsis?: boolean;
}) {
  return (
    <article className={cn('group', className)}>
      <Link
        to={`/movies/${movie.slug}`}
        className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        <Plate
          movie={movie}
          className="transition-transform duration-[--dur-slow] ease-[--ease-out] group-hover:-translate-y-1"
        />

        <div className="mt-3.5">
          <h3 className="font-display text-lg leading-[1.15] tracking-[-0.015em] underline-offset-4 group-hover:underline">
            {movie.title}
          </h3>
          {movie.titleBn ? (
            <p lang="bn" className="mt-0.5 text-[0.8125rem] text-content-faint">
              {movie.titleBn}
            </p>
          ) : null}

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-content-muted">
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
        'group flex gap-3 border border-hairline bg-surface-raised p-2.5 transition-colors hover:border-hairline-strong',
        className,
      )}
    >
      <Plate movie={movie} variant="card" className="w-16 shrink-0" />
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
