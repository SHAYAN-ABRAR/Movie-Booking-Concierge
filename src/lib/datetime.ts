import { addDays, format, isSameDay, parse, startOfDay } from 'date-fns';

/**
 * Date helpers. Every relative label ("today", "tonight", "this weekend") is
 * resolved against the viewer's own local clock — never a hard-coded date.
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
  if (isToday(iso, now)) return 'Today';
  if (isTomorrow(iso, now)) return 'Tomorrow';
  return format(fromIsoDate(iso), 'EEE d MMM');
}

export function dayLabelParts(iso: string, now: Date = new Date()): { top: string; bottom: string } {
  const date = fromIsoDate(iso);
  if (isToday(iso, now)) return { top: 'Today', bottom: format(date, 'd MMM') };
  if (isTomorrow(iso, now)) return { top: 'Tomorrow', bottom: format(date, 'd MMM') };
  return { top: format(date, 'EEE'), bottom: format(date, 'd MMM') };
}

export function longDayLabel(iso: string): string {
  return format(fromIsoDate(iso), 'EEEE d MMMM yyyy');
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

/** 24h "20:45" → "8:45 pm". Used everywhere a time is shown to a customer. */
export function displayTime(time: string): string {
  const minutes = minutesFromTime(time);
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export type TimeOfDayBand = 'morning' | 'afternoon' | 'evening' | 'late';

export function timeOfDay(time: string): TimeOfDayBand {
  const h = Math.floor(minutesFromTime(time) / 60);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'late';
}

export const timeOfDayLabels: Record<TimeOfDayBand, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late: 'Late night',
};

/** A real Date for a screening's start, in the viewer's local time. */
export function screeningStart(date: string, time: string): Date {
  const day = fromIsoDate(date);
  day.setHours(Math.floor(minutesFromTime(time) / 60), minutesFromTime(time) % 60, 0, 0);
  return day;
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
