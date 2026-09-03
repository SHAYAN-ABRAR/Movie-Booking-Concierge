import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Clapperboard, Share2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, DemoNote, RuleHeading } from '@/components/ui/misc';
import { AccessibilityChips, AccessibilityLegend, CertificateChip } from '@/components/movie/Chips';
import { TrailerButton, TrailerPreview } from '@/components/movie/TrailerDialog';
import { ShowtimePill } from '@/components/showtime/ShowtimeButton';
import { MovieImage } from '@/components/visual/MovieImage';
import { DateStrip } from '@/components/showtime/DateStrip';
import { EmptyState } from '@/components/common';
import { NotFound } from './NotFound';
import {
  cinemas,
  getMovie,
  groupShowtimesByCinema,
  groupShowtimesByTimeOfDay,
  showtimesForDate,
} from '@/data';
import {
  BOOKING_FEE_PER_TICKET,
  MATINEE_DISCOUNT,
  certificates,
  ticketCategories,
} from '@/data/pricing';
import { adultPriceRange } from '@/lib/bookingMath';
import { dateWindow, formatRuntime, timeOfDayKeys } from '@/lib/datetime';
import { CATALOGUE_DISCLOSURE, releaseLabel, runtimeLabel } from '@/lib/movieMeta';
import { money, moneyRange } from '@/lib/format';
import {
  certificateGuidance,
  certificateLabel,
  formatBlurbKeys,
  formatKeys,
  genreKeys,
  languageKeys,
} from '@/i18n/domain';
import { useFormatters } from '@/i18n/useFormatters';
import { usePreferences } from '@/store/preferences';
import { cn } from '@/lib/utils';

