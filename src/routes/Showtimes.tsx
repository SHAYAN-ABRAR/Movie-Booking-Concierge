import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { SlidersHorizontal } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/overlay';
import { DemoNote, RuleHeading } from '@/components/ui/misc';
import { FilterChip } from '@/components/ui/toggle';
import { DateStrip } from '@/components/showtime/DateStrip';
import { ShowtimeButton } from '@/components/showtime/ShowtimeButton';
import { ActiveFilters, FilterPanel } from '@/components/movie/FilterPanel';
import { AccessibilityLegend, CertificateChip } from '@/components/movie/Chips';
import { TrailerButton } from '@/components/movie/TrailerDialog';
import { useMovieFilters } from '@/hooks/useMovieFilters';
import { cinemaById, filterShowtimes, genreLabels, groupShowtimesByMovie, languageLabels } from '@/data';
import { dateWindow, formatRuntime, timeOfDay, timeOfDayKeys } from '@/lib/datetime';
import type { TimeOfDayBand } from '@/lib/datetime';
import { usePreferences } from '@/store/preferences';

const bands: TimeOfDayBand[] = ['morning', 'afternoon', 'evening', 'late'];

const bandWindows: Record<TimeOfDayBand, { after: string; before: string }> = {
  morning: { after: '00:00', before: '11:59' },
  afternoon: { after: '12:00', before: '16:59' },
  evening: { after: '17:00', before: '20:59' },
  late: { after: '21:00', before: '23:59' },
};

