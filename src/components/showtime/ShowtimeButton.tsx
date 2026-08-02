import { Link } from 'react-router-dom';
import { availabilityFor, formatLabels, movieFor, screenFor } from '@/data';
import { adultPriceRange } from '@/lib/bookingMath';
import { displayTime, minutesFromTime, timeFromMinutes } from '@/lib/datetime';
import { money } from '@/lib/format';
import { screeningEndMinutes } from '@/data/schedule';
import type { Showtime } from '@/data/types';
import { cn } from '@/lib/utils';
import { AccessibilityChips } from '@/components/movie/Chips';

const levelCopy = {
  available: { label: 'Available', tone: 'text-content-muted' },
  'filling-fast': { label: 'Filling fast', tone: 'text-warn' },
  'almost-full': { label: 'Almost full', tone: 'text-warn' },
  'sold-out': { label: 'Sold out', tone: 'text-danger' },
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
  const availability = availabilityFor(showtime);
  const movie = movieFor(showtime);
  const screen = screenFor(showtime);
  const soldOut = availability.level === 'sold-out';
  const price = adultPriceRange(showtime);
  const endTime = timeFromMinutes(screeningEndMinutes(showtime));
  const level = levelCopy[availability.level];

  const label = [
    displayTime(showtime.time),
    movie?.title,
    showCinema ? undefined : screen?.name,
    formatLabels[showtime.format],
    soldOut ? 'sold out' : `${availability.available} seats left, from ${money(price.min)}`,
    `ends about ${displayTime(endTime)}`,
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
          <span className="eyebrow text-[0.625rem] leading-none">{formatLabels[showtime.format]}</span>
        ) : null}
      </span>

      <span className="mt-1.5 block text-[0.75rem] leading-4 text-content-faint">
        {screen?.name}
        <span aria-hidden="true"> · </span>
        ends ~{displayTime(endTime)}
      </span>

      <span className="mt-2 flex items-center justify-between gap-2">
        <span className={cn('text-[0.6875rem] font-semibold', level.tone)}>{level.label}</span>
        {!soldOut ? (
          <span className="numeral text-[0.6875rem] text-content-muted">from {money(price.min)}</span>
        ) : null}
      </span>

      {/* The fill bar repeats the availability without relying on hue. */}
      <span aria-hidden="true" className="mt-1.5 block h-[3px] w-full bg-content/10">
        <span
          className={cn(
            'block h-full',
            soldOut ? 'bg-danger' : availability.ratio > 0.72 ? 'bg-warn' : 'bg-content/45',
          )}
          style={{ width: `${Math.round(availability.ratio * 100)}%` }}
        />
      </span>

      {showtime.accessibility.length ? (
        <AccessibilityChips features={showtime.accessibility} size="sm" className="mt-2" />
      ) : null}
    </>
  );

  const shell = cn(
    'block w-full min-w-[8.5rem] border p-3 text-left transition-colors duration-[--dur-fast]',
    soldOut
      ? 'cursor-not-allowed border-hairline bg-surface-sunken/60 opacity-70'
      : 'border-hairline-strong bg-surface-raised hover:border-content hover:bg-content/[0.04]',
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
        {formatLabels[showtime.format]}
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
      aria-label={`Book ${displayTime(showtime.time)}, ${formatLabels[showtime.format]}, ${availability.available} seats left`}
      data-start={start}
    >
      {content}
    </Link>
  );
}
