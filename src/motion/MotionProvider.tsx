import { LazyMotion, MotionConfig, domMax } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * The motion root.
 *
 * ── Features are loaded EAGERLY, deliberately ───────────────────────────
 *
 * `features` was previously an async loader:
 *
 *     const loadFeatures = () => import('framer-motion').then((m) => m.domMax);
 *
 * That saved ~30 KB from the entry chunk and broke every in-app navigation in
 * the product. `m` components mount before the dynamic import resolves; when
 * the features arrive those already-mounted components are not re-registered
 * with the presence lifecycle, so their exit animations run visually but never
 * call `safeToRemove`. Any `AnimatePresence` above them then holds the exiting
 * child forever — which is exactly how the routed outlet ended up showing a
 * fully-transparent copy of the previous page instead of the new route.
 *
 * Proven by isolation: swapping this one prop from the async loader to the
 * eager `domMax` binding fixed every navigation, with nothing else changed.
 * See docs/booking-confirmation-root-cause.md.
 *
 * The bundle cost is real and is the correct trade. A page that renders beats
 * a page that is 30 KB smaller.
 *
 * `strict` still makes the heavyweight `motion.*` components throw, so the
 * tree-shaking benefit of `m.*` everywhere is preserved.
 *
 * `domMax` rather than `domAnimation` because this product genuinely uses
 * layout projection: the marker travelling along the booking transport, the
 * featured-stage indicator, and the catalogue re-ordering under a filter.
 *
 * `reducedMotion="user"` makes every animation in the tree honour the OS
 * setting by default, without each component having to remember.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
