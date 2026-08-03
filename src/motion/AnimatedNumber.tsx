import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { duration, ease } from './tokens';
import { useMotionPreferences } from './useMotionPreferences';
import { useFormatters } from '@/i18n/useFormatters';
import { cn } from '@/lib/utils';

/**
 * A number that counts to its new value when it changes.
 *
 * Used for running totals — the booking summary, the counter subtotal, the
 * result count. It exists so a price change is *noticed*: a total that silently
 * becomes a different total is the most common way a booking interface loses
 * the customer's trust.
 *
 * Accessibility: the counting digits are `aria-hidden`, and the true final
 * value is always present as text for assistive technology from the first
 * frame. It is not a live region, so it is read when reached rather than
 * announced on every tick.
 */
export function AnimatedNumber({
  value,
  format,
  className,
  /** Skips the animation on first paint — only *changes* are worth animating. */
  animateOnMount = false,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
  animateOnMount?: boolean;
}) {
  const motion = useMotionPreferences();
  // Without an explicit formatter the counter still has to speak the reader's
  // numerals — a ticker running 1, 2, 3 beside Bangla copy is jarring, and the
  // hook means it re-renders when the language changes.
  const formatters = useFormatters();
  const render = format ?? ((n: number) => formatters.number(Math.round(n)));
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const mounted = useRef(false);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;

    const skip = motion.reduced || (!mounted.current && !animateOnMount) || from === value;
    mounted.current = true;

    if (skip) {
      setDisplay(value);
      return;
    }

    const controls = animate(from, value, {
      duration: duration.base,
      ease: ease.editorial,
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [value, motion.reduced, animateOnMount]);

  const final = render(value);

  return (
    <span className={cn('tabular-nums', className)}>
      <span aria-hidden="true">{render(display)}</span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
