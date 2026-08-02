import { m } from 'framer-motion';
import type { ReactNode } from 'react';
import { revealViewport, staggerFor, stagger as staggerTokens } from './tokens';
import { itemReveal, sectionReveal, headingReveal, ruleDraw, barGrow } from './variants';
import { useMotionPreferences } from './useMotionPreferences';
import { cn } from '@/lib/utils';

type RevealKind = 'section' | 'heading' | 'rule' | 'item' | 'bar';

const variantsFor = {
  section: sectionReveal,
  heading: headingReveal,
  rule: ruleDraw,
  item: itemReveal,
  bar: barGrow,
} as const;

/**
 * Reveals its children once, when scrolled into view.
 *
 * Three things make this safe rather than decorative:
 *
 * - `once: true` — content never re-animates when you scroll back past it.
 * - Under reduced motion the element renders in its final state with no
 *   animation at all, rather than relying on a 0.01ms CSS override.
 * - Only opacity and transform move, so nothing is removed from the
 *   accessibility tree and nothing reflows the page.
 */
export function Reveal({
  children,
  kind = 'section',
  delay = 0,
  className,
  as = 'div',
  ...rest
}: {
  children: ReactNode;
  kind?: RevealKind;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span' | 'p';
} & Record<string, unknown>) {
  const motion = useMotionPreferences();
  const Component = m[as];

  if (motion.reduced) {
    const Static = as;
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    );
  }

  return (
    <Component
      className={cn(kind === 'rule' || kind === 'bar' ? 'origin-left' : '', className)}
      variants={variantsFor[kind]}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      transition={delay ? { delay } : undefined}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Staggers its children into view once.
 *
 * The step is computed from the child count and capped, so a four-item row and
 * a forty-item catalogue both finish arriving in about the same time. Long
 * cascades are the fastest way to make motion feel like a performance.
 */
export function Stagger({
  children,
  count,
  step = staggerTokens.base,
  className,
  as = 'div',
  ...rest
}: {
  children: ReactNode;
  count: number;
  step?: number;
  className?: string;
  as?: 'div' | 'ul' | 'ol' | 'section';
} & Record<string, unknown>) {
  const motion = useMotionPreferences();
  const Component = m[as];

  if (motion.reduced) {
    const Static = as;
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    );
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerFor(count, step) } },
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}

/** A child of `Stagger`. Inherits the parent's hidden/visible states. */
export function StaggerItem({
  children,
  className,
  as = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'span';
} & Record<string, unknown>) {
  const motion = useMotionPreferences();
  const Component = m[as];

  if (motion.reduced) {
    const Static = as;
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    );
  }

  return (
    <Component className={className} variants={itemReveal} {...rest}>
      {children}
    </Component>
  );
}
