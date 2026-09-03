import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '@/components/common';
import { Stagger, StaggerItem } from '@/motion';
import { MovieCard } from '@/components/movie/MovieCard';
import { CertificateChip } from '@/components/movie/Chips';
import { ShowtimePill } from '@/components/showtime/ShowtimeButton';
import { OfferComposition } from '@/components/visual/OfferComposition';
import { QuickBook } from '@/components/home/QuickBook';
import { FeaturedStage } from '@/components/home/FeaturedStage';
import { brand } from '@/config/brand';
import { cinemas, comingSoon, movieById, nowShowing, offers, showtimesForCinemaDate } from '@/data';
import { formatBlurbKeys, formatKeys, languageKeys } from '@/i18n/domain';
import { useFormatters } from '@/i18n/useFormatters';
import { usePreferences } from '@/store/preferences';
import { dateWindow, formatRuntime, longDayLabel, minutesFromTime, todayIso } from '@/lib/datetime';

export function Home() {
  const { t } = useTranslation();
  const f = useFormatters();
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
      {/* ── The masthead rail ──────────────────────────────────────────
          House name on the left, city on the right, dates under both. It
          is the top line of a printed programme, and it fixes *where* and
          *when* before a single film is shown. */}
      <div className="shell">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pt-6">
          <p className="eyebrow text-content">{brand.name}</p>
          <p className="eyebrow">{cinema.city}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="eyebrow">{t('home.programmeEyebrow')}</p>
          <p className="numeral text-[0.6875rem] uppercase tracking-[0.14em] text-content-faint">
            {t('home.dateRange', {
              from: f.date(new Date(), 'dayMonth'),
              to: f.date(weekEnd, 'dayMonthYear'),
            })}
          </p>
        </div>

        <section aria-label={t('home.featuredLabel')}>
          <FeaturedStage />
        </section>
      </div>

      {/* ── The booking stub ──────────────────────────────────────────
          Quick Book is treated as a programme insert torn along a
          perforation: it belongs to the hero above it, and its full width
          gives the four dependent fields room to sit on one line. */}
      <section className="relative border-y-2 border-content bg-surface-sunken/50">
        <div aria-hidden="true" className="sprocket-t h-3 bg-surface" />
        <div className="shell pb-10 pt-2">
          <QuickBook />
        </div>
      </section>

      {/* ── Tonight — a timetable, not a card grid ────────────────────── */}
      <section aria-labelledby="tonight-heading" className="shell py-14 sm:py-20">
        <SectionHeading
          index={1}
          id="tonight-heading"
          eyebrow={`${cinema.shortName} · ${longDayLabel(today)}`}
          title={t('home.onTonight')}
          to="/showtimes"
          linkLabel={t('home.allShowtimes')}
        />

        {tonightByMovie.length === 0 ? (
          <div className="border-2 border-hairline-strong px-6 py-10">
            <p className="max-w-prose text-[0.9375rem] leading-7 text-content-muted">
              <Trans
                i18nKey="home.tonightEmpty"
                values={{ cinema: cinema.name }}
                components={{
                  tomorrow: (
                    <Link to="/showtimes" className="font-semibold underline underline-offset-4" />
                  ),
                }}
              />
            </p>
          </div>
        ) : (
          <ul className="border-t-2 border-content">
            {tonightByMovie.map(([movieId, showtimes]) => {
              const movie = movieById.get(movieId);
              if (!movie) return null;
              return (
                <li
                  key={movieId}
                  className="grid gap-4 border-b border-hairline py-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/movies/${movie.slug}`}
                      className="font-display text-[1.75rem] uppercase leading-none transition-colors hover:text-accent"
                    >
                      {movie.title}
                    </Link>
                    <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] text-content-muted">
                      <CertificateChip code={movie.certificate} />
                      <span className="numeral">{formatRuntime(movie.runtimeMinutes)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t(languageKeys[movie.language])}</span>
                    </p>
                    <p className="mt-2 max-w-prose text-[0.875rem] leading-6 text-content-muted">
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
      <section aria-labelledby="now-showing-heading" className="shell py-14 sm:py-20">
        <SectionHeading
          index={2}
          id="now-showing-heading"
          eyebrow={t('home.filmCount', { count: nowShowing.length })}
          title={t('home.nowShowing')}
          to="/movies"
          linkLabel={t('home.fullProgramme')}
        />
        <Stagger
          as="ul"
          count={5}
          className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {nowShowing.slice(0, 5).map((movie, i) => (
            <StaggerItem as="li" key={movie.id}>
              <MovieCard movie={movie} index={i + 1} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── The houses — editorial, set in two columns ────────────────── */}
      <section
        aria-labelledby="houses-heading"
        className="border-y-2 border-content bg-surface-sunken/50"
      >
        <div className="shell py-14 sm:py-20">
          <SectionHeading
            index={3}
            id="houses-heading"
            eyebrow={t('home.howWeShowFilms')}
            title={t('home.fourWaysToWatch')}
            to="/ticket-prices"
            linkLabel={t('home.whatItCosts')}
          />
          <dl className="grid gap-x-12 gap-y-9 sm:grid-cols-2">
            {(['standard', 'three-d', 'grandscreen', 'velvet'] as const).map((formatId, i) => (
              <div key={formatId} className="flex gap-5 border-t border-hairline pt-4">
                <span aria-hidden="true" className="index-mark shrink-0 text-[2.25rem] text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <dt className="font-display text-[1.5rem] uppercase leading-none">
                    {t(formatKeys[formatId])}
                  </dt>
                  <dd className="mt-2 max-w-prose text-[0.9375rem] leading-7 text-content-muted">
                    {t(formatBlurbKeys[formatId])}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Coming soon — a dated list, not cards ─────────────────────── */}
      <section aria-labelledby="coming-heading" className="shell py-14 sm:py-20">
        <SectionHeading
          index={4}
          id="coming-heading"
          eyebrow={t('home.advanceNotice')}
          title={t('home.comingSoon')}
          to="/movies?status=coming-soon"
          linkLabel={t('home.allUpcoming')}
        />
        <Stagger as="ol" count={comingSoon.length} className="border-t-2 border-content">
          {comingSoon.map((movie) => (
            <StaggerItem as="li" key={movie.id} className="border-b border-hairline">
              <Link
                to={`/movies/${movie.slug}`}
                className="group grid items-baseline gap-x-6 gap-y-1.5 py-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto]"
              >
                <span className="numeral text-[0.6875rem] uppercase tracking-[0.12em] text-accent">
                  {f.date(movie.releaseDate, 'dayMonthYear')}
                </span>
                <span className="min-w-0">
                  <span className="font-display text-[1.5rem] uppercase leading-none transition-colors group-hover:text-accent">
                    {movie.title}
                  </span>
                  <span className="mt-1.5 block max-w-prose text-[0.875rem] leading-6 text-content-muted">
                    {movie.tagline}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.1em] text-content-muted">
                  <span>{t(languageKeys[movie.language])}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform duration-[--dur-base] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Offers ────────────────────────────────────────────────────── */}
      <section aria-labelledby="offers-heading" className="shell py-14 sm:py-20">
        <SectionHeading
          index={5}
          id="offers-heading"
          eyebrow={t('home.runningNow')}
          title={t('home.offers')}
          to="/offers"
          linkLabel={t('home.allOffers')}
        />
        <ul className="grid gap-6 md:grid-cols-2">
          {offers.slice(0, 2).map((offer) => (
            <li key={offer.id}>
              <Link
                to="/offers"
                className="group block border-2 border-hairline-strong transition-colors duration-[--dur-fast] hover:border-content focus-visible:border-content"
              >
                <div className="overflow-hidden">
                  <div className="transition-transform duration-[--dur-slow] ease-[--ease-out] group-hover:scale-[1.02] group-focus-visible:scale-[1.02] motion-reduce:transform-none">
                    <OfferComposition offer={offer} variant="tile" />
                  </div>
                </div>
                <div className="border-t-2 border-hairline-strong p-5 transition-colors group-hover:border-content">
                  {/* The title is real text rather than something drawn into the
                      composition, so it is readable, selectable and announced. */}
                  <h3 className="font-display text-[1.375rem] uppercase leading-none">
                    {offer.title}
                  </h3>
                  <p lang="bn" className="mt-1 text-[0.875rem] text-content-muted">
                    {offer.titleBn}
                  </p>
                  <p className="mt-3 text-[0.9375rem] leading-7 text-content-muted">
                    {offer.summary}
                  </p>
                  <p className="eyebrow mt-4 transition-colors group-hover:text-accent">
                    {t('home.readTheTerms')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Cinemas ───────────────────────────────────────────────────── */}
      <section aria-labelledby="cinemas-heading" className="shell pb-6 pt-14 sm:pt-20">
        <SectionHeading
          index={6}
          id="cinemas-heading"
          eyebrow={t('home.fiveHouses')}
          title={t('home.whereWeAre')}
          to="/cinemas"
          linkLabel={t('home.allCinemas')}
        />
        <ul className="grid-rules grid border-2 border-content sm:grid-cols-2 lg:grid-cols-3">
          {cinemas.map((venue, i) => (
            <li key={venue.id} className="bg-surface">
              <Link to={`/cinemas/${venue.slug}`} className="group block h-full p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="eyebrow">{venue.city}</p>
                  <span aria-hidden="true" className="numeral text-[0.625rem] text-content-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[1.5rem] uppercase leading-none transition-colors group-hover:text-accent">
                  {venue.shortName}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-6 text-content-muted">
                  {venue.addressLines[1]}
                </p>
                <p className="numeral mt-3 text-[0.6875rem] uppercase tracking-[0.1em] text-content-faint">
                  {t('home.screenCount', { count: venue.screens.length })}
                </p>
                <p className="mt-3 max-w-prose text-[0.875rem] leading-6 text-content-muted">
                  {venue.signature}
                </p>
              </Link>
            </li>
          ))}
          {/* The rule grid draws its lines with a background showing through a
              1px gap, so a short final row would leave the ground exposed as a
              blank panel. One filler cell closes it at the width where the
              remainder actually appears. */}
          {cinemas.length % 3 === 2 ? (
            <li aria-hidden="true" className="hidden bg-surface lg:block" />
          ) : null}
        </ul>
      </section>
    </>
  );
}
