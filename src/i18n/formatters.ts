import type { AppLocale } from '@/store/preferences';
import { CURRENCY_SYMBOL } from '@/data/pricing';
import { en } from './resources/en';
import { bn } from './resources/bn';
import type { LocaleResource } from './types';

/**
 * Locale-aware formatting.
 *
 * Everything a customer reads as a *quantity* — a price, a date, a running
 * time, a seat count — goes through here, because Bangla does not merely
 * translate those: it renders them in Bengali numerals (১২৩), groups money in
 * lakh rather than thousands (১,১৫,০০০ not 115,000), and names the time of day
 * before the clock reading rather than after it.
 *
 * Built on `Intl` rather than date-fns' locale files. That is deliberate:
 * date-fns' `bn` locale translates month and weekday names but leaves the
 * digits Latin, so `format(d, 'EEE d MMM', { locale: bn })` yields the mixed
 * "রবি 9 আগস্ট". `Intl.DateTimeFormat('bn-BD')` gives "রবি ৯ আগ" — consistent
 * script throughout, which is the whole point.
 *
 * What is deliberately NOT localized: booking references, seat identifiers,
 * screen numbers used as identifiers, telephone numbers, email addresses, URLs
 * and QR payloads. Those are looked up, dictated down a phone line, read off a
 * seat back or matched against a printed ticket, so they stay Latin in both
 * languages. See `identifier()` below.
 */

/** BCP-47 tags. `bn-BD` (not plain `bn`) so money groups in lakh and crore. */
const INTL_LOCALE: Record<AppLocale, string> = {
  en: 'en-GB',
  bn: 'bn-BD',
};

/**
 * The resource objects, read directly rather than through `t()`.
 *
 * Every human-readable word this module emits — "Today", the runtime unit
 * abbreviations — comes from the same catalogue as the rest of the interface,
 * so there is exactly one place to change them. Importing the plain objects
 * (not i18next) keeps this module free of initialisation side effects, which
 * matters because pure date arithmetic is unit-tested without a React tree.
 */
const STRINGS: Record<AppLocale, LocaleResource> = { en, bn };

export type DateStyle =
  /** 9 Aug · ৯ আগ */
  | 'dayMonth'
  /** 9 Aug 2026 · ৯ আগ ২০২৬ */
  | 'dayMonthYear'
  /** Sun 9 Aug · রবি ৯ আগ */
  | 'weekdayDayMonth'
  /** Sun · রবি */
  | 'weekday'
  /** 9 August · ৯ আগস্ট */
  | 'dayLongMonth'
  /** Sunday 9 August 2026 · রবিবার ৯ আগস্ট ২০২৬ */
  | 'full';

const DATE_STYLES: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  dayMonth: { day: 'numeric', month: 'short' },
  dayMonthYear: { day: 'numeric', month: 'short', year: 'numeric' },
  weekdayDayMonth: { weekday: 'short', day: 'numeric', month: 'short' },
  weekday: { weekday: 'short' },
  dayLongMonth: { day: 'numeric', month: 'long' },
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
};

/**
 * Bangla names the part of the day *before* the clock reading — "রাত ৮:৪৫",
 * literally "night 8:45". CLDR's `bn` day-period strings are the formal
 * পূর্বাহ্ন/অপরাহ্ন pair, which nobody says aloud when arranging to meet at the
 * cinema, so the everyday six-band set is used instead.
 */
const BANGLA_DAY_PARTS: ReadonlyArray<{ untilHour: number; label: string }> = [
  { untilHour: 4, label: 'রাত' },
  { untilHour: 6, label: 'ভোর' },
  { untilHour: 12, label: 'সকাল' },
  { untilHour: 15, label: 'দুপুর' },
  { untilHour: 18, label: 'বিকাল' },
  { untilHour: 20, label: 'সন্ধ্যা' },
  { untilHour: 24, label: 'রাত' },
];

function banglaDayPart(hour24: number): string {
  return BANGLA_DAY_PARTS.find((band) => hour24 < band.untilHour)?.label ?? 'রাত';
}

