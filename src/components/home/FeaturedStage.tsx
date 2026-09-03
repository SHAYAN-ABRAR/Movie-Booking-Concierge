import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertificateChip } from '@/components/movie/Chips';
import { TrailerButton } from '@/components/movie/TrailerDialog';
import { MovieImage } from '@/components/visual/MovieImage';
import { genreLabels, languageLabels, nowShowing } from '@/data';
import { formatRuntime, todayIso } from '@/lib/datetime';
import { rngFor, seededShuffle } from '@/lib/deterministic';
import { useMotionPreferences, usePageVisible } from '@/motion';
import { duration, ease } from '@/motion';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const ADVANCE_MS = 9000;

/**
 * The stage.
 *
 * Three films from this week's programme, each arriving as one composed scene:
 * artwork, type and metadata change together rather than a picture sliding
 * behind fixed text. That is the difference between a carousel and a stage.
 *
 * The composition is a theatrical one-sheet rather than a hero banner. The
 * title runs the full measure at a size no other type on the site is allowed
 * to take; the artwork sits underneath it in a hard frame; the metadata reads
 * as a single tabular line, the way a film festival sets a credit block.
 * Nothing important is revealed by hovering and nothing is hidden behind the
 * artwork — the two booking routes are buttons, always visible, always first
 * in the tab order after the title.
 *
 * Auto-advance is heavily conditioned — it runs only when reduced motion is
 * off, the tab is visible, the stage is in view, and the customer has not
 * touched the controls. Any interaction stops it permanently for the visit,
 * and there is an explicit pause control regardless.
 */
