import { activeFormatters } from '@/i18n/active';

/**
 * Presentation helpers.
 *
 * The numeric ones delegate to the active locale's formatter bundle, so a price
 * reads "৳1,150" in English and "৳১,১৫০" in Bangla without every call site
 * having to know that. In a React component prefer `useFormatters()` — it
 * produces the same output but also subscribes, so a component showing a price
 * and no translated text still re-renders when the language changes.
 */

/** ৳1,150 — grouped, no decimals, because every price here is whole taka. */
export function money(amount: number): string {
  return activeFormatters().money(amount);
}

/** "৳350 – ৳900", collapsing to a single figure when the range is flat. */
export function moneyRange(min: number, max: number): string {
  return activeFormatters().moneyRange(min, max);
}

/**
 * English-only pluralisation, kept for prose that genuinely reads as a sentence.
 *
 * Bangla does not inflect nouns for number the way English does — "২টি আসন" and
 * "১টি আসন" share the same noun — so translated surfaces use i18next's own
 * `_one` / `_other` plural keys instead of calling this. Only the count is
 * localized here.
 */
export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${activeFormatters().number(count)} ${count === 1 ? singular : plural}`;
}

/** "A, B and C" — for reading lists aloud in prose and in Max's replies. */
export function listSentence(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  return activeFormatters().list(items);
}

/**
 * Groups seat ids into readable runs: ["F7","F8","F9","G2"] → "F7–F9, G2".
 *
 * Stays Latin in every language: these are printed on the seat backs and on the
 * ticket, and a customer walking down a dark aisle has to match what they read
 * on the screen against what is stencilled on the chair.
 */
export function seatRanges(seatIds: string[]): string {
  if (seatIds.length === 0) return '';
  const parsed = seatIds
    .map((id) => {
      const match = /^([A-Z]+)(\d+)$/.exec(id);
      return match ? { row: match[1]!, number: Number(match[2]), id } : null;
    })
    .filter((s): s is { row: string; number: number; id: string } => s !== null)
    .sort((a, b) => (a.row === b.row ? a.number - b.number : a.row.localeCompare(b.row)));

  const runs: string[] = [];
  let start = parsed[0];
  let previous = parsed[0];
  if (!start || !previous) return seatIds.join(', ');

  for (let i = 1; i <= parsed.length; i += 1) {
    const current = parsed[i];
    const contiguous =
      current && current.row === previous.row && current.number === previous.number + 1;
    if (!contiguous) {
      if (start.id === previous.id) runs.push(start.id);
      else if (previous.number === start.number + 1) runs.push(`${start.id}, ${previous.id}`);
      else runs.push(`${start.id}–${previous.id}`);
      if (current) start = current;
    }
    if (current) previous = current;
  }
  return runs.join(', ');
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Trims a string for display without cutting a word in half. */
export function truncateWords(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}
