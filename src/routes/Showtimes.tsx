import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useMovieFilters } from '@/hooks/useMovieFilters';
import { cinemaById, filterShowtimes, genreLabels, groupShowtimesByMovie, languageLabels } from '@/data';
import { dateWindow, formatRuntime, timeOfDay, timeOfDayLabels } from '@/lib/datetime';
import type { TimeOfDayBand } from '@/lib/datetime';
import { pluralise } from '@/lib/format';
import { usePreferences } from '@/store/preferences';

const bands: TimeOfDayBand[] = ['morning', 'afternoon', 'evening', 'late'];

const bandWindows: Record<TimeOfDayBand, { after: string; before: string }> = {
  morning: { after: '00:00', before: '11:59' },
  afternoon: { after: '12:00', before: '16:59' },
  evening: { after: '17:00', before: '20:59' },
  late: { after: '21:00', before: '23:59' },
};

export function Showtimes() {
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
        eyebrow="Find a time"
        title="Showtimes"
        lede={`Every screening across the circuit, day by day. ${cinemaNames ? `Showing ${cinemaNames}.` : 'Showing all five houses.'}`}
      />

      <div className="border-b border-hairline py-6">
        <p className="eyebrow mb-2.5">Date</p>
        <DateStrip value={date} onChange={(next) => setFilter({ date: next })} />
      </div>

      <div className="flex flex-col gap-6 py-6 lg:flex-row lg:gap-12 lg:py-8">
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-6 pr-2">
            <div className="mb-7">
              <RuleHeading as="h3" className="mb-3">
                Time of day
              </RuleHeading>
              <div className="flex flex-wrap gap-1.5">
                {bands.map((band) => (
                  <FilterChip
                    key={band}
                    checked={activeBand === band}
                    onCheckedChange={() => toggleBand(band)}
                  >
                    {timeOfDayLabels[band]}
                  </FilterChip>
                ))}
              </div>
            </div>
            <FilterPanel controls={controls} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
            <p className="text-sm text-content-muted" role="status" aria-live="polite">
              <span className="font-semibold text-content">
                {pluralise(results.length, 'screening')}
              </span>{' '}
              across {pluralise(byMovie.length, 'film')}
            </p>

            <div className="flex items-center gap-2">
              <div className="hidden gap-1.5 sm:flex lg:hidden">
                {bands.map((band) => (
                  <FilterChip
                    key={band}
                    checked={activeBand === band}
                    onCheckedChange={() => toggleBand(band)}
                  >
                    {timeOfDayLabels[band]}
                  </FilterChip>
                ))}
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal aria-hidden="true" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85dvh]">
                  <div className="border-b border-hairline px-5 pb-3 pt-2">
                    <SheetTitle className="text-lg">Filters</SheetTitle>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    <div className="mb-7">
                      <RuleHeading as="h3" className="mb-3">
                        Time of day
                      </RuleHeading>
                      <div className="flex flex-wrap gap-1.5">
                        {bands.map((band) => (
                          <FilterChip
                            key={band}
                            checked={activeBand === band}
                            onCheckedChange={() => toggleBand(band)}
                          >
                            {timeOfDayLabels[band]}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                    <FilterPanel controls={controls} />
                  </div>
                  <div className="flex gap-3 border-t border-hairline px-5 py-4">
                    <Button variant="outline" block onClick={clear}>
                      Clear all
                    </Button>
                    <SheetClose asChild>
                      <Button block>Show {results.length}</Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <ActiveFilters controls={controls} className="mb-6" />

          {byMovie.length === 0 ? (
            <EmptyState
              title="Nothing scheduled for that combination"
              body={
                <p>
                  No screening on this date matches your filters. Try a different day on the strip
                  above, widen the time of day, or{' '}
                  <button
                    type="button"
                    onClick={clear}
                    className="font-semibold underline underline-offset-4"
                  >
                    clear the filters
                  </button>
                  .
                </p>
              }
            />
          ) : (
            <div className="space-y-10">
              {byMovie.map(({ movie, showtimes }) => (
                <section key={movie.id} aria-labelledby={`film-${movie.id}`}>
                  <div className="mb-4 border-b-2 border-ink pb-2.5">
                    <h2 id={`film-${movie.id}`} className="font-display text-2xl leading-tight tracking-[-0.02em]">
                      <Link to={`/movies/${movie.slug}`} className="underline-offset-4 hover:underline">
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

                  {bands
                    .map((band) => ({
                      band,
                      list: showtimes.filter((s) => timeOfDay(s.time) === band),
                    }))
                    .filter((group) => group.list.length > 0)
                    .map((group) => (
                      <div key={group.band} className="mb-5 last:mb-0">
                        <p className="eyebrow mb-2.5">{timeOfDayLabels[group.band]}</p>
                        <ul className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr))]">
                          {group.list.map((showtime) => {
                            const cinema = cinemaById.get(showtime.cinemaId);
                            return (
                              <li key={showtime.id}>
                                {!filter.cinemaIds?.length && cinema ? (
                                  <p className="mb-1 truncate text-[0.6875rem] uppercase tracking-[0.1em] text-content-faint">
                                    {cinema.shortName}
                                  </p>
                                ) : null}
                                <ShowtimeButton showtime={showtime} showCinema={!filter.cinemaIds?.length} />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                </section>
              ))}
            </div>
          )}

          <DemoNote className="mt-10" tone="loud">
            Sample schedule and seat availability, generated locally in your browser. These are not
            real listings and no live inventory is being checked.
          </DemoNote>

          <div className="mt-8 border-t border-hairline pt-6">
            <AccessibilityLegend />
          </div>
        </div>
      </div>
    </div>
  );
}
