import type { Transition } from 'framer-motion';

/**
 * Motion tokens.
 *
 * One vocabulary for the whole product. Components never write a raw duration
 * or a raw cubic-bezier — they name an intent, and the intent decides.
 *
 * The scale is deliberately short. Seven durations is enough to express
 * everything here, and a short scale is what makes separate components feel
 * like one system rather than seven people's opinions.
 */

export const duration = {
  /** Press, toggle, immediate acknowledgement. Must feel like the same frame. */
  instant: 0.11,
  /** Hover, focus, colour and border changes. */
  fast: 0.19,
  /** Filters, cards, summaries — the workhorse. */
  base: 0.28,
  /** Layout reflow when a grid re-orders itself. */
  layout: 0.36,
  /** Route change. Long enough to read as a transition, short enough to feel instant. */
  route: 0.34,
  /** A section arriving as you scroll to it. */
  reveal: 0.46,
  /** Hero and auditorium atmosphere only. Nothing interactive may use this. */
  cinematic: 0.85,
} as const;

export type DurationToken = keyof typeof duration;

/**
 * Easing families.
 *
 * `editorial` is the house curve — a firm decelerating ease-out that makes type
 * feel placed rather than floated. `projection` is slower off the mark, for
 * light and atmosphere. `exit` is deliberately linear-ish so leaving elements
 * get out of the way instead of lingering.
 */
export const ease = {
  editorial: [0.16, 1, 0.3, 1],
  entrance: [0.22, 1, 0.36, 1],
  projection: [0.33, 0.05, 0.2, 1],
  inOut: [0.65, 0, 0.35, 1],
  exit: [0.4, 0, 0.9, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/**
 * Springs, for anything that should read as a physical object: a seat taking
 * your weight, a button pressing, a marker snapping to its new tab.
 * Deliberately over-damped — this product does not bounce.
 */
export const spring = {
  /** A seat settling. Firm, almost no overshoot. */
  seat: { type: 'spring', stiffness: 540, damping: 32, mass: 0.55 },
  /** A control being pressed. */
  press: { type: 'spring', stiffness: 700, damping: 36, mass: 0.5 },
  /** A shared indicator sliding between positions. */
  marker: { type: 'spring', stiffness: 420, damping: 38, mass: 0.7 },
  /** A panel or sheet arriving. */
  surface: { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 },
} as const satisfies Record<string, Transition>;

export type SpringToken = keyof typeof spring;

/** A tween transition from a duration token. */
export function tween(
  token: DurationToken = 'base',
  curve: keyof typeof ease = 'editorial',
  delay = 0,
): Transition {
  return { duration: duration[token], ease: ease[curve], ...(delay ? { delay } : {}) };
}

/**
 * Stagger steps. Long stagger is the single most common way motion turns into
 * a performance the user has to sit through, so these are short and capped by
 * `staggerFor()` below.
 */
export const stagger = {
  tight: 0.03,
  base: 0.045,
  loose: 0.07,
} as const;

/**
 * Caps total stagger time regardless of how many children there are.
 *
 * A 40-item catalogue at 45ms each would take 1.8s to finish arriving. This
 * compresses the step so the last item never lands later than `maxTotal`.
 */
export function staggerFor(count: number, step: number = stagger.base, maxTotal = 0.32): number {
  if (count <= 1) return 0;
  return Math.min(step, maxTotal / (count - 1));
}

/** Standard viewport config for scroll reveals: once only, and early enough to feel natural. */
export const revealViewport = { once: true, amount: 0.18, margin: '0px 0px -8% 0px' } as const;

/**
 * The same scale, as CSS custom-property references.
 *
 * A component doing a plain CSS transition writes `duration-[--dur-fast]`;
 * one animating with Framer Motion writes `duration.fast`. They must resolve
 * to the same number, or a card's hover and its layout animation run at
 * different speeds and the interface stops feeling like one thing.
 *
 * `motion.test.ts` asserts the two scales agree.
 */
export const cssDuration = {
  '--dur-instant': 'instant',
  '--dur-fast': 'fast',
  '--dur-base': 'base',
  // `--dur-slow` is the poster drift and the card sheen: the same length as a
  // section arriving on scroll, which is what `reveal` is for. There is no
  // separate JS `slow`, and adding one would be an eighth value on a scale
  // whose shortness is the point.
  '--dur-slow': 'reveal',
} as const satisfies Record<string, keyof typeof duration>;
