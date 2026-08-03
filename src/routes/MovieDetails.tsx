import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Clapperboard, Share2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, DemoNote, RuleHeading } from '@/components/ui/misc';
import { AccessibilityChips, AccessibilityLegend, CertificateChip } from '@/components/movie/Chips';
import { ShowtimePill } from '@/components/showtime/ShowtimeButton';
import { MovieImage } from '@/components/visual/MovieImage';
import { DateStrip } from '@/components/showtime/DateStrip';
import { EmptyState } from '@/components/common';
import { NotFound } from './NotFound';
import {
  cinemas,
  formatBlurbs,
  formatLabels,
  genreLabels,
  getMovie,
  groupShowtimesByCinema,
  groupShowtimesByTimeOfDay,
  languageLabels,
  showtimesForDate,
} from '@/data';
import { certificates, ticketCategories } from '@/data/pricing';
import { adultPriceRange } from '@/lib/bookingMath';
import { dateWindow, formatRuntime, timeOfDayLabels } from '@/lib/datetime';
import { CATALOGUE_DISCLOSURE, releaseLabel, runtimeLabel } from '@/lib/movieMeta';
import { money, moneyRange } from '@/lib/format';
import { usePreferences } from '@/store/preferences';
import { cn } from '@/lib/utils';

export function MovieDetails() {
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
      title: `${movie!.title} — Nokshi Cinemas`,
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
      window.prompt('Copy this link', url);
    }
  }

  return (
    <>
      {/* ── Masthead ────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b-2 border-ink">
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
          <div className="absolute inset-0 bg-gradient-to-r from-paper from-8% via-paper/45 via-40% to-transparent to-78% lg:via-paper/20 lg:via-28%" />
          <div className="absolute inset-0 bg-paper/68 lg:hidden" />
          <div className="absolute inset-y-0 left-0 hidden w-px bg-ink/25 lg:block" />
        </div>

        <div className="shell py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link to="/movies" className="eyebrow underline-offset-4 hover:underline">
              ← The Programme
            </Link>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <div>
              <h1 className="font-display text-[2.5rem] leading-[0.94] tracking-[-0.035em] sm:text-[3.75rem] lg:text-[4.5rem]">
                {movie.title}
              </h1>
              {movie.titleBn ? (
                <p lang="bn" className="mt-3 font-display text-2xl text-ink-muted sm:text-3xl">
                  {movie.titleBn}
                </p>
              ) : null}

              <p className="mt-6 max-w-2xl font-display text-[1.25rem] leading-[1.45] text-ink sm:text-[1.5rem]">
                {movie.tagline}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
                {movie.certificateConfirmed ? (
                  <CertificateChip code={movie.certificate} />
                ) : (
                  <span className="border border-hairline-strong px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]">
                    Not yet rated
                  </span>
                )}
                <span className="numeral">{runtimeLabel(movie)}</span>
                <span aria-hidden="true">·</span>
                <span>{languageLabels[movie.language]}</span>
                {movie.subtitles.length ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{movie.subtitles.map((s) => languageLabels[s]).join('/')} subtitles</span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{movie.genres.map((g) => genreLabels[g]).join(' / ')}</span>
                {movie.intermissionMinutes ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{movie.intermissionMinutes}-minute interval</span>
                  </>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {movie.status === 'now-showing' ? (
                  <Button asChild size="lg">
                    <a href="#showtimes">Choose a showtime</a>
                  </Button>
                ) : (
                  <Badge tone="marigold" className="px-3 py-1.5 text-xs">
                    Opens {releaseLabel(movie)}
                  </Badge>
                )}
                <Button variant="outline" size="lg" onClick={share}>
                  {shared === 'copied' ? (
                    <>
                      <Check aria-hidden="true" />
                      Link copied
                    </>
                  ) : (
                    <>
                      <Share2 aria-hidden="true" />
                      Share
                    </>
                  )}
                </Button>
              </div>

              {restricted ? (
                <div className="mt-7 flex max-w-2xl gap-3 border-l-2 border-marigold bg-marigold-wash/50 px-4 py-3.5">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-marigold" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{certificate.label}</p>
                    <p className="mt-1 text-[0.875rem] leading-6 text-ink-muted">
                      {certificate.guidance} The booking flow will check the ticket categories you
                      choose against this. This site does not verify anyone's age — the door does.
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
              <dl className="border-t-2 border-ink bg-paper/92 px-4 py-1 text-sm backdrop-blur-[2px] lg:px-5">
                <div className="border-b border-hairline py-3">
                  <dt className="eyebrow mb-1">Director</dt>
                  <dd>{movie.director}</dd>
                </div>
                {movie.cast.length > 0 ? (
                  <div className="border-b border-hairline py-3">
                    <dt className="eyebrow mb-1">Cast</dt>
                    <dd className="leading-6">{movie.cast.join(' · ')}</dd>
                  </div>
                ) : null}
                <div className="border-b border-hairline py-3">
                  <dt className="eyebrow mb-1">Released</dt>
                  <dd className="numeral">{releaseLabel(movie)}</dd>
                </div>
                <div className="border-b border-hairline py-3">
                  <dt className="eyebrow mb-1">Available in</dt>
                  <dd className="flex flex-wrap gap-1.5 pt-1">
                    {movie.formats.map((f) => (
                      <Badge key={f} tone={f === 'standard' ? 'neutral' : 'accent'}>
                        {formatLabels[f]}
                      </Badge>
                    ))}
                  </dd>
                </div>
                {priceRange ? (
                  <div className="py-3">
                    <dt className="eyebrow mb-1">Adult ticket</dt>
                    <dd className="numeral">
                      {moneyRange(priceRange.min, priceRange.max)}
                      <span className="ml-1.5 text-xs text-ink-muted">+ ৳20 booking fee</span>
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
            <RuleHeading id="synopsis-heading" className="mb-5">
              The film
            </RuleHeading>
            <p className="max-w-prose text-[1.0625rem] leading-8">{movie.synopsis}</p>

            <blockquote className="mt-8 max-w-prose border-l-2 border-hairline-strong pl-5">
              <p className="font-display text-[1.1875rem] leading-[1.5]">{movie.programmeNote}</p>
              <footer className="eyebrow mt-3">Programme notes</footer>
            </blockquote>
          </section>

          {/* ── Trailer: an honest unavailable state ──────────────────── */}
          <section aria-labelledby="trailer-heading" className="mt-12">
            <RuleHeading id="trailer-heading" className="mb-5">
              Trailer
            </RuleHeading>
            {movie.trailerSrc ? (
              <video
                controls
                preload="none"
                className="w-full border border-hairline-strong bg-ink"
                src={movie.trailerSrc}
              >
                <track kind="captions" />
              </video>
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
                        'radial-gradient(120% 80% at 50% 0%, rgb(147 178 243 / 0.10) 0%, transparent 68%)',
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
                  <p className="font-semibold">No trailer available</p>
                  <p className="mt-1.5 text-[0.9375rem] leading-7 text-ink-muted">
                    We do not hold a trailer for {movie.title} in this build. Rather than link you to
                    something for a different film, there is nothing here. The synopsis and programme
                    notes above are the fullest description we have.
                  </p>
                </figcaption>
              </figure>
            )}
          </section>

          {/* ── Showtimes ─────────────────────────────────────────────── */}
          <section aria-labelledby="showtimes-heading" id="showtimes" className="mt-14 scroll-mt-24">
            <RuleHeading id="showtimes-heading" className="mb-5">
              Showtimes
            </RuleHeading>

            {movie.status === 'coming-soon' ? (
              <EmptyState
                variant="schedule"
                title="Not yet on sale"
                body={`${movie.title} opens on ${new Date(movie.releaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}. Advance booking opens four weeks before release, and this page will show times as soon as it does.`}
                action={
                  <Button asChild variant="outline">
                    <Link to="/movies">See what is on now</Link>
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
                      'border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                      cinemaId === null
                        ? 'border-ink bg-ink text-paper'
                        : 'border-hairline-strong hover:bg-ink/[0.06]',
                    )}
                  >
                    All cinemas
                  </button>
                  {cinemas.map((cinema) => (
                    <button
                      key={cinema.id}
                      type="button"
                      onClick={() => setCinemaId(cinema.id)}
                      className={cn(
                        'border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                        cinemaId === cinema.id
                          ? 'border-ink bg-ink text-paper'
                          : 'border-hairline-strong hover:bg-ink/[0.06]',
                      )}
                    >
                      {cinema.shortName}
                    </button>
                  ))}
                </div>

                {byCinema.length === 0 ? (
                  <EmptyState
                    variant="schedule"
                    title="No screenings that day"
                    body={`${movie.title} is not scheduled at ${cinemaId ? cinemas.find((c) => c.id === cinemaId)?.shortName : 'any house'} on the date you picked. Try another day, or clear the cinema filter.`}
                    action={
                      cinemaId ? (
                        <Button variant="outline" onClick={() => setCinemaId(null)}>
                          Show all cinemas
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <div className="space-y-8">
                    {byCinema.map(({ cinema, showtimes }) => (
                      <div key={cinema.id}>
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline pb-2">
                          <h3 className="font-display text-xl leading-tight">
                            <Link to={`/cinemas/${cinema.slug}`} className="underline-offset-4 hover:underline">
                              {cinema.name}
                            </Link>
                          </h3>
                          <p className="text-[0.8125rem] text-ink-muted">
                            {cinema.area}, {cinema.city}
                          </p>
                        </div>

                        {groupShowtimesByTimeOfDay(showtimes).map((group) => (
                          <div key={group.band} className="mb-4 last:mb-0">
                            <p className="eyebrow mb-2">{timeOfDayLabels[group.band]}</p>
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
                  {CATALOGUE_DISCLOSURE} These are not real Nokshi Cinemas listings and nothing here
                  reflects live inventory.
                </DemoNote>

                <div className="mt-8 border-t border-hairline pt-6">
                  <AccessibilityLegend />
                </div>
              </>
            )}
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <section aria-labelledby="pricing-heading" className="border border-hairline-strong p-5">
            <h2 id="pricing-heading" className="eyebrow mb-4">
              What a ticket costs
            </h2>
            {priceRange ? (
              <p className="numeral mb-4 font-display text-3xl leading-none">
                {moneyRange(priceRange.min, priceRange.max)}
              </p>
            ) : null}
            <dl className="space-y-2.5 text-sm">
              {ticketCategories.map((category) => (
                <div key={category.id} className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">
                    {category.label}
                    {category.ageFrom !== null ? (
                      <span className="ml-1 text-xs text-ink-muted/70">
                        {category.ageTo ? `${category.ageFrom}–${category.ageTo}` : `${category.ageFrom}+`}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="numeral shrink-0">
                    {category.multiplier === 1 ? 'Full price' : `×${category.multiplier}`}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-hairline pt-3 text-[0.8125rem] leading-6 text-ink-muted">
              Plus a {money(20)} booking fee per ticket, shown in every total. Screenings before 3pm
              are {money(60)} cheaper a seat.
            </p>
            <Button asChild variant="link" size="sm" className="mt-2 px-0">
              <Link to="/ticket-prices">How pricing works</Link>
            </Button>
          </section>

          <section aria-labelledby="formats-heading" className="mt-6 border border-hairline-strong p-5">
            <h2 id="formats-heading" className="eyebrow mb-4">
              Presented in
            </h2>
            <dl className="space-y-4">
              {movie.formats.map((f) => (
                <div key={f}>
                  <dt className="font-semibold">{formatLabels[f]}</dt>
                  <dd className="mt-1 text-[0.875rem] leading-6 text-ink-muted">{formatBlurbs[f]}</dd>
                </div>
              ))}
            </dl>
          </section>

          {movie.breakWindows?.length ? (
            <section aria-labelledby="break-heading" className="mt-6 border border-hairline-strong p-5">
              <h2 id="break-heading" className="eyebrow mb-3">
                If you need to step out
              </h2>
              <p className="text-[0.875rem] leading-6 text-ink-muted">
                {movie.intermissionMinutes
                  ? `This film is programmed with a ${movie.intermissionMinutes}-minute interval.`
                  : 'This film runs without an interval.'}{' '}
                Ask Max for the listed low-action windows — they are approximate, and it will warn
                you before describing any scene.
              </p>
            </section>
          ) : null}
        </aside>
      </div>

      {/* ── Sticky booking bar ────────────────────────────────────────── */}
      {movie.status === 'now-showing' ? (
        <div
          data-print="hide"
          className="sticky bottom-0 z-30 border-t-2 border-ink bg-paper-raised/95 backdrop-blur-[6px] lg:hidden"
          style={{ paddingBottom: 'var(--safe-b)' }}
        >
          <div className="shell flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-display text-base leading-tight">{movie.title}</p>
              {priceRange ? (
                <p className="numeral text-xs text-ink-muted">
                  from {money(priceRange.min)} · {formatRuntime(movie.runtimeMinutes)}
                </p>
              ) : null}
            </div>
            <Button asChild className="shrink-0">
              <a href="#showtimes">Showtimes</a>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
