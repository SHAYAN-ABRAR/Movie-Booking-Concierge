import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/common';
import { MovieCard } from '@/components/movie/MovieCard';
import { CertificateChip } from '@/components/movie/Chips';
import { ShowtimePill } from '@/components/showtime/ShowtimeButton';
import { OfferPlate } from '@/components/brand/Plate';
import { QuickBook } from '@/components/home/QuickBook';
import {
  cinemas,
  comingSoon,
  formatBlurbs,
  formatLabels,
  genreLabels,
  languageLabels,
  movieById,
  nowShowing,
  offers,
  showtimesForCinemaDate,
} from '@/data';
import { usePreferences } from '@/store/preferences';
import { dateWindow, formatRuntime, longDayLabel, minutesFromTime, todayIso } from '@/lib/datetime';
import { rngFor } from '@/lib/deterministic';
import { format } from 'date-fns';

/** Tonight's headline film — stable for the whole day, different tomorrow. */
function useFeatured() {
  return useMemo(() => {
    const today = todayIso();
    const pool = nowShowing.filter((m) => m.programmeNote);
    const index = Math.floor(rngFor(`featured|${today}`)() * pool.length);
    return pool[index] ?? nowShowing[0]!;
  }, []);
}

export function Home() {
  const featured = useFeatured();
  const preferredCinemaId = usePreferences((s) => s.cinemaId);
  const cinema = cinemas.find((c) => c.id === preferredCinemaId) ?? cinemas[0]!;
  const today = todayIso();

  // "Tonight" means screenings that have not started yet, from 17:00 onwards.
  const tonight = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return showtimesForCinemaDate(cinema.id, today)
      .filter((s) => minutesFromTime(s.time) >= Math.max(17 * 60, nowMinutes))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [cinema.id, today]);

  const tonightByMovie = useMemo(() => {
    const map = new Map<string, typeof tonight>();
    for (const showtime of tonight) {
      const list = map.get(showtime.movieId) ?? [];
      list.push(showtime);
      map.set(showtime.movieId, list);
    }
    return [...map.entries()].slice(0, 5);
  }, [tonight]);

  const weekEnd = dateWindow(7).at(-1)!;

  return (
    <>
      {/* ── Masthead ──────────────────────────────────────────────────── */}
      <section className="border-b-2 border-ink">
        <div className="shell grid gap-10 py-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14 lg:py-16">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="eyebrow">The Programme</p>
              <p className="numeral text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                {format(new Date(), 'd MMM')} – {format(new Date(weekEnd), 'd MMM yyyy')}
              </p>
            </div>

            <h1 className="mt-5 font-display text-[2.75rem] leading-[0.95] tracking-[-0.035em] sm:text-[4rem] lg:text-[5.25rem]">
              {featured.title}
            </h1>
            {featured.titleBn ? (
              <p lang="bn" className="mt-2 font-display text-2xl text-ink-muted sm:text-3xl">
                {featured.titleBn}
              </p>
            ) : null}

            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
              <CertificateChip code={featured.certificate} />
              <span className="numeral">{formatRuntime(featured.runtimeMinutes)}</span>
              <span aria-hidden="true">·</span>
              <span>{languageLabels[featured.language]}</span>
              <span aria-hidden="true">·</span>
              <span>{featured.genres.map((g) => genreLabels[g]).join(' / ')}</span>
              <span aria-hidden="true">·</span>
              <span>dir. {featured.director}</span>
            </p>

            <blockquote className="mt-7 max-w-xl border-l-2 border-marigold pl-5">
              <p className="font-display text-[1.25rem] leading-[1.45] tracking-[-0.01em] sm:text-[1.4rem]">
                {featured.programmeNote}
              </p>
              <footer className="eyebrow mt-3">From this week's programme notes</footer>
            </blockquote>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to={`/booking/${featured.slug}`}>
                  Book {featured.title}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={`/movies/${featured.slug}`}>Read more</Link>
              </Button>
            </div>

            <p className="mt-6 max-w-md text-xs leading-5 text-ink-muted">
              Nokshi Cinemas is a demonstration build — the films, schedules and prices are sample
              data. You can complete a booking as a guest; no payment is taken.
            </p>
          </div>

          <div className="lg:pt-2">
            <QuickBook />
          </div>
        </div>
      </section>

      {/* ── Tonight — a timetable, not a card grid ────────────────────── */}
      <section aria-labelledby="tonight-heading" className="shell py-12 sm:py-16">
        <SectionHeading
          id="tonight-heading"
          eyebrow={`${cinema.shortName} · ${longDayLabel(today)}`}
          title="On tonight"
          to="/showtimes"
          linkLabel="All showtimes"
        />

        {tonightByMovie.length === 0 ? (
          <div className="border border-dashed border-hairline-strong px-6 py-10">
            <p className="max-w-prose text-[0.9375rem] leading-7 text-ink-muted">
              Tonight's screenings at {cinema.name} have all started. The programme picks up again
              tomorrow morning —{' '}
              <Link to="/showtimes" className="font-semibold underline underline-offset-4">
                see tomorrow's times
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline border-y border-hairline">
            {tonightByMovie.map(([movieId, showtimes]) => {
              const movie = movieById.get(movieId);
              if (!movie) return null;
              return (
                <li key={movieId} className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
                  <div className="min-w-0">
                    <Link
                      to={`/movies/${movie.slug}`}
                      className="font-display text-[1.375rem] leading-tight tracking-[-0.02em] underline-offset-4 hover:underline"
                    >
                      {movie.title}
                    </Link>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-ink-muted">
                      <CertificateChip code={movie.certificate} />
                      <span className="numeral">{formatRuntime(movie.runtimeMinutes)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{languageLabels[movie.language]}</span>
                    </p>
                    <p className="mt-2 max-w-prose text-[0.875rem] leading-6 text-ink-muted">
                      {movie.tagline}
                    </p>
                  </div>
                  <ul className="flex flex-wrap content-start gap-1.5 md:justify-end">
                    {showtimes.slice(0, 6).map((showtime) => (
                      <li key={showtime.id}>
                        <ShowtimePill showtime={showtime} />
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Now showing — the grid belongs here and only here ─────────── */}
      <section aria-labelledby="now-showing-heading" className="shell py-12 sm:py-16">
        <SectionHeading
          id="now-showing-heading"
          eyebrow={`${nowShowing.length} films`}
          title="Now showing"
          to="/movies"
          linkLabel="Full programme"
        />
        <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
          {nowShowing.slice(0, 5).map((movie) => (
            <li key={movie.id}>
              <MovieCard movie={movie} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── The houses — editorial, set in two columns ────────────────── */}
      <section aria-labelledby="houses-heading" className="border-y border-hairline bg-paper-sunken/50">
        <div className="shell py-12 sm:py-16">
          <SectionHeading
            id="houses-heading"
            eyebrow="How we show films"
            title="Four ways to watch"
            to="/ticket-prices"
            linkLabel="What it costs"
            className="border-hairline-strong"
          />
          <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {(['standard', 'three-d', 'grandscreen', 'velvet'] as const).map((formatId, index) => (
              <div key={formatId} className="flex gap-5">
                <span
                  aria-hidden="true"
                  className="numeral shrink-0 font-display text-3xl leading-none text-ink/25"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <dt className="font-display text-xl leading-tight tracking-[-0.02em]">
                    {formatLabels[formatId]}
                  </dt>
                  <dd className="mt-1.5 max-w-prose text-[0.9375rem] leading-7 text-ink-muted">
                    {formatBlurbs[formatId]}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Coming soon — a dated list, not cards ─────────────────────── */}
      <section aria-labelledby="coming-heading" className="shell py-12 sm:py-16">
        <SectionHeading
          id="coming-heading"
          eyebrow="Advance notice"
          title="Coming soon"
          to="/movies?status=coming-soon"
          linkLabel="All upcoming"
        />
        <ol className="border-t-2 border-ink">
          {comingSoon.map((movie) => (
            <li key={movie.id} className="border-b border-hairline">
              <Link
                to={`/movies/${movie.slug}`}
                className="group grid items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
              >
                <span className="numeral text-sm uppercase tracking-[0.1em] text-ink-muted">
                  {format(new Date(movie.releaseDate), 'd MMM yyyy')}
                </span>
                <span className="min-w-0">
                  <span className="font-display text-[1.375rem] leading-tight tracking-[-0.02em] group-hover:underline">
                    {movie.title}
                  </span>
                  <span className="mt-1 block max-w-prose text-[0.875rem] leading-6 text-ink-muted">
                    {movie.tagline}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-[0.8125rem] text-ink-muted">
                  <span>{languageLabels[movie.language]}</span>
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Offers ────────────────────────────────────────────────────── */}
      <section aria-labelledby="offers-heading" className="shell py-12 sm:py-16">
        <SectionHeading
          id="offers-heading"
          eyebrow="Running now"
          title="Offers"
          to="/offers"
          linkLabel="All offers"
        />
        <ul className="grid gap-6 md:grid-cols-2">
          {offers.slice(0, 2).map((offer) => (
            <li key={offer.id}>
              <Link
                to="/offers"
                className="group block border border-hairline-strong transition-colors hover:border-ink"
              >
                <OfferPlate title={offer.title} kicker="Offer" plate={offer.plate} />
                <div className="p-5">
                  <p className="text-[0.9375rem] leading-7 text-ink-muted">{offer.summary}</p>
                  <p className="eyebrow mt-3 group-hover:text-ink">Read the terms</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Cinemas ───────────────────────────────────────────────────── */}
      <section aria-labelledby="cinemas-heading" className="shell pb-4 pt-12 sm:pt-16">
        <SectionHeading
          id="cinemas-heading"
          eyebrow="Five houses"
          title="Where we are"
          to="/cinemas"
          linkLabel="All cinemas"
        />
        <ul className="grid gap-px bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((venue) => (
            <li key={venue.id} className="bg-paper">
              <Link to={`/cinemas/${venue.slug}`} className="group block h-full p-5">
                <p className="eyebrow">{venue.city}</p>
                <h3 className="mt-2 font-display text-xl leading-tight tracking-[-0.02em] group-hover:underline">
                  {venue.shortName}
                </h3>
                <p className="mt-1.5 text-[0.8125rem] leading-6 text-ink-muted">
                  {venue.addressLines[1]}
                </p>
                <p className="numeral mt-3 text-[0.75rem] uppercase tracking-[0.1em] text-ink-muted">
                  {venue.screens.length} screens
                </p>
                <p className="mt-3 max-w-prose text-[0.875rem] leading-6 text-ink-muted">
                  {venue.signature}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
