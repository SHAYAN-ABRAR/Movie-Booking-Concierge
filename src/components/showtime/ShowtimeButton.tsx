import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { availabilityFor, cinemaById, movieFor, screenFor } from '@/data';
import { formatKeys } from '@/i18n/domain';
import { adultPriceRange } from '@/lib/bookingMath';
import { displayTime, minutesFromTime, timeFromMinutes, todayIso } from '@/lib/datetime';
import { useNowMinutes } from '@/hooks';
import { money } from '@/lib/format';
import { screeningEndMinutes } from '@/data/schedule';
import type { Showtime } from '@/data/types';
import { cn } from '@/lib/utils';
import { AccessibilityChips } from '@/components/movie/Chips';

/** Tone is presentation; the wording lives in the catalogue. */
const levelCopy = {
  available: { key: 'showtime.availability.available', tone: 'text-content-muted' },
  'filling-fast': { key: 'showtime.availability.fillingFast', tone: 'text-warn' },
  'almost-full': { key: 'showtime.availability.almostFull', tone: 'text-warn' },
  'sold-out': { key: 'showtime.availability.soldOut', tone: 'text-danger' },
} as const;

/**
 * One screening, set as a timetable row.
 *
 * This is a cinema programme, not a shelf of products, so a screening is a
 * *line* — time, format, house, availability, price — reading left to right on
 * a single baseline. Ten of them stack into something you can scan in a couple
 * of seconds, which a grid of ten separate cards never is.
 *
 * Availability is communicated three ways at once — a word, a position on the
 * fill bar, and the disabled state — so it never depends on colour alone. The
 * whole row is one link; nothing inside it is separately clickable.
 */
