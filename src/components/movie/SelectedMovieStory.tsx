import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useMotionPreferences } from '@/motion';
import { duration, ease } from '@/motion/tokens';
import { MovieImage } from '@/components/visual/MovieImage';
import { CertificateChip } from '@/components/movie/Chips';
import { TrailerButton } from '@/components/movie/TrailerDialog';
import { Button } from '@/components/ui/button';
import { genreKeys, languageKeys } from '@/i18n/domain';
import { formatRuntime } from '@/lib/datetime';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * What you are about to book, in three sentences.
 *
 * Sits under the *selected* film in the booking surfaces — Quick Book, the
 * Showtimes selector, booking step one. Not under every card: a story beneath
 * fourteen posters is wallpaper, and the point is to answer the question
 * someone asks once they have narrowed down to one.
 *
 * `shortStory` rather than `synopsis` deliberately. The synopsis is a paragraph
 * for browsing; this is for the moment just before paying.
 */

/** How much of the story fits before the mobile fold. */
const PREVIEW_CHARACTERS = 140;

export function SelectedMovieStory({
  movie,
  className,
  /** Hidden on surfaces that already link to the film elsewhere. */
  showDetailsLink = true,
}: {
  movie: Movie | null | undefined;
  className?: string;
  showDetailsLink?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const motion = useMotionPreferences();
  const [expanded, setExpanded] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const previous = useRef<string | null>(null);

  const story = i18n.language === 'bn' ? movie?.shortStoryBn : movie?.shortStory;
  const needsExpansion = (story?.length ?? 0) > PREVIEW_CHARACTERS;

  useEffect(() => {
    if (!movie) return;
    // Collapse when the film changes — leaving it expanded would carry one
    // film's reading state onto the next.
    setExpanded(false);
    // Skip the first render: announcing on arrival is noise, not a change.
    if (previous.current !== null && previous.current !== movie.id) {
      setAnnouncement(t('story.selected', { title: movie.title }));
    }
    previous.current = movie.id;
  }, [movie, t]);

  if (!movie || !story) return null;

  const visible = expanded || !needsExpansion ? story : `${story.slice(0, PREVIEW_CHARACTERS).trimEnd()}…`;

  return (
    <section
      aria-labelledby={`story-${movie.id}`}
      className={cn('border border-hairline-strong bg-surface-raised', className)}
    >
      {/* Polite, and only on a *change* of film — a screen-reader user who has
          just chosen something should hear what they chose, not have the whole
          panel read at them assertively while they are still typing. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={movie.id}
          initial={motion.reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={motion.reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={
            motion.reduced
              ? { duration: 0 }
              : { duration: duration.base, ease: ease.editorial }
          }
          className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5"
        >
          {/* Decorative: the title is set as real text immediately beside it,
              so an alt would just repeat it. */}
          <div aria-hidden="true" className="hidden w-28 shrink-0 sm:block">
            <MovieImage
              movie={movie}
              role="poster"
              sizes="112px"
              className="border border-hairline"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-1.5">{t('story.heading')}</p>
            <h3
              id={`story-${movie.id}`}
              className="font-display text-xl leading-tight tracking-[-0.02em]"
            >
              {movie.title}
            </h3>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-content-muted">
              <CertificateChip code={movie.certificate} />
              <span className="numeral">{formatRuntime(movie.runtimeMinutes)}</span>
              <span aria-hidden="true">·</span>
              <span>{t(languageKeys[movie.language])}</span>
              <span aria-hidden="true">·</span>
              <span>{t(genreKeys[movie.genres[0] ?? 'drama'])}</span>
            </p>

            <p className="mt-3 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
              {visible}
            </p>

            {needsExpansion ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="mt-1.5 text-[0.8125rem] font-semibold underline underline-offset-4"
              >
                {expanded ? t('story.showLess') : t('story.readMore')}
              </button>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <TrailerButton movie={movie} variant="outline" size="sm" />
              {showDetailsLink ? (
                <Button asChild variant="link" size="sm" className="px-1">
                  <Link to={`/movies/${movie.slug}`}>
                    {t('story.viewDetails')}
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </m.div>
      </AnimatePresence>
    </section>
  );
}
