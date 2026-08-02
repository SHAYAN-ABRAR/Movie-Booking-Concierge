import type { Variants } from 'framer-motion';
import { ease, duration } from './tokens';

/**
 * Shared variants.
 *
 * Distances are small on purpose. An 8–14px rise reads as "this was placed";
 * a 60px rise reads as "a website is performing at me". Nothing here moves
 * further than 16px.
 */

/** A section arriving as it scrolls into view. */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.reveal, ease: ease.editorial },
  },
};

/** A heading revealed by lifting it out from under a clipping edge. */
export const headingReveal: Variants = {
  hidden: { opacity: 0, y: '0.5em' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.reveal, ease: ease.entrance },
  },
};

/** A hairline or stitched rule drawing itself from the left. */
export const ruleDraw: Variants = {
  hidden: { scaleX: 0, opacity: 0.4 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: duration.reveal, ease: ease.editorial },
  },
};

/** A card or list item within a staggered group. */
export const itemReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.editorial },
  },
};

/** A bar measuring itself out from its origin edge. */
export const barGrow: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: duration.reveal, ease: ease.editorial },
  },
};

/** Route transition. Directional, small, and quick. */
export const routeTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.route, ease: ease.entrance },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: duration.route * 0.6, ease: ease.exit },
  },
};

/** Booking step transition. `custom` is the direction: 1 forward, -1 back. */
export const stepTransition: Variants = {
  initial: (direction: number) => ({ opacity: 0, x: direction >= 0 ? 24 : -24 }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.base, ease: ease.entrance },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -18 : 18,
    transition: { duration: duration.fast, ease: ease.exit },
  }),
};

/** A message or result card being inserted into a list. */
export const insertItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.editorial } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

/** The featured-film sequence: one composed scene replacing another. */
export const sceneTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.cinematic * 0.55, ease: ease.projection } },
  exit: { opacity: 0, transition: { duration: duration.base, ease: ease.exit } },
};
