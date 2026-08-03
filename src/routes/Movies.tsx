import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
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

export function Movies() {
  const { t } = useTranslation();
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
        eyebrow={t('movies.eyebrow')}
        title={status === 'coming-soon' ? t('movies.comingSoon') : t('movies.nowShowing')}
        lede={
          status === 'coming-soon' ? t('movies.ledeComingSoon') : t('movies.ledeNowShowing')
        }
      />

      <div className="flex flex-col gap-6 py-6 lg:flex-row lg:gap-12 lg:py-10">
        {/* ── Sidebar filters (desktop) ──────────────────────────────── */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label={t('filters.heading')}>
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
              <TabsTrigger value="now-showing">{t('movies.nowShowing')}</TabsTrigger>
              <TabsTrigger value="coming-soon">{t('movies.comingSoon')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {status === 'now-showing' ? (
            <div className="mb-6">
              <p className="eyebrow mb-2.5">{t('movies.screeningOn')}</p>
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
                  {t('movies.showEveryDay')}
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-hairline py-3">
            <p className="text-sm text-content-muted" aria-live="polite" role="status">
              {/* The numeral animates, so the count cannot simply be interpolated
                  into the sentence — `<n>` marks where the ticker belongs and
                  each language puts it where its own grammar wants it. */}
              <span className="font-semibold text-content">
                <Trans
                  i18nKey={results.length === 1 ? 'movies.films_one' : 'movies.films_other'}
                  count={results.length}
                  components={{ n: <AnimatedNumber value={results.length} /> }}
                />
              </span>
              {count > 0 ? <> {t('movies.matchingFilters', { count })}</> : null}
            </p>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal aria-hidden="true" />
                  {t('filters.heading')}
                  {count > 0 ? (
                    <span className="numeral ml-1 bg-content px-1.5 text-[0.6875rem] text-surface">
                      {count}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh]">
                <div className="flex items-center justify-between border-b border-hairline px-5 pb-3 pt-2">
                  <SheetTitle className="text-lg">{t('filters.heading')}</SheetTitle>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <FilterPanel controls={controls} showAccessibility={status === 'now-showing'} />
                </div>
                <div className="flex gap-3 border-t border-hairline px-5 py-4">
                  <Button variant="outline" block onClick={clear}>
                    {t('filters.clearAll')}
                  </Button>
                  <SheetClose asChild>
                    <Button block>{t('filters.showCount', { count: results.length })}</Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <ActiveFilters controls={controls} className="mb-6" />

          {results.length === 0 ? (
            <EmptyState
              title={t('movies.emptyTitle')}
              variant="index"
              body={
                <>
                  <p>{t('movies.emptyBody')}</p>
                  <p className="mt-2">
                    <Trans
                      i18nKey="movies.emptyAlternative"
                      components={{
                        showtimes: (
                          <Link
                            to="/showtimes"
                            className="font-semibold underline underline-offset-4"
                          />
                        ),
                      }}
                    />
                  </p>
                </>
              }
              action={
                <Button variant="outline" onClick={clear}>
                  {t('movies.clearAllFilters')}
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