export interface Formatters {
  readonly locale: AppLocale;
  /** The BCP-47 tag, for callers that need to build their own `Intl` instance. */
  readonly intlLocale: string;
  /** 1150 → "1,150" · "১,১৫০" */
  number(value: number): string;
  /** 2026 → "2026" · "২০২৬" — ungrouped, for years and small counts. */
  plain(value: number): string;
  /** 1150 → "৳1,150" · "৳১,১৫০" */
  money(amount: number): string;
  /** "৳350 – ৳900", collapsing when the range is flat. */
  moneyRange(min: number, max: number): string;
  /** 0.15 → "15%" · "১৫%" */
  percent(fraction: number): string;
  /** An ISO `yyyy-MM-dd` day, or a `Date`, in one of the named styles. */
  date(value: string | Date, style: DateStyle): string;
  /** "Today" / "Tomorrow" when the ISO day is one of those, else `null`. */
  relativeDay(iso: string, now?: Date): string | null;
  /** 24h "20:45" → "8:45 pm" · "রাত ৮:৪৫" */
  time(hhmm: string): string;
  /** 165 → "2h 45m" · "২ঘ ৪৫মি" */
  runtime(minutes: number): string;
  /** ["A","B","C"] → "A, B and C" · "A, B এবং C" */
  list(items: string[]): string;
  /**
   * Passthrough for strings that must stay Latin in every language: booking
   * references, seat ids, telephone numbers, emails, URLs, QR payloads.
   * Exists so that call sites *say* they mean it rather than silently omitting
   * a conversion someone later "fixes".
   */
  identifier(value: string): string;
}

function build(locale: AppLocale): Formatters {
  const intlLocale = INTL_LOCALE[locale];
  const strings = STRINGS[locale];

  const grouped = new Intl.NumberFormat(intlLocale);
  const ungrouped = new Intl.NumberFormat(intlLocale, { useGrouping: false });
  const percent = new Intl.NumberFormat(intlLocale, {
    style: 'percent',
    maximumFractionDigits: 0,
  });
  const listFormat = new Intl.ListFormat(intlLocale, { style: 'long', type: 'conjunction' });
  const dateFormats = new Map<DateStyle, Intl.DateTimeFormat>();
  const clock = new Intl.DateTimeFormat(intlLocale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const number = (value: number) => grouped.format(value);
  const plain = (value: number) => ungrouped.format(value);
  const money = (amount: number) => `${CURRENCY_SYMBOL}${grouped.format(Math.round(amount))}`;

  return {
    locale,
    intlLocale,
    number,
    plain,
    money,
    moneyRange: (min, max) => (min === max ? money(min) : `${money(min)} – ${money(max)}`),
    percent: (fraction) => percent.format(fraction),

    date(value, style) {
      let formatter = dateFormats.get(style);
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(intlLocale, DATE_STYLES[style]);
        dateFormats.set(style, formatter);
      }
      return formatter.format(typeof value === 'string' ? isoToLocalDate(value) : value);
    },

    relativeDay(iso, now = new Date()) {
      const day = isoToLocalDate(iso);
      const diff = Math.round(
        (startOfLocalDay(day).getTime() - startOfLocalDay(now).getTime()) / 86_400_000,
      );
      if (diff === 0) return strings.common.labels.today;
      if (diff === 1) return strings.common.labels.tomorrow;
      return null;
    },

    time(hhmm) {
      const [rawHour = '0', rawMinute = '0'] = hhmm.split(':');
      const hour24 = Number(rawHour) % 24;
      const minute = Number(rawMinute);
      if (locale === 'bn') {
        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
        const mm = ungrouped.format(minute).padStart(2, ungrouped.format(0));
        return `${banglaDayPart(hour24)} ${ungrouped.format(hour12)}:${mm}`;
      }
      // A fixed reference day: only the clock fields are read out.
      return clock.format(new Date(2000, 0, 1, hour24, minute));
    },

    runtime(minutes) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const units = strings.formats.runtime;
      if (h === 0) return `${plain(m)}${units.minute}`;
      if (m === 0) return `${plain(h)}${units.hour}`;
      return `${plain(h)}${units.hour} ${plain(m)}${units.minute}`;
    },

    list: (items) => listFormat.format(items),
    identifier: (value) => value,
  };
}

/**
 * Parses `yyyy-MM-dd` as a local calendar day.
 *
 * `new Date('2026-08-09')` is parsed as *UTC midnight*, which is the previous
 * evening anywhere west of Greenwich — the classic off-by-one-day bug. The
 * component form is local by definition.
 */
function isoToLocalDate(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * One `Formatters` per locale, built once. `Intl` constructors are expensive
 * enough that rebuilding them inside a list render is measurable.
 */
const cache = new Map<AppLocale, Formatters>();

export function formattersFor(locale: AppLocale): Formatters {
  let existing = cache.get(locale);
  if (!existing) {
    existing = build(locale);
    cache.set(locale, existing);
  }
  return existing;
}
