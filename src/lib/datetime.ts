import { addDays, format, isSameDay, parse, startOfDay } from 'date-fns';
import { activeFormatters } from '@/i18n/active';

/**
 * Date helpers. Every relative label ("today", "tonight", "this weekend") is
 * resolved against the viewer's own local clock — never a hard-coded date.
 *
 * Two halves, deliberately separated:
 *
 * - **Arithmetic** (`toIsoDate`, `dateWindow`, `minutesFromTime`, `isWeekend`…)
 *   is locale-independent and stays on date-fns with the ISO calendar. Booking
 *   logic depends on it, so it does not move.
 * - **Display** (`dayLabel`, `displayTime`, `formatRuntime`…) delegates to the
 *   active locale's formatter bundle, so "Sat 9 Aug" becomes "শনি ৯ আগ".
 *
 * In a component prefer `useFormatters()`, which subscribes; these bare helpers
 * read the store without subscribing and exist for non-React callers and for
 * the call sites that already had them.
 */

export const ISO_DATE = 'yyyy-MM-dd';

export function toIsoDate(date: Date): string {
  return format(date, ISO_DATE);
}

/** Parses `yyyy-MM-dd` as a *local* calendar day, not a UTC instant. */
export function fromIsoDate(iso: string): Date {
  return parse(iso, ISO_DATE, new Date());
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

/** The rolling booking window: today plus the next `days - 1` days. */
export function dateWindow(days = 10, now: Date = new Date()): string[] {
  const start = startOfDay(now);
  return Array.from({ length: days }, (_, i) => toIsoDate(addDays(start, i)));
}

export function isToday(iso: string, now: Date = new Date()): boolean {
  return isSameDay(fromIsoDate(iso), now);
}

export function isTomorrow(iso: string, now: Date = new Date()): boolean {
  return isSameDay(fromIsoDate(iso), addDays(now, 1));
}

/** "Today", "Tomorrow", or "Sat 9 Aug" — generated from the real local date. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const f = activeFormatters();
  return f.relativeDay(iso, now) ?? f.date(iso, 'weekdayDayMonth');
}

export function dayLabelParts(iso: string, now: Date = new Date()): { top: string; bottom: string } {
  const f = activeFormatters();
  return {
    top: f.relativeDay(iso, now) ?? f.date(iso, 'weekday'),
    bottom: f.date(iso, 'dayMonth'),
  };
}

export function longDayLabel(iso: string): string {
  return activeFormatters().date(iso, 'full');
}

export function minutesFromTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function timeFromMinutes(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 24h "20:45" → "8:45 pm" · "রাত ৮:৪৫". Used everywhere a time is shown.
 *
 * Bangla names the part of the day before the clock reading rather than after
 * it; the formatter handles that, so callers just pass the 24h string.
 */
export function displayTime(time: string): string {
  return activeFormatters().time(time);
}

export type TimeOfDayBand = 'morning' | 'afternoon' | 'evening' | 'late';

export function timeOfDay(time: string): TimeOfDayBand {
  const h = Math.floor(minutesFromTime(time) / 60);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'late';
}

/**
 * Translation keys for the bands, rather than the words themselves — the two
 * call sites are React components and read them through `t()`.
 */
export const timeOfDayKeys = {
  morning: 'showtimes.timeOfDay.morning',
  afternoon: 'showtimes.timeOfDay.afternoon',
  evening: 'showtimes.timeOfDay.evening',
  late: 'showtimes.timeOfDay.late',
} as const satisfies Record<TimeOfDayBand, string>;

/** A real Date for a screening's start, in the viewer's local time. */
export function screeningStart(date: string, time: string): Date {
  const day = fromIsoDate(date);
  day.setHours(Math.floor(minutesFromTime(time) / 60), minutesFromTime(time) % 60, 0, 0);
  return day;
}

export function formatRuntime(minutes: number): string {
  return activeFormatters().runtime(minutes);
}
