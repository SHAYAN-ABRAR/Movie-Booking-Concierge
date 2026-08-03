import { usePreferences } from '@/store/preferences';
import { formattersFor, type Formatters } from './formatters';

/**
 * The formatter bundle for whatever locale the store currently holds.
 *
 * For code that runs outside React — Max's skills and executor, store logic,
 * anything building a string in a plain function. React components should use
 * `useFormatters()` from `./useFormatters` instead, because this reads the
 * store without subscribing to it.
 */
export function activeFormatters(): Formatters {
  return formattersFor(usePreferences.getState().locale);
}
