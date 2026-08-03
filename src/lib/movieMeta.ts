import { formatRuntime } from '@/lib/datetime';
import { certificates } from '@/data/pricing';
import type { Movie } from '@/data/types';

/**
 * Honest labels for a real catalogue.
 *
 * A studio announces a title long before it publishes a runtime or submits the
 * film for classification. Printing "0m" or inventing a rating for an
 * unclassified film would be a lie about a real release, so these helpers say
 * plainly what is not yet known.
 */

export function runtimeLabel(movie: Movie): string {
  return movie.runtimeConfirmed && movie.runtimeMinutes > 0
    ? formatRuntime(movie.runtimeMinutes)
    : 'Runtime to be confirmed';
}

/** Short form for dense rows, where the long phrase would not fit. */
export function runtimeLabelShort(movie: Movie): string {
  return movie.runtimeConfirmed && movie.runtimeMinutes > 0
    ? formatRuntime(movie.runtimeMinutes)
    : 'Runtime TBC';
}

export function certificateLabel(movie: Movie): string {
  return movie.certificateConfirmed ? certificates[movie.certificate].label : 'Not yet rated';
}

export function certificateShort(movie: Movie): string {
  return movie.certificateConfirmed
    ? (certificates[movie.certificate].label.split('—')[0]?.trim() ?? movie.certificate)
    : 'Not yet rated';
}

export function statusLabel(movie: Movie): string {
  return movie.status === 'coming-soon' ? 'Coming soon' : 'Now showing';
}

/** Release dates for unreleased films are studio plans, and move. */
export function releaseLabel(movie: Movie): string {
  const date = new Date(movie.releaseDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return movie.status === 'coming-soon' ? `${date} — subject to change` : date;
}

/**
 * The disclosure that must appear wherever this catalogue is presented.
 * Movie facts are real; everything GrandPlex does with them is simulated.
 */
export const CATALOGUE_DISCLOSURE =
  'Movie information and artwork are based on public release sources. GrandPlex showtimes, prices and seat availability are simulated for this demonstration.';
