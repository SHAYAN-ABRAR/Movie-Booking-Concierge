import { usePreferences } from '@/store/preferences';
import { formattersFor, type Formatters } from './formatters';

/**
 * The formatter bundle for the active locale, as a subscription.
 *
 * Components should prefer this over the bare helpers in `@/lib/format` and
 * `@/lib/datetime`. Both produce identical output, but only this one *subscribes*
 * — a component that renders a price and no translated text still needs to
 * re-render when the language changes, and the bare helpers cannot make that
 * happen on their own.
 */
export function useFormatters(): Formatters {
  return formattersFor(usePreferences((s) => s.locale));
}
