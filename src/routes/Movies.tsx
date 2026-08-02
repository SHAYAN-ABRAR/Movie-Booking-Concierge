import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { AnimatedNumber, useMotionPreferences } from '@/motion';
import { duration, ease } from '@/motion/tokens';
import { PageHeader, EmptyState } from '@/components/common';
import { MovieCard } from '@/components/movie/MovieCard';
import { ActiveFilters, FilterPanel } from '@/components/movie/FilterPanel';
import { AccessibilityLegend } from '@/components/movie/Chips';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/overlay';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/disclosure';
import { DateStrip } from '@/components/showtime/DateStrip';
import { useMovieFilters } from '@/hooks/useMovieFilters';
import { activeFilterCount, filterMovies } from '@/data';
import { dateWindow } from '@/lib/datetime';
import { pluralise } from '@/lib/format';

export function Movies() {
  const motionPrefs = useMotionPreferences();
  const controls = useMovieFilters({ status: 'now-showing' });
  const { filter, setFilter, clear } = controls;
  const status = filter.status ?? 'now-showing';

  const results = useMemo(() => filterMovies({ ...filter, status }), [filter, status]);
  const count = activeFilterCount(filter);
  const dates = dateWindow(10);

  return (
    <div className="shell">
      <PageHeader
        eyebrow="The Programme"
        title={status === 'coming-soon' ? 'Coming soon' : 'Now showing'}
        lede={
          status === 'coming-soon'
            ? 'Films we have booked but not yet opened. Advance booking opens four weeks before release.'
            : 'Everything on across the five houses this week. Filter by what you can get to, when you are free, and what you need on screen.'
        }
      />

      <div className="flex flex-col gap-6 py-6 lg:flex-row lg:gap-12 lg:py-10">
        {/* ── Sidebar filters (desktop) ──────────────────────────────── */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-6 pr-2">
            <FilterPanel controls={controls} showAccessibility={status === 'now-showing'} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Tabs
            value={status}
            onValueChange={(value) =>
              setFilter({ status: value as 'now-showing' | 'coming-soon' })
            }
          >
            <TabsList className="mb-6">
              <TabsTrigger value="now-showing">Now showing</TabsTrigger>
              <TabsTrigger value="coming-soon">Coming soon</TabsTrigger>
            </TabsList>
          </Tabs>

          {status === 'now-showing' ? (
            <div className="mb-6">
              <p className="eyebrow mb-2.5">Screening on</p>
              <DateStrip
                value={filter.date ?? dates[0]!}
                onChange={(date) => setFilter({ date })}
              />
              {filter.date ? (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 px-0"
                  onClick={() => setFilter({ date: undefined })}
                >
                  Show every day
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-hairline py-3">
            <p className="text-sm text-content-muted" aria-live="polite" role="status">
              <span className="font-semibold text-content">
                <AnimatedNumber value={results.length} />{' '}
                {results.length === 1 ? 'film' : 'films'}
              </span>
              {count > 0 ? ` matching ${pluralise(count, 'filter')}` : ''}
            </p>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal aria-hidden="true" />
                  Filters
                  {count > 0 ? (
                    <span className="numeral ml-1 bg-content px-1.5 text-[0.6875rem] text-surface">
                      {count}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh]">
                <div className="flex items-center justify-between border-b border-hairline px-5 pb-3 pt-2">
                  <SheetTitle className="text-lg">Filters</SheetTitle>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <FilterPanel controls={controls} showAccessibility={status === 'now-showing'} />
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

          <ActiveFilters controls={controls} className="mb-6" />

          {results.length === 0 ? (
            <EmptyState
              title="Nothing matches all of that"
              body={
                <>
                  <p>
                    No film in the programme fits every filter you have applied. Removing the
                    narrowest one usually helps — accessibility and running time cut the list hardest.
                  </p>
                  <p className="mt-2">
                    You can also{' '}
                    <Link to="/showtimes" className="font-semibold underline underline-offset-4">
                      browse by showtime
                    </Link>{' '}
                    instead.
                  </p>
                </>
              }
              action={
                <Button variant="outline" onClick={clear}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            /* Filtering re-orders the shelf rather than replacing it: cards
               travel to their new positions, arrivals fade up, departures fade
               out. Fading the whole grid out and back in would lose the sense
               that these are the same films being narrowed down. */
            <m.ul layout className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((movie) => (
                  <m.li
                    key={movie.id}
                    layout={motionPrefs.reduced ? false : 'position'}
                    initial={motionPrefs.reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={motionPrefs.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    transition={
                      motionPrefs.reduced
                        ? { duration: 0 }
                        : { duration: duration.layout, ease: ease.editorial }
                    }
                  >
                    <MovieCard movie={movie} showSynopsis />
                  </m.li>
                ))}
              </AnimatePresence>
            </m.ul>
          )}

          {status === 'now-showing' ? (
            <div className="mt-14 border-t border-hairline pt-6">
              <AccessibilityLegend />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