export function FeaturedStage() {
  const { t } = useTranslation();
  const motion = useMotionPreferences();
  const pageVisible = usePageVisible();

  const featured = useMemo(() => {
    // Stable for the whole day, different tomorrow.
    const pool = nowShowing.filter((movie) => movie.programmeNote);
    return seededShuffle(pool, rngFor(`stage|${todayIso()}`)).slice(0, 3);
  }, []);

  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [inView, setInView] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  const movie = featured[index] ?? nowShowing[0]!;

  /* ── Only advance while the stage is actually on screen ─────────────── */
  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const canAutoAdvance =
    !motion.reduced && pageVisible && inView && !userPaused && !interacted && featured.length > 1;

  useEffect(() => {
    if (!canAutoAdvance) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % featured.length),
      ADVANCE_MS,
    );
    return () => window.clearInterval(timer);
  }, [canAutoAdvance, featured.length]);

  const goTo = useCallback((next: number) => {
    setInteracted(true);
    setIndex(next);
  }, []);

  const enter = motion.reduced
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: duration.base, ease: ease.entrance },
      };

  return (
    <div ref={stageRef} className="pb-10 pt-4 lg:pb-14">
      {/* ── The credit rail ───────────────────────────────────────────
          `NOW SHOWING` on the left, the position in the sequence on the
          right. The whole system's Swiss half in one line. */}
      <div className="slab flex items-baseline justify-between gap-4 pt-3">
        <p className="eyebrow text-content">{t('featured.nowShowing')}</p>
        <p aria-hidden="true" className="index-mark text-[0.875rem]">
          <span className="text-accent">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-content-faint"> / {String(featured.length).padStart(2, '0')}</span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        <m.div key={movie.id} {...enter}>
          {/* ── The title, at the size a one-sheet sets it ───────────── */}
          <h1
            className="mt-5 font-display uppercase leading-[0.84] tracking-[-0.035em] [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(2.75rem, 9.5vw, 8rem)' }}
          >
            {movie.title}
          </h1>
          {movie.titleBn ? (
            <p
              lang="bn"
              className="mt-2 font-display text-[1.5rem] leading-tight text-content-muted sm:text-[2rem]"
            >
              {movie.titleBn}
            </p>
          ) : null}

          {/* ── Artwork beside the credit block ─────────────────────── */}
          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
            <div className="relative overflow-hidden border-2 border-content bg-surface-sunken">
              <MovieImage
                movie={movie}
                role="backdrop"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              {/* The programme note, set over the foot of the still. It is
                  editorial copy rather than a caption, so it is real text in
                  the flow, not baked into the picture. */}
              {movie.programmeNote ? (
                <figure className="absolute inset-x-0 bottom-0 hidden bg-house/85 px-5 py-4 backdrop-blur-[3px] sm:block">
                  <blockquote className="border-l-2 border-accent pl-4">
                    <p className="max-w-2xl text-[0.9375rem] leading-[1.5] text-house-ink">
                      {movie.programmeNote}
                    </p>
                  </blockquote>
                  <figcaption className="eyebrow mt-2 pl-4 text-house-faint">
                    {t('featured.programmeNotes')}
                  </figcaption>
                </figure>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col">
              {/* ── The credit block ───────────────────────────────── */}
              <dl className="border-t-2 border-content">
                {[
                  { label: t('movieDetails.credits.director'), value: movie.director },
                  { label: t('movieDetails.credits.runtime'), value: formatRuntime(movie.runtimeMinutes) },
                  { label: t('movieDetails.credits.language'), value: languageLabels[movie.language] },
                  {
                    label: t('movieDetails.credits.genre'),
                    value: movie.genres.map((g) => genreLabels[g]).join(' · '),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5"
                  >
                    <dt className="eyebrow shrink-0">{row.label}</dt>
                    <dd className="min-w-0 text-right text-[0.875rem] font-medium">{row.value}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5">
                  <dt className="eyebrow shrink-0">{t('movieDetails.credits.certificate')}</dt>
                  <dd>
                    <CertificateChip code={movie.certificate} />
                  </dd>
                </div>
              </dl>

              {/* On small screens the note has nowhere to sit over the still,
                  so it moves into the column instead of being dropped. */}
              {movie.programmeNote ? (
                <blockquote className="mt-5 border-l-2 border-accent pl-4 sm:hidden">
                  <p className="text-[0.9375rem] leading-[1.55] text-content-muted">
                    {movie.programmeNote}
                  </p>
                </blockquote>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Button asChild variant="accent" size="lg">
                  <Link to={`/booking/${movie.slug}`}>
                    {t('featured.bookFilm', { title: movie.title })}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                {movie.trailer ? (
                  <TrailerButton movie={movie} variant="outline" size="lg" />
                ) : null}
                <Button asChild variant="ghost" size="lg" className="px-3">
                  <Link to={`/movies/${movie.slug}`}>{t('featured.fullDetails')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </m.div>
      </AnimatePresence>

      {/* ── Stage controls ─────────────────────────────────────────────
          Numbered, with the film's name on each control rather than a dot,
          so the sequence can be navigated without guessing. */}
      {featured.length > 1 ? (
        <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3 border-t border-hairline pt-4">
          <ul className="flex flex-wrap items-stretch gap-x-2 gap-y-2" role="list">
            {featured.map((film, i) => {
              const active = i === index;
              return (
                <li key={film.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={active ? 'true' : undefined}
                    aria-label={t('featured.showFilm', {
                      title: film.title,
                      position: i + 1,
                      total: featured.length,
                    })}
                    className={cn(
                      'group flex max-w-[13rem] flex-col gap-1.5 border-t-2 pt-2 text-left',
                      'transition-colors duration-[--dur-fast]',
                      active
                        ? 'border-accent text-content'
                        : 'border-hairline-strong text-content-faint hover:border-content hover:text-content',
                    )}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="numeral text-[0.625rem] font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.1em]">
                        {film.title}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!motion.reduced ? (
            <button
              type="button"
              onClick={() => {
                setUserPaused((paused) => !paused);
                setInteracted(true);
              }}
              className="ml-auto grid size-9 shrink-0 place-items-center border border-hairline-strong text-content-muted transition-colors hover:border-content hover:bg-content hover:text-surface"
              aria-label={
                userPaused || interacted
                  ? t('featured.resumeSequence')
                  : t('featured.pauseSequence')
              }
            >
              {userPaused || interacted ? (
                <Play aria-hidden="true" className="size-3.5" />
              ) : (
                <Pause aria-hidden="true" className="size-3.5" />
              )}
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 max-w-2xl text-xs leading-5 text-content-faint">{t('featured.demoNote')}</p>
    </div>
  );
}

export function featuredToday(): Movie[] {
  const pool = nowShowing.filter((movie) => movie.programmeNote);
  return seededShuffle(pool, rngFor(`stage|${todayIso()}`)).slice(0, 3);
}
