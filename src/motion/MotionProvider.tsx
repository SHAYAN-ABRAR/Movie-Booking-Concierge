import { LazyMotion, MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * The motion root.
 *
 * `LazyMotion` loads the feature bundle asynchronously rather than pulling it
 * into the entry chunk, and `strict` makes the heavyweight `motion.*`
 * components throw — so the saving cannot be silently undone later by
 * importing the wrong thing. Every component in this codebase uses `m.*`.
 *
 * `domMax` rather than `domAnimation` because this product genuinely uses
 * layout projection: the shared marker that travels along the booking
 * transport, the featured-stage indicator, and the catalogue re-ordering
 * itself when a filter changes. Those are ~10 KB more than `domAnimation`,
 * loaded off the critical path, and they are the difference between a marker
 * that moves and one that teleports.
 *
 * `reducedMotion="user"` makes every animation in the tree honour the OS
 * setting by default, without each component having to remember.
 */
const loadFeatures = () => import('framer-motion').then((mod) => mod.domMax);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
