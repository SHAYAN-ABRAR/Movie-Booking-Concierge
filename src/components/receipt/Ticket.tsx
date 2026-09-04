import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * The ticket.
 *
 * The receipt is what the printer produces; this is what you are actually
 * holding. It is die-cut rather than rectangular — clipped corners, a notch on
 * each side where the stub tears away — and it is the one surface in the
 * product that is vermilion all over. That is deliberate: everything else in
 * the system spends the accent a few pixels at a time, so spending all of it in
 * one place, once, at the end of a booking, is what makes it land.
 *
 * The tilt is built on Framer Motion rather than a tilt library. The project
 * already ships Framer Motion for the stage, the wizard transport and the
 * catalogue's layout projection; adding a second animation dependency to
 * rotate one card would be a poor trade. It also means the tilt inherits
 * `MotionConfig reducedMotion="user"` for free.
 *
 * Tilt is suppressed unless the device actually has a fine pointer that
 * hovers. On a touch screen there is no hover state to enter, so the effect
 * would only ever fire as a jolt on tap.
 */

/** The die. Corners are cut, and the stub tears off along a notched line. */
const ticketClipPath = `polygon(
  0 var(--ticket-corner),
  var(--ticket-corner) 0,
  calc(100% - var(--ticket-corner)) 0,
  100% var(--ticket-corner),
  100% calc(100% - var(--ticket-stub) - var(--ticket-notch)),
  calc(100% - var(--ticket-notch)) calc(100% - var(--ticket-stub)),
  100% calc(100% - var(--ticket-stub) + var(--ticket-notch)),
  100% calc(100% - var(--ticket-corner)),
  calc(100% - var(--ticket-corner)) 100%,
  var(--ticket-corner) 100%,
  0 calc(100% - var(--ticket-corner)),
  0 calc(100% - var(--ticket-stub) + var(--ticket-notch)),
  var(--ticket-notch) calc(100% - var(--ticket-stub)),
  0 calc(100% - var(--ticket-stub) - var(--ticket-notch))
)`;

const HOVER_TILT = '(hover: hover) and (pointer: fine)';

type TicketStyle = CSSProperties & Record<string, string | number>;

export type TicketProps = {
  body: ReactNode;
  stub: ReactNode;
  'aria-label'?: string;
  className?: string;
  /** Cut depth at each of the four corners. */
  cornerSize?: number;
  ink?: string;
  /** Depth of the tear notch on each side. */
  notchSize?: number;
  paper?: string;
  /** Height of the stub below the tear line. */
  stubHeight?: number;
  tilt?: boolean;
};

export function Ticket({
  'aria-label': ariaLabel,
  body,
  className,
  cornerSize = 10,
  ink = '#140602',
  notchSize = 13,
  paper = '#ff5c36',
  stub,
  stubHeight = 116,
  tilt = true,
}: TicketProps) {
  const reduced = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const [pointerTilts] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(HOVER_TILT).matches,
  );
  const active = tilt && pointerTilts && !reduced;

  // -0.5 … 0.5 across the card, in both axes.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), spring);
  // The glare is the same pointer position expressed as a highlight origin.
  // Derived up here, unconditionally: it feeds a node that only renders when
  // the pointer can hover, and a hook inside that branch would be a
  // conditional hook call.
  const glareX = useTransform(px, [-0.5, 0.5], ['12%', '88%']);
  const glareY = useTransform(py, [-0.5, 0.5], ['4%', '96%']);
  const glare = useTransform(
    [glareX, glareY],
    ([gx, gy]: string[]) =>
      `radial-gradient(circle at ${gx} ${gy}, rgb(255 255 255 / 0.5), transparent 55%)`,
  );

  const onMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!active) return;
      const box = frame.current?.getBoundingClientRect();
      if (!box) return;
      px.set((event.clientX - box.left) / box.width - 0.5);
      py.set((event.clientY - box.top) / box.height - 0.5);
    },
    [active, px, py],
  );

  const onLeave = useCallback(() => {
    px.set(0);
    py.set(0);
  }, [px, py]);

  const style: TicketStyle = {
    '--ticket-corner': `${cornerSize}px`,
    '--ticket-ink': ink,
    '--ticket-notch': `${notchSize}px`,
    '--ticket-paper': paper,
    '--ticket-stub': `${stubHeight}px`,
    // A drop-shadow filter rather than a box-shadow: the card is clipped to a
    // die-cut outline, and box-shadow would draw the shadow of the rectangle
    // the outline was cut from.
    filter: 'drop-shadow(0 2px 2px rgb(15 15 15 / 0.16)) drop-shadow(0 20px 30px rgb(15 15 15 / 0.22))',
  };

  return (
    <div
      ref={frame}
      className={cn('relative w-[min(100%,17rem)] [perspective:1100px]', className)}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <m.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{
          clipPath: ticketClipPath,
          rotateX: active ? rotateX : 0,
          rotateY: active ? rotateY : 0,
        }}
      >
        <article
          aria-label={ariaLabel}
          className="relative grid h-full w-full grid-rows-[minmax(0,1fr)_var(--ticket-stub)] overflow-hidden text-[var(--ticket-ink)]"
          style={{
            background:
              'linear-gradient(145deg, rgb(255 255 255 / 0.12), transparent 42%), var(--ticket-paper)',
          }}
        >
          <div className="relative min-h-0 min-w-0 overflow-hidden">
            {body}
            {/* The tear line. Inset past the notches so it meets them. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-px left-[calc(var(--ticket-notch)+6px)] right-[calc(var(--ticket-notch)+6px)] z-[2] border-b border-dashed border-current opacity-40"
            />
          </div>
          <div className="relative min-h-0 min-w-0 overflow-hidden">{stub}</div>

          {/* Glare. Card stock catches the light; this is one soft highlight
              tracking the pointer, and it is inert without one. */}
          {active ? (
            <m.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[3] mix-blend-soft-light"
              style={{ background: glare }}
            />
          ) : null}
        </article>
      </m.div>
    </div>
  );
}