export function Showtimes() {
  const { t } = useTranslation();
  const controls = useMovieFilters();
  const { filter, setFilter, clear } = controls;
  const dates = useMemo(() => dateWindow(10), []);
  const date = filter.date ?? dates[0]!;

  const preferredCinema = usePreferences((s) => s.cinemaId);
  const setPreferredCinema = usePreferences((s) => s.setCinema);

  // The header's venue choice seeds the page the first time it is opened.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded) return;
    setSeeded(true);
    if (preferredCinema && !filter.cinemaIds?.length) {
      setFilter({ cinemaIds: [preferredCinema], date }, { replace: true });
    } else if (!filter.date) {
      setFilter({ date }, { replace: true });
    }
  }, [seeded, preferredCinema, filter.cinemaIds, filter.date, date, setFilter]);

  // Keep the header switcher in step when exactly one venue is filtered.
  useEffect(() => {
    if (filter.cinemaIds?.length === 1) setPreferredCinema(filter.cinemaIds[0]!, false);
  }, [filter.cinemaIds, setPreferredCinema]);

  const results = useMemo(() => filterShowtimes(date, filter), [date, filter]);
  const byMovie = useMemo(() => groupShowtimesByMovie(results), [results]);

  const activeBand = bands.find(
    (band) => filter.after === bandWindows[band].after && filter.before === bandWindows[band].before,
  );

  function toggleBand(band: TimeOfDayBand) {
    if (activeBand === band) setFilter({ after: undefined, before: undefined });
    else setFilter({ after: bandWindows[band].after, before: bandWindows[band].before });
  }

  const cinemaNames = (filter.cinemaIds ?? [])
    .map((id) => cinemaById.get(id)?.shortName)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="shell">
      <PageHeader
        eyebrow={t('showtimes.eyebrow')}
        title={t('showtimes.title')}
        lede={
          cinemaNames ? t('showtimes.ledeCinemas', { cinemas: cinemaNames }) : t('showtimes.ledeAll')
        }
      />

      <div className="pb-6 pt-6">
        <p className="eyebrow mb-2.5">{t('showtimes.date')}</p>
        <DateStrip value={date} onChange={(next) => setFilter({ date: next })} />
      </div>

      <div className="flex flex-col gap-6 py-6 lg:flex-row lg:gap-12 lg:py-8">
        <aside className="hidden w-64 shrink-0 lg:block" aria-label={t('filters.heading')}>
          <div className="sticky top-28 max-h-[calc(100dvh-9rem)] overflow-y-auto pb-6 pr-2">
            <div className="mb-7">
              <RuleHeading as="h3" className="mb-3">
                {t('showtimes.timeOfDayHeading')}
              </RuleHeading>
              <div className="flex flex-wrap gap-1.5">
                {bands.map((band) => (
                  <FilterChip
                    key={band}
                    checked={activeBand === band}
                    onCheckedChange={() => toggleBand(band)}
                  >
                    {t(timeOfDayKeys[band])}
                  </FilterChip>
                ))}
              </div>
            </div>
            <FilterPanel controls={controls} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="slab mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-b-hairline py-3">
            <p className="text-sm text-content-muted" role="status" aria-live="polite">
              {/* The count is the part worth emphasising, so it is rendered as
                  its own element rather than baked into the sentence. */}
              <Trans
                i18nKey="showtimes.summary"
                values={{
                  screenings: t('showtimes.screenings', { count: results.length }),
                  films: t('showtimes.films', { count: byMovie.length }),
                }}
                components={{ strong: <span className="font-semibold text-content" /> }}
              />
            </p>

            <div className="flex items-center gap-2">
              <div className="hidden gap-1.5 sm:flex lg:hidden">
                {bands.map((band) => (
                  <FilterChip
                    key={band}
                    checked={activeBand === band}
                    onCheckedChange={() => toggleBand(band)}
                  >
                    {t(timeOfDayKeys[band])}
                  </FilterChip>
                ))}
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal aria-hidden="true" />
                    {t('filters.heading')}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85dvh]">
                  <div className="border-b-2 border-content px-5 pb-3 pt-2">
                    <SheetTitle className="eyebrow text-content">{t('filters.heading')}</SheetTitle>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    <div className="mb-7">
                      <RuleHeading as="h3" className="mb-3">
                        {t('showtimes.timeOfDayHeading')}
                      </RuleHeading>
                      <div className="flex flex-wrap gap-1.5">
                        {bands.map((band) => (
                          <FilterChip
                            key={band}
                            checked={activeBand === band}
                            onCheckedChange={() => toggleBand(band)}
                          >
                            {t(timeOfDayKeys[band])}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                    <FilterPanel controls={controls} />
                  </div>
                  <div className="flex gap-3 border-t-2 border-content px-5 py-4 pb-[max(1rem,var(--safe-b))]">
                    <Button variant="outline" block onClick={clear}>
                      {t('filters.clearAll')}
                    </Button>
                    <SheetClose asChild>
                      <Button block variant="accent">
                        {t('filters.showCount', { count: results.length })}
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <ActiveFilters controls={controls} className="mb-6" />

          {byMovie.length === 0 ? (
            <EmptyState
              title={t('showtimes.emptyTitle')}
              variant="schedule"
              body={
                <p>
                  <Trans
                    i18nKey="showtimes.emptyBody"
                    components={{
                      clear: (
                        <button
                          type="button"
                          onClick={clear}
                          className="font-semibold underline underline-offset-4"
                        />
                      ),
                    }}
                  />
                </p>
              }
            />
          ) : (
            <div className="space-y-10">
              {byMovie.map(({ movie, showtimes }) => (
                <section key={movie.id} aria-labelledby={`film-${movie.id}`}>
                  {/* A listing, not a selector. Each film gets a discrete
                      trailer action in its header — the full story panel would
                      be wallpaper repeated under every film. */}
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b-2 border-content pb-2.5">
                    <div className="min-w-0">
                      <h2
                        id={`film-${movie.id}`}
                        className="font-display text-[1.75rem] uppercase leading-none [overflow-wrap:anywhere]"
                      >
                        <Link to={`/movies/${movie.slug}`} className="transition-colors hover:text-accent">
                          {movie.title}
                        </Link>
                      </h2>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-content-muted">
                        <CertificateChip code={movie.certificate} />
                        <span className="numeral">{formatRuntime(movie.runtimeMinutes)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{languageLabels[movie.language]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{movie.genres.map((g) => genreLabels[g]).join(' / ')}</span>
                      </p>
                    </div>
                    <TrailerButton movie={movie} variant="ghost" size="sm" className="shrink-0" />
                  </div>

                  {bands
                    .map((band) => ({
                      band,
                      list: showtimes.filter((s) => timeOfDay(s.time) === band),
                    }))
                    .filter((group) => group.list.length > 0)
                    .map((group) => (
                      <div key={group.band} className="mb-5 last:mb-0">
                        <p className="eyebrow mb-2.5">{t(timeOfDayKeys[group.band])}</p>
                        {/* A timetable: one screening per line, all times on the
                            same left edge, so the column can be read down
                            rather than hunted through. */}
                        <ul className="border-t border-hairline">
                          {group.list.map((showtime) => (
                            <li key={showtime.id}>
                              <ShowtimeButton
                                showtime={showtime}
                                showCinema={!filter.cinemaIds?.length}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </section>
              ))}
            </div>
          )}

          <DemoNote className="mt-10" tone="loud">
            {t('showtimes.demoNote')}
          </DemoNote>

          <div className="slab mt-10 pt-6">
            <AccessibilityLegend />
          </div>
        </div>
      </div>
    </div>
  );
}
