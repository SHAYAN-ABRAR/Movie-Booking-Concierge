import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { availabilityFor, movieFor, screenFor } from '@/data';
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
 * A single screening.
 *
 * Availability is communicated three ways at once — a word, a position on the
 * fill bar, and the disabled state — so it never depends on colour alone.
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
      <span className="flex items-baseline justify-between gap-3">
        <span className="numeral text-lg font-semibold leading-none tracking-[-0.02em]">
          {displayTime(showtime.time)}
        </span>
        {showFormat ? (
          <span className="eyebrow text-[0.625rem] leading-none">
            {t(formatKeys[showtime.format])}
          </span>
        ) : null}
      </span>

      <span className="mt-1.5 block text-[0.75rem] leading-4 text-content-faint">
        {screen?.name}
        <span aria-hidden="true"> · </span>
        {t('showtime.endsAbout', { time: displayTime(endTime) })}
      </span>

      <span className="mt-2 flex items-center justify-between gap-2">
        <span className={cn('text-[0.6875rem] font-semibold', level.tone)}>{t(level.key)}</span>
        {!soldOut ? (
          <span className="numeral text-[0.6875rem] text-content-muted">
            {t('showtime.fromPrice', { price: money(price.min) })}
          </span>
        ) : null}
      </span>

      {/* The fill bar repeats the availability without relying on hue, and
          measures itself out once so a full house is something you watch
          happen rather than something you have to read. */}
      <span aria-hidden="true" className="mt-1.5 block h-[3px] w-full bg-content/10">
        <span
          className={cn(
            'fill-bar block h-full motion-reduce:animate-none',
            soldOut ? 'bg-danger' : availability.ratio > 0.72 ? 'bg-warn' : 'bg-content/45',
          )}
          style={{ width: `${Math.round(availability.ratio * 100)}%` }}
        />
      </span>

      {/* Time pressure, where there genuinely is some. */}
      {imminent !== null && !soldOut ? (
        <span className="mt-1.5 block text-[0.6875rem] font-semibold text-marigold">
          {imminent === 0 ? 'Starting now' : `Starts in ${imminent} min`}
        </span>
      ) : null}

      {showtime.accessibility.length ? (
        <AccessibilityChips features={showtime.accessibility} size="sm" className="mt-2" />
      ) : null}
    </>
  );

  const shell = cn(
    'group relative block w-full min-w-[8.5rem] overflow-hidden border p-3 text-left',
    'transition-[border-color,background-color,transform,box-shadow] duration-[--dur-fast] ease-[--ease-out]',
    soldOut
      ? // Sold out stays deliberately still. Nothing to reach for.
        'cursor-not-allowed border-hairline bg-surface-sunken/60 opacity-70'
      : cn(
          'border-hairline-strong bg-surface-raised',
          'hover:-translate-y-0.5 hover:border-content hover:bg-content/[0.04]',
          'hover:shadow-[0_10px_20px_-14px_rgb(20_22_31_/_0.5)]',
          'focus-visible:-translate-y-0.5 focus-visible:border-content',
          'active:translate-y-0 active:duration-[90ms]',
        ),
    imminent !== null && !soldOut ? 'border-marigold/50' : '',
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

/** The dense variant used inside Max's showtime results and the cinema page. */
export function ShowtimePill({ showtime, className }: { showtime: Showtime; className?: string }) {
  const { t } = useTranslation();
  const availability = availabilityFor(showtime);
  const movie = movieFor(showtime);
  const soldOut = availability.level === 'sold-out';
  const start = minutesFromTime(showtime.time);

  const base = cn(
    'inline-flex flex-col items-start gap-0.5 border px-2.5 py-1.5 transition-colors',
    soldOut
      ? 'cursor-not-allowed border-hairline bg-surface-sunken/60 text-content-faint line-through'
      : 'border-hairline-strong bg-surface-raised hover:border-content',
    className,
  );

  const content = (
    <>
      <span className="numeral text-sm font-semibold leading-none">{displayTime(showtime.time)}</span>
      <span className="text-[0.625rem] uppercase tracking-[0.08em] text-content-faint">
        {t(formatKeys[showtime.format])}
      </span>
    </>
  );

  if (soldOut) {
    return (
      <span className={base} aria-label={`${displayTime(showtime.time)} — sold out`}>
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