export function ShowtimeButton({
  showtime,
  showFormat = true,
  showCinema = false,
  className,
}: {
  showtime: Showtime;
  showFormat?: boolean;
  showCinema?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const availability = availabilityFor(showtime);
  const movie = movieFor(showtime);
  const screen = screenFor(showtime);
  const soldOut = availability.level === 'sold-out';
  const price = adultPriceRange(showtime);
  const endTime = timeFromMinutes(screeningEndMinutes(showtime));
  const level = levelCopy[availability.level];
  // On a page that is not already filtered to one house, the venue is part of
  // the line — otherwise the row says "House Two" without saying whose.
  const cinema = showCinema ? cinemaById.get(showtime.cinemaId) : null;

  // How long until this screening starts, when that is worth saying at all.
  const nowMinutes = useNowMinutes();
  const startsAt = minutesFromTime(showtime.time);
  const isToday = showtime.date === todayIso();
  const untilStart = startsAt - nowMinutes;
  const imminent = isToday && untilStart >= 0 && untilStart <= 45 ? untilStart : null;

  const label = [
    displayTime(showtime.time),
    movie?.title,
    showCinema ? undefined : screen?.name,
    t(formatKeys[showtime.format]),
    soldOut
      ? t('showtime.availability.soldOut')
      : t('showtime.seatsAndPrice', {
          seats: t('showtime.seatsLeft', { count: availability.available }),
          price: money(price.min),
        }),
    imminent !== null && !soldOut
      ? imminent === 0
        ? t('showtime.startingNow')
        : t('showtime.startsIn', { count: imminent })
      : undefined,
    t('showtime.endsAboutSpoken', { time: displayTime(endTime) }),
  ]
    .filter(Boolean)
    .join(', ');

  const inner = (
    <>
      {/* The lit edge. Present but flat until the row is approached, so a
          column of rows reads as a timetable rather than as forty buttons. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-accent',
          'transition-transform duration-[--dur-base] ease-[--ease-out]',
          soldOut ? '' : 'group-hover:scale-y-100 group-focus-visible:scale-y-100',
          imminent !== null && !soldOut ? 'scale-y-100' : '',
        )}
      />

      {/* ── Time and format ───────────────────────────────────────── */}
      <span className="flex min-w-[5.5rem] shrink-0 flex-col">
        <span
          className={cn(
            'numeral text-[1.5rem] font-bold leading-none tracking-[-0.03em]',
            soldOut ? 'text-content-faint line-through' : '',
          )}
        >
          {displayTime(showtime.time)}
        </span>
        {showFormat ? (
          <span className="eyebrow mt-1.5 text-[0.625rem]">{t(formatKeys[showtime.format])}</span>
        ) : null}
      </span>

      {/* ── House and running window ──────────────────────────────── */}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[0.8125rem] font-medium">
          {cinema ? (
            <>
              <span className="text-accent">{cinema.shortName}</span>
              <span aria-hidden="true" className="text-content-faint">
                {' · '}
              </span>
            </>
          ) : null}
          {screen?.name}
          <span aria-hidden="true" className="text-content-faint">
            {' · '}
          </span>
          <span className="text-content-muted">
            {t('showtime.endsAbout', { time: displayTime(endTime) })}
          </span>
        </span>

        <span className="flex items-center gap-2">
          <span className={cn('text-[0.6875rem] font-semibold', level.tone)}>{t(level.key)}</span>
          {/* The fill bar repeats the availability without relying on hue, and
              measures itself out once so a full house is something you watch
              happen rather than something you have to read. */}
          <span aria-hidden="true" className="block h-[3px] w-full max-w-24 bg-content/10">
            <span
              className={cn(
                'fill-bar block h-full motion-reduce:animate-none',
                soldOut ? 'bg-danger' : availability.ratio > 0.72 ? 'bg-warn' : 'bg-content/45',
              )}
              style={{ width: `${Math.round(availability.ratio * 100)}%` }}
            />
          </span>
        </span>

        {showtime.accessibility.length ? (
          <AccessibilityChips features={showtime.accessibility} size="sm" className="mt-0.5" />
        ) : null}
      </span>

      {/* ── Price and the imminence flag ──────────────────────────── */}
      <span className="flex shrink-0 flex-col items-end gap-1">
        {!soldOut ? (
          <span className="numeral text-[0.8125rem] font-semibold">
            {t('showtime.fromPrice', { price: money(price.min) })}
          </span>
        ) : (
          <span className="eyebrow text-danger">{t('showtime.availability.soldOut')}</span>
        )}
        {/* Time pressure, where there genuinely is some. */}
        {imminent !== null && !soldOut ? (
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-accent">
            {imminent === 0 ? t('showtime.startingNow') : t('showtime.startsIn', { count: imminent })}
          </span>
        ) : null}
        {!soldOut ? (
          <ArrowRight
            aria-hidden="true"
            className="size-4 text-content-faint transition-transform duration-[--dur-base] ease-[--ease-out] group-hover:translate-x-1 group-hover:text-accent motion-reduce:transform-none"
          />
        ) : null}
      </span>
    </>
  );

  const shell = cn(
    'group relative flex w-full items-start gap-4 border-b border-hairline px-3 py-3.5 text-left',
    'transition-colors duration-[--dur-fast] ease-[--ease-out]',
    soldOut
      ? // Sold out stays deliberately still. Nothing to reach for.
        'cursor-not-allowed bg-surface-sunken/40 opacity-75'
      : 'hover:bg-content/[0.045] focus-visible:bg-content/[0.045]',
    className,
  );

  if (soldOut) {
    return (
      <div className={shell} aria-label={label} role="group">
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/booking/${movie?.slug ?? ''}?showtime=${encodeURIComponent(showtime.id)}`}
      className={shell}
      aria-label={label}
    >
      {inner}
    </Link>
  );
}

/**
 * The dense variant, for places where the screening is a chip rather than the
 * subject — the home timetable, a cinema page, Max's results.
 */
export function ShowtimePill({ showtime, className }: { showtime: Showtime; className?: string }) {
  const { t } = useTranslation();
  const availability = availabilityFor(showtime);
  const movie = movieFor(showtime);
  const soldOut = availability.level === 'sold-out';
  const start = minutesFromTime(showtime.time);

  const base = cn(
    'inline-flex flex-col items-start gap-0.5 border-2 px-2.5 py-1.5 transition-colors duration-[--dur-fast]',
    soldOut
      ? 'cursor-not-allowed border-hairline bg-surface-sunken/60 text-content-faint line-through'
      : 'border-hairline-strong bg-surface-raised hover:border-content hover:bg-content hover:text-surface',
    className,
  );

  const content = (
    <>
      <span className="numeral text-[0.9375rem] font-bold leading-none">
        {displayTime(showtime.time)}
      </span>
      <span className="text-[0.5625rem] font-bold uppercase tracking-[0.1em] opacity-70">
        {t(formatKeys[showtime.format])}
      </span>
    </>
  );

  if (soldOut) {
    return (
      <span
        className={base}
        aria-label={`${displayTime(showtime.time)} — ${t('showtime.availability.soldOut')}`}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      to={`/booking/${movie?.slug ?? ''}?showtime=${encodeURIComponent(showtime.id)}`}
      className={base}
      aria-label={t('showtime.bookLabel', {
        time: displayTime(showtime.time),
        format: t(formatKeys[showtime.format]),
        seats: t('showtime.seatsLeft', { count: availability.available }),
      })}
      data-start={start}
    >
      {content}
    </Link>
  );
}