export function MovieDetails() {
  const { t, i18n } = useTranslation();
  const f = useFormatters();
  const { slug } = useParams<{ slug: string }>();
  const movie = slug ? getMovie(slug) : null;

  const dates = useMemo(() => dateWindow(10), []);
  const [date, setDate] = useState(dates[0]!);
  const preferredCinema = usePreferences((s) => s.cinemaId);
  const [cinemaId, setCinemaId] = useState<string | null>(preferredCinema);
  const [shared, setShared] = useState<'idle' | 'copied'>('idle');

  const screenings = useMemo(() => {
    if (!movie || movie.status === 'coming-soon') return [];
    return showtimesForDate(date)
      .filter((s) => s.movieId === movie.id)
      .filter((s) => (cinemaId ? s.cinemaId === cinemaId : true));
  }, [movie, date, cinemaId]);

  const byCinema = useMemo(() => groupShowtimesByCinema(screenings), [screenings]);

  const priceRange = useMemo(() => {
    if (screenings.length === 0) return null;
    const ranges = screenings.map(adultPriceRange);
    return {
      min: Math.min(...ranges.map((r) => r.min)),
      max: Math.max(...ranges.map((r) => r.max)),
    };
  }, [screenings]);

  if (!movie) return <NotFound />;

  const certificate = certificates[movie.certificate];
  const restricted = certificate.minAge !== null;

  async function share() {
    const url = window.location.href;
    const data = {
      title: t('movieDetails.shareTitle', { title: movie!.title }),
      text: movie!.tagline,
      url,
    };
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return;
      } catch {
        // The customer dismissed the sheet, or sharing is unavailable — fall through.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared('copied');
      window.setTimeout(() => setShared('idle'), 2400);
    } catch {
      window.prompt(t('movieDetails.copyPrompt'), url);
    }
  }

  return (
    <>
      {/* ── Masthead ────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b-2 border-content">
        {/* The film's real landscape backdrop, not a poster stretched wide.
            `aria-hidden` because the title, credits and synopsis beside it are
            the content; the picture is atmosphere. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full lg:w-[56%]">
          <MovieImage
            movie={movie}
            role="backdrop"
            priority
            sizes="(max-width: 1024px) 100vw, 56vw"
            className="size-full aspect-auto!"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface from-8% via-surface/45 via-40% to-transparent to-78% lg:via-surface/20 lg:via-28%" />
          <div className="absolute inset-0 bg-surface/68 lg:hidden" />
          <div className="absolute inset-y-0 left-0 hidden w-px bg-content/25 lg:block" />
        </div>

        <div className="shell py-10 sm:py-14">
          <nav aria-label={t('movieDetails.breadcrumb')} className="mb-6">
            <Link to="/movies" className="eyebrow underline-offset-4 hover:underline">
              {t('movieDetails.backToProgramme')}
            </Link>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <h1
                className="font-display uppercase leading-[0.86] tracking-[-0.035em] [overflow-wrap:anywhere]"
                style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
              >
                {movie.title}
              </h1>
              {movie.titleBn ? (
                <p lang="bn" className="mt-3 font-display text-2xl text-content-muted sm:text-3xl">
                  {movie.titleBn}
                </p>
              ) : null}

              <p className="mt-5 max-w-2xl border-l-2 border-accent pl-4 text-[1.0625rem] font-medium leading-[1.5] text-content sm:text-[1.1875rem]">
                {movie.tagline}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-content-muted">
                {movie.certificateConfirmed ? (
                  <CertificateChip code={movie.certificate} />
                ) : (
                  <span className="border border-hairline-strong px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]">
                    {t('movieDetails.notYetRated')}
                  </span>
                )}
                <span className="numeral">{runtimeLabel(movie)}</span>
                <span aria-hidden="true">·</span>
                <span>{t(languageKeys[movie.language])}</span>
                {movie.subtitles.length ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t('movieDetails.subtitles', {
                        languages: movie.subtitles.map((s) => t(languageKeys[s])).join('/'),
                      })}
                    </span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{movie.genres.map((g) => t(genreKeys[g])).join(' / ')}</span>
                {movie.intermissionMinutes ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t('movieDetails.interval', { count: movie.intermissionMinutes })}</span>
                  </>
                ) : null}
              </div>

              {/* The premise, before the actions. Someone deciding whether to
                  press "Choose a showtime" wants three sentences, not the
                  paragraph further down the page. */}
              <p className="mt-6 max-w-prose text-[1rem] leading-7 text-content-muted">
                {i18n.language === 'bn' ? movie.shortStoryBn : movie.shortStory}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {movie.status === 'now-showing' ? (
                  <Button asChild variant="accent" size="lg">
                    <a href="#showtimes">{t('movieDetails.chooseShowtime')}</a>
                  </Button>
                ) : (
                  <Badge tone="signal" className="px-3 py-1.5 text-xs">
                    {t('movieDetails.opens', { date: releaseLabel(movie) })}
                  </Badge>
                )}
                <TrailerButton movie={movie} variant="outline" size="lg" />
                <Button variant="outline" size="lg" onClick={share}>
                  {shared === 'copied' ? (
                    <>
                      <Check aria-hidden="true" />
                      {t('movieDetails.linkCopied')}
                    </>
                  ) : (
                    <>
                      <Share2 aria-hidden="true" />
                      {t('movieDetails.share')}
                    </>
                  )}
                </Button>
              </div>

              {restricted ? (
                <div className="mt-7 flex max-w-2xl gap-3 border-l-2 border-accent bg-signal-wash/50 px-4 py-3.5">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-content">
                      {certificateLabel(movie.certificate)}
                    </p>
                    <p className="mt-1 text-[0.875rem] leading-6 text-content-muted">
                      {certificateGuidance(movie.certificate)} {t('movieDetails.restrictionNote')}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Credits — set as a printed colophon.
                The backdrop sits behind this column on `lg`, so the colophon
                carries its own paper ground. Without it the credits are set on
                whatever the film's artwork happens to be doing and become
                unreadable — which is exactly what the backdrop must never cost. */}
            <div className="lg:pt-3">
              <div className="mx-auto mb-5 w-40 border-2 border-content sm:w-48 lg:mx-0">
                <MovieImage movie={movie} role="poster" sizes="192px" />
              </div>
              <dl className="border-t-2 border-content bg-surface/92 px-4 py-1 text-sm backdrop-blur-[2px] lg:px-5">
                <div className="border-b border-hairline py-3">
                  <dt className="eyebrow mb-1">{t('movieDetails.credits.director')}</dt>
                  <dd>{movie.director}</dd>
                </div>
                {movie.cast.length > 0 ? (
                  <div className="border-b border-hairline py-3">
                    <dt className="eyebrow mb-1">{t('movieDetails.credits.cast')}</dt>
                    <dd className="leading-6">{movie.cast.join(' · ')}</dd>
                  </div>
                ) : null}
                <div className="border-b border-hairline py-3">
                  <dt className="eyebrow mb-1">{t('movieDetails.credits.released')}</dt>
                  <dd className="numeral">{releaseLabel(movie)}</dd>
                </div>
                <div className="border-b border-hairline py-3">
                  <dt className="eyebrow mb-1">{t('movieDetails.credits.availableIn')}</dt>
                  <dd className="flex flex-wrap gap-1.5 pt-1">
                    {movie.formats.map((format) => (
                      <Badge key={format} tone={format === 'standard' ? 'neutral' : 'accent'}>
                        {t(formatKeys[format])}
                      </Badge>
                    ))}
                  </dd>
                </div>
                {priceRange ? (
                  <div className="py-3">
                    <dt className="eyebrow mb-1">{t('movieDetails.credits.adultTicket')}</dt>
                    <dd className="numeral">
                      {moneyRange(priceRange.min, priceRange.max)}
                      <span className="ml-1.5 text-xs text-content-muted">
                        {t('movieDetails.credits.plusBookingFee', {
                          fee: f.money(BOOKING_FEE_PER_TICKET),
                        })}
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      </header>

      <div className="shell grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <section aria-labelledby="synopsis-heading">
            <RuleHeading id="synopsis-heading" index="01" className="mb-5">
              {t('story.fullSynopsis')}
            </RuleHeading>
            <p className="max-w-prose text-[1.0625rem] leading-8">{movie.synopsis}</p>

            <blockquote className="mt-8 max-w-prose border-l-2 border-accent pl-5">
              <p className="text-[1.0625rem] font-medium leading-[1.6]">{movie.programmeNote}</p>
              <footer className="eyebrow mt-3">{t('movieDetails.programmeNotes')}</footer>
            </blockquote>
          </section>

          {/* ── Trailer: an honest unavailable state ──────────────────── */}
          <section aria-labelledby="trailer-heading" className="mt-12">
            <RuleHeading id="trailer-heading" index="02" className="mb-5">
              {t('movieDetails.trailer')}
            </RuleHeading>
            {movie.trailer ? (
              <TrailerPreview movie={movie} />
            ) : (
              /* A screen with nothing running on it, rather than an error box.
                 The frame is real, the leader marks are real, and the copy is
                 unchanged — there is simply no film in the gate. */
              <figure className="max-w-2xl">
                <div className="auditorium relative aspect-[16/7] overflow-hidden border border-house-rule">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(120% 80% at 50% 0%, rgb(154 163 180 / 0.12) 0%, transparent 68%)',
                    }}
                  />
                  {/* Leader perforations down both edges. */}
                  {(['left-2', 'right-2'] as const).map((side) => (
                    <span
                      key={side}
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-y-0 flex w-[7px] flex-col items-center justify-around py-3',
                        side,
                      )}
                    >
                      {Array.from({ length: 9 }, (_, i) => (
                        <span key={i} className="block size-[5px] rounded-[1px] bg-house-ink/25" />
                      ))}
                    </span>
                  ))}
                  {/* The gate: an empty aperture, crosshaired like a leader frame. */}
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="relative grid size-20 place-items-center rounded-stub border border-house-ink/25">
                      <Clapperboard aria-hidden="true" className="size-7 text-house-ink/40" />
                    </div>
                  </div>
                  <span aria-hidden="true" className="absolute inset-x-8 top-1/2 h-px bg-house-ink/12" />
                  <span aria-hidden="true" className="absolute inset-y-6 left-1/2 w-px bg-house-ink/12" />
                </div>
                <figcaption className="mt-3 max-w-prose">
                  <p className="font-semibold">{t('movieDetails.noTrailerTitle')}</p>
                  <p className="mt-1.5 text-[0.9375rem] leading-7 text-content-muted">
                    {t('movieDetails.noTrailerBody', { title: movie.title })}
                  </p>
                </figcaption>
              </figure>
            )}
          </section>

          {/* ── Showtimes ─────────────────────────────────────────────── */}
          <section aria-labelledby="showtimes-heading" id="showtimes" className="mt-14 scroll-mt-28">
            <RuleHeading id="showtimes-heading" index="03" className="mb-5">
              {t('movieDetails.showtimes')}
            </RuleHeading>

            {movie.status === 'coming-soon' ? (
              <EmptyState
                variant="schedule"
                title={t('movieDetails.notOnSaleTitle')}
                body={t('movieDetails.notOnSaleBody', {
                  title: movie.title,
                  date: f.date(movie.releaseDate, 'dayLongMonth'),
                })}
                action={
                  <Button asChild variant="outline">
                    <Link to="/movies">{t('movieDetails.seeWhatIsOn')}</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <DateStrip value={date} onChange={setDate} className="mb-5" />

                <div className="mb-6 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCinemaId(null)}
                    className={cn(
                      'border px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] transition-colors',
                      '[&:lang(bn)]:text-[0.8125rem] [&:lang(bn)]:tracking-normal',
                      cinemaId === null
                        ? 'border-content bg-content text-surface'
                        : 'border-hairline-strong hover:bg-content/[0.06]',
                    )}
                  >
                    {t('movieDetails.allCinemas')}
                  </button>
                  {cinemas.map((cinema) => (
                    <button
                      key={cinema.id}
                      type="button"
                      onClick={() => setCinemaId(cinema.id)}
                      className={cn(
                        'border px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] transition-colors',
                      '[&:lang(bn)]:text-[0.8125rem] [&:lang(bn)]:tracking-normal',
                        cinemaId === cinema.id
                          ? 'border-content bg-content text-surface'
                          : 'border-hairline-strong hover:bg-content/[0.06]',
                      )}
                    >
                      {cinema.shortName}
                    </button>
                  ))}
                </div>

                {byCinema.length === 0 ? (
                  <EmptyState
                    variant="schedule"
                    title={t('movieDetails.noScreeningsTitle')}
                    body={t('movieDetails.noScreeningsBody', {
                      title: movie.title,
                      cinema:
                        (cinemaId ? cinemas.find((c) => c.id === cinemaId)?.shortName : null) ??
                        t('movieDetails.anyHouse'),
                    })}
                    action={
                      cinemaId ? (
                        <Button variant="outline" onClick={() => setCinemaId(null)}>
                          {t('movieDetails.showAllCinemas')}
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <div className="space-y-8">
                    {byCinema.map(({ cinema, showtimes }) => (
                      <div key={cinema.id}>
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-content pb-2">
                          <h3 className="font-display text-[1.375rem] uppercase leading-none">
                            <Link to={`/cinemas/${cinema.slug}`} className="underline-offset-4 hover:underline">
                              {cinema.name}
                            </Link>
                          </h3>
                          <p className="text-[0.8125rem] text-content-muted">
                            {cinema.area}, {cinema.city}
                          </p>
                        </div>

                        {groupShowtimesByTimeOfDay(showtimes).map((group) => (
                          <div key={group.band} className="mb-4 last:mb-0">
                            <p className="eyebrow mb-2">{t(timeOfDayKeys[group.band])}</p>
                            <ul className="flex flex-wrap gap-2">
                              {group.showtimes.map((showtime) => (
                                <li key={showtime.id} className="flex flex-col items-start gap-1">
                                  <ShowtimePill showtime={showtime} />
                                  {showtime.accessibility.length ? (
                                    <AccessibilityChips features={showtime.accessibility} size="sm" />
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <DemoNote className="mt-6" tone="loud">
                  {CATALOGUE_DISCLOSURE} {t('movieDetails.notRealListings')}
                </DemoNote>

                <div className="mt-8 border-t border-hairline pt-6">
                  <AccessibilityLegend />
                </div>
              </>
            )}
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <section aria-labelledby="pricing-heading" className="edge p-5">
            <h2 id="pricing-heading" className="eyebrow mb-4">
              {t('movieDetails.pricingHeading')}
            </h2>
            {priceRange ? (
              <p className="index-mark mb-4 text-[2.5rem]">
                {moneyRange(priceRange.min, priceRange.max)}
              </p>
            ) : null}
            <dl className="space-y-2.5 text-sm">
              {ticketCategories.map((category) => (
                <div key={category.id} className="flex items-baseline justify-between gap-3">
                  <dt className="text-content-muted">
                    {category.label}
                    {category.ageFrom !== null ? (
                      <span className="ml-1 text-xs text-content-muted/70">
                        {category.ageTo
                          ? t('movieDetails.ageBetween', {
                              from: f.plain(category.ageFrom),
                              to: f.plain(category.ageTo),
                            })
                          : t('movieDetails.ageFrom', { from: f.plain(category.ageFrom) })}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="numeral shrink-0">
                    {category.multiplier === 1
                      ? t('movieDetails.fullPrice')
                      : `×${f.plain(category.multiplier)}`}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-hairline pt-3 text-[0.8125rem] leading-6 text-content-muted">
              {t('movieDetails.feeNote', {
                fee: f.money(BOOKING_FEE_PER_TICKET),
                discount: f.money(MATINEE_DISCOUNT),
              })}
            </p>
            <Button asChild variant="link" size="sm" className="mt-2 px-0">
              <Link to="/ticket-prices">{t('movieDetails.howPricingWorks')}</Link>
            </Button>
          </section>

          <section aria-labelledby="formats-heading" className="edge mt-6 p-5">
            <h2 id="formats-heading" className="eyebrow mb-4">
              {t('movieDetails.presentedIn')}
            </h2>
            <dl className="space-y-4">
              {movie.formats.map((format) => (
                <div key={format}>
                  <dt className="font-semibold">{t(formatKeys[format])}</dt>
                  <dd className="mt-1 text-[0.875rem] leading-6 text-content-muted">
                    {t(formatBlurbKeys[format])}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {movie.breakWindows?.length ? (
            <section aria-labelledby="break-heading" className="edge mt-6 p-5">
              <h2 id="break-heading" className="eyebrow mb-3">
                {t('movieDetails.stepOutHeading')}
              </h2>
              <p className="text-[0.875rem] leading-6 text-content-muted">
                {movie.intermissionMinutes
                  ? t('movieDetails.hasInterval', { count: movie.intermissionMinutes })
                  : t('movieDetails.noInterval')}{' '}
                {t('movieDetails.stepOutBody')}
              </p>
            </section>
          ) : null}
        </aside>
      </div>

      {/* ── Sticky booking bar ────────────────────────────────────────── */}
      {movie.status === 'now-showing' ? (
        <div
          data-print="hide"
          className="sticky bottom-0 z-30 border-t-2 border-content bg-surface-raised/95 backdrop-blur-[6px] lg:hidden"
          style={{ paddingBottom: 'var(--safe-b)' }}
        >
          <div className="shell flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-display text-[1.125rem] uppercase leading-none">{movie.title}</p>
              {priceRange ? (
                <p className="numeral text-xs text-content-muted">
                  {t('movieDetails.fromPrice', { price: money(priceRange.min) })} ·{' '}
                  {formatRuntime(movie.runtimeMinutes)}
                </p>
              ) : null}
            </div>
            <Button asChild variant="accent" className="shrink-0">
              <a href="#showtimes">{t('movieDetails.showtimes')}</a>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
