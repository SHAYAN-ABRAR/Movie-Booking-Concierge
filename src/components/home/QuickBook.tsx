import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AnimatedNumber, useMotionPreferences } from '@/motion';
import { ease } from '@/motion/tokens';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/field';
import {
  availabilityFor,
  cinemas,
  cities,
  formatLabels,
  movieById,
  showtimesForCinemaDate,
} from '@/data';
import { dateWindow, dayLabel, displayTime } from '@/lib/datetime';
import { usePreferences } from '@/store/preferences';
import { money } from '@/lib/format';
import { adultPriceRange } from '@/lib/bookingMath';
import { useTranslation } from 'react-i18next';

/**
 * Quick booking.
 *
 * Four dependent selects. Each one narrows the next, and anything downstream
 * of a change is cleared rather than left pointing at something impossible.
 * Every state is reachable by keyboard, and the submit control explains why
 * it is disabled instead of simply being dead.
 */
export function QuickBook() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const motion = useMotionPreferences();
  const preferredCinema = usePreferences((s) => s.cinemaId);
  const setPreferredCinema = usePreferences((s) => s.setCinema);

  const dates = useMemo(() => dateWindow(10), []);
  const [cinemaId, setCinemaId] = useState<string>(preferredCinema ?? cinemas[0]!.id);
  const [date, setDate] = useState<string>(dates[0]!);
  const [movieId, setMovieId] = useState<string>('');
  const [showtimeId, setShowtimeId] = useState<string>('');

  const dayShowtimes = useMemo(
    () => showtimesForCinemaDate(cinemaId, date),
    [cinemaId, date],
  );

  const availableMovies = useMemo(() => {
    const ids = new Set(dayShowtimes.map((s) => s.movieId));
    return [...ids].map((id) => movieById.get(id)).filter((m) => Boolean(m));
  }, [dayShowtimes]);

  const movieShowtimes = useMemo(
    () =>
      dayShowtimes
        .filter((s) => s.movieId === movieId)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [dayShowtimes, movieId],
  );

  const chosenMovie = movieId ? movieById.get(movieId) : undefined;
  const chosenShowtime = movieShowtimes.find((s) => s.id === showtimeId);

  function changeCinema(next: string) {
    setCinemaId(next);
    setPreferredCinema(next);
    setMovieId('');
    setShowtimeId('');
  }

  function changeDate(next: string) {
    setDate(next);
    setMovieId('');
    setShowtimeId('');
  }

  function changeMovie(next: string) {
    setMovieId(next);
    setShowtimeId('');
  }

  const disabledReason = !movieId
    ? 'Choose a film to continue'
    : !showtimeId
      ? 'Choose a time to continue'
      : null;

  function submit() {
    if (!chosenMovie || !chosenShowtime) return;
    navigate(`/booking/${chosenMovie.slug}?showtime=${encodeURIComponent(chosenShowtime.id)}`);
  }

  return (
    <section aria-labelledby="quick-book-heading">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="quick-book-heading" className="font-display text-xl leading-none tracking-[-0.02em]">
          {t('quickBook.heading')}
        </h2>
        <span className="eyebrow">{t('quickBook.noAccount')}</span>
      </div>

      {/* Four dependent fields on one line. Each completed field lights its
          own marker, so progress through the stub is visible at a glance. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="qb-cinema">Cinema</Label>
          <Select value={cinemaId} onValueChange={changeCinema}>
            <SelectTrigger id="qb-cinema">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectGroup key={city}>
                  <SelectLabel>{city}</SelectLabel>
                  {cinemas
                    .filter((c) => c.city === city)
                    .map((cinema) => (
                      <SelectItem key={cinema.id} value={cinema.id}>
                        {cinema.shortName}
                      </SelectItem>
                    ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qb-date">Date</Label>
          <Select value={date} onValueChange={changeDate}>
            <SelectTrigger id="qb-date">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dates.map((d) => (
                <SelectItem key={d} value={d}>
                  {dayLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qb-movie">Film</Label>
          <Select value={movieId} onValueChange={changeMovie} disabled={availableMovies.length === 0}>
            <SelectTrigger id="qb-movie">
              <SelectValue
                placeholder={availableMovies.length === 0 ? 'Nothing scheduled' : 'Choose a film'}
              />
            </SelectTrigger>
            <SelectContent>
              {availableMovies.map((movie) => (
                <SelectItem key={movie!.id} value={movie!.id}>
                  {movie!.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qb-time">Time</Label>
          <Select value={showtimeId} onValueChange={setShowtimeId} disabled={!movieId}>
            <SelectTrigger id="qb-time">
              <SelectValue placeholder={movieId ? 'Choose a time' : 'Choose a film first'} />
            </SelectTrigger>
            <SelectContent>
              {movieShowtimes.map((showtime) => {
                const availability = availabilityFor(showtime);
                const soldOut = availability.level === 'sold-out';
                return (
                  <SelectItem key={showtime.id} value={showtime.id} disabled={soldOut}>
                    {displayTime(showtime.time)} · {formatLabels[showtime.format]}
                    {soldOut ? ' · Sold out' : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-content-muted" aria-live="polite">
          {chosenShowtime ? (
            <>
              Tickets from{' '}
              <AnimatedNumber
                value={adultPriceRange(chosenShowtime).min}
                format={(n) => money(n)}
                className="font-semibold text-content"
              />{' '}
              ·{' '}
              <AnimatedNumber
                value={availabilityFor(chosenShowtime).available}
                className="font-semibold text-content"
              />{' '}
              seats left
            </>
          ) : (
            <span className="text-content-muted">{disabledReason}</span>
          )}
        </p>

        {/* Enabling is worth noticing, so the control settles into place the
            moment the last dependency is satisfied. */}
        <m.div
          animate={
            motion.reduced || disabledReason
              ? { scale: 1 }
              : { scale: [1, 1.025, 1] }
          }
          transition={{ duration: motion.reduced ? 0 : 0.34, ease: ease.editorial }}
          className="sm:shrink-0"
        >
          <Button
            onClick={submit}
            disabled={Boolean(disabledReason)}
            size="lg"
            className="w-full sm:w-auto sm:min-w-44"
          >
            {t('quickBook.chooseSeats')}
            <ArrowRight aria-hidden="true" />
          </Button>
        </m.div>
      </div>
    </section>
  );
}
