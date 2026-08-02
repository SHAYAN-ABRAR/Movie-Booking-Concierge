import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertificateChip } from '@/components/movie/Chips';
import { CinematicArtwork } from '@/components/visual/CinematicArtwork';
import { artworkFor } from '@/data/artwork';
import { genreLabels, languageLabels, nowShowing } from '@/data';
import { formatRuntime, todayIso } from '@/lib/datetime';
import { rngFor, seededShuffle } from '@/lib/deterministic';
import { useMotionPreferences, usePageVisible } from '@/motion';
import { duration, ease, sceneTransition } from '@/motion';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';

const ADVANCE_MS = 9000;

/**
 * The projection stage.
 *
 * Three films from this week's programme, each arriving as one composed scene:
 * artwork, type and accent change together rather than a picture sliding
 * behind fixed text. That is the difference between a carousel and a stage.
 *
 * Auto-advance is heavily conditioned — it runs only when reduced motion is
 * off, the tab is visible, the stage is in view, and the customer has not
 * touched the controls. Any interaction stops it permanently for the visit,
 * and there is an explicit pause control regardless.
 */
export function FeaturedStage() {
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
  const direction = artworkFor(movie);

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

  return (
    <div ref={stageRef} className="relative">
      {/* ── Artwork bed ──────────────────────────────────────────────
          Sits behind the type on small screens and beside it from lg up,
          bleeding off the right edge so the composition is not a boxed
          picture in a column. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 -z-10 overflow-hidden',
          // Bleeds past the shell gutter so the stage reaches the screen edge
          // instead of stopping short of it.
          '-right-[max(1rem,var(--safe-r))] left-[-1rem] lg:left-auto lg:w-[46%]',
          'lg:-right-12',
        )}
      >
        <AnimatePresence mode="wait">
          <m.div
            key={movie.id}
            variants={motion.reduced ? undefined : sceneTransition}
            initial={motion.reduced ? false : 'initial'}
            animate="animate"
            exit="exit"
            className="size-full"
          >
            <CinematicArtwork
              movie={movie}
              variant="hero"
              animated
              className="size-full [&>svg]:size-full"
            />
          </m.div>
        </AnimatePresence>

        {/* Paper reclaims only the left edge of the bed, so type never sits on
            a busy field but the artwork still reads as artwork. On mobile the
            bed sits behind the type, so it is dimmed much harder. */}
        <div className="absolute inset-0 bg-gradient-to-r from-paper from-10% via-paper/45 via-38% to-transparent to-72% lg:via-paper/20 lg:via-30%" />
        {/* On small screens the artwork sits *behind* body copy rather than
            beside it, so it is held right back — atmosphere, not competition. */}
        <div className="absolute inset-0 bg-paper/80 lg:hidden" />

        {/* The projection edge. Defines the stage against the paper instead of
            letting a light-ground film dissolve into it. */}
        <div className="absolute inset-y-0 left-0 hidden w-px bg-ink/25 lg:block" />
      </div>

      {/* ── Editorial column ─────────────────────────────────────────── */}
      <div className="relative grid gap-10 py-10 lg:grid-cols-[minmax(0,0.56fr)_minmax(0,0.44fr)] lg:py-16">
        <div className="flex min-w-0 flex-col">
          <AnimatePresence mode="wait">
            <m.div
              key={movie.id}
              initial={motion.reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={motion.reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: motion.reduced ? 0 : duration.base, ease: ease.entrance }}
            >
              <h1 className="font-display text-[2.75rem] leading-[0.94] tracking-[-0.035em] sm:text-[4rem] lg:text-[5rem]">
                {movie.title}
              </h1>
              {movie.titleBn ? (
                <p lang="bn" className="mt-2 font-display text-2xl text-ink-muted sm:text-3xl">
                  {movie.titleBn}
                </p>
              ) : null}

              <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
                <CertificateChip code={movie.certificate} />
                <span className="numeral">{formatRuntime(movie.runtimeMinutes)}</span>
                <span aria-hidden="true">·</span>
                <span>{languageLabels[movie.language]}</span>
                <span aria-hidden="true">·</span>
                <span>{movie.genres.map((g) => genreLabels[g]).join(' / ')}</span>
                <span aria-hidden="true">·</span>
                <span>dir. {movie.director}</span>
              </p>

              <blockquote
                className="mt-7 max-w-xl border-l-2 pl-5"
                style={{ borderColor: direction.accent }}
              >
                <p className="font-display text-[1.25rem] leading-[1.45] tracking-[-0.01em] sm:text-[1.4rem]">
                  {movie.programmeNote}
                </p>
                <footer className="eyebrow mt-3">From this week's programme notes</footer>
              </blockquote>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to={`/booking/${movie.slug}`}>
                    Book {movie.title}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to={`/movies/${movie.slug}`}>Read more</Link>
                </Button>
              </div>
            </m.div>
          </AnimatePresence>

          {/* ── Stage controls ─────────────────────────────────────── */}
          {featured.length > 1 ? (
            <div className="mt-9 flex items-center gap-3">
              <ul className="flex items-center gap-2" role="list">
                {featured.map((film, i) => {
                  const active = i === index;
                  return (
                    <li key={film.id}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={active ? 'true' : undefined}
                        aria-label={`Show ${film.title} (${i + 1} of ${featured.length})`}
                        className={cn(
                          'group relative flex h-8 items-end gap-2 px-1',
                          'transition-opacity duration-[--dur-fast]',
                          active ? 'opacity-100' : 'opacity-45 hover:opacity-80',
                        )}
                      >
                        <span className="numeral text-[0.6875rem] font-semibold tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="relative block h-[3px] w-10 bg-ink/20">
                          {active ? (
                            <m.span
                              layoutId="stage-progress"
                              className="absolute inset-0 bg-ink"
                              transition={{ duration: motion.reduced ? 0 : 0.3, ease: ease.editorial }}
                            />
                          ) : null}
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
                  className="ml-1 grid size-8 place-items-center border border-hairline-strong text-ink-muted transition-colors hover:border-ink hover:text-ink"
                  aria-label={
                    userPaused || interacted
                      ? 'Resume the featured film sequence'
                      : 'Pause the featured film sequence'
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

          <p className="mt-6 max-w-md text-xs leading-5 text-ink-muted">
            Nokshi Cinemas is a demonstration build — the films, schedules and prices are sample
            data. You can complete a booking as a guest; no payment is taken.
          </p>
        </div>

        {/* The right column is intentionally empty at lg and up: it is the
            window the artwork bed shows through. */}
        <div aria-hidden="true" className="hidden lg:block" />
      </div>
    </div>
  );
}

export function featuredToday(): Movie[] {
  const pool = nowShowing.filter((movie) => movie.programmeNote);
  return seededShuffle(pool, rngFor(`stage|${todayIso()}`)).slice(0, 3);
}
