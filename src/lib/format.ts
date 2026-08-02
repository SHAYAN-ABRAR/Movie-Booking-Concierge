import { CURRENCY_SYMBOL } from '@/data/pricing';

/** ৳1,150 — grouped, no decimals, because every price here is whole taka. */
export function money(amount: number): string {
  return `${CURRENCY_SYMBOL}${Math.round(amount).toLocaleString('en-US')}`;
}

/** "৳350 – ৳900", collapsing to a single figure when the range is flat. */
export function moneyRange(min: number, max: number): string {
  return min === max ? money(min) : `${money(min)} – ${money(max)}`;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "A, B and C" — for reading lists aloud in prose and in Max's replies. */
export function listSentence(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/** Groups seat ids into readable runs: ["F7","F8","F9","G2"] → "F7–F9, G2". */
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
