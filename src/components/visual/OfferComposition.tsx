import { useId } from 'react';
import { m } from 'framer-motion';
import { offerArtFor } from '@/data/offerArt';
import type { OfferArt } from '@/data/offerArt';
import { useMotionPreferences } from '@/motion';
import { duration, ease } from '@/motion/tokens';
import type { Offer } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * Offer compositions.
 *
 * Five pieces of cinema stationery, drawn as SVG from each offer's own art
 * direction in `src/data/offerArt.ts`. Nothing is fetched, generated at runtime
 * or randomised — the same offer always draws the same object.
 *
 * These replace the `OfferPlate`, which was the film plate at a different
 * aspect ratio and therefore made every promotion look like the same rectangle.
 *
 * Two variants that re-compose rather than scale:
 *
 * - `full`  8:5, the whole object with its printed furniture
 * - `tile`  16:9, the same object cropped to its most recognisable corner
 *
 * The SVG is `aria-hidden` throughout. Every fact any composition depicts —
 * the value, the days, the cinemas, the mechanic — is real text beside it.
 */

export type OfferVariant = 'full' | 'tile';

const box: Record<OfferVariant, { w: number; h: number }> = {
  full: { w: 320, h: 200 },
  tile: { w: 288, h: 162 },
};

const aspect: Record<OfferVariant, string> = {
  full: 'aspect-[8/5]',
  tile: 'aspect-[16/9]',
};

interface PieceProps {
  a: OfferArt;
  w: number;
  h: number;
  variant: OfferVariant;
  /** True when the single moving layer is allowed to run its one pass. */
  animate: boolean;
}

/* ══════════════════════════════════════════════════════════════════════
   STUB — a ticket torn from the book, counterfoil still attached
   ══════════════════════════════════════════════════════════════════════ */

function Stub({ a, w, h, variant }: PieceProps) {
  const perfX = w * (variant === 'tile' ? 0.28 : 0.34);
  const rules = variant === 'tile' ? 3 : 4;

  return (
    <>
      {/* The counterfoil's printed rules — a stub always carries small print. */}
      {Array.from({ length: rules }, (_, i) => (
        <line
          key={i}
          x1={w * 0.07}
          y1={h * 0.42 + i * (h * 0.09)}
          x2={perfX - w * 0.06 - (i % 2) * (w * 0.05)}
          y2={h * 0.42 + i * (h * 0.09)}
          stroke={a.ink}
          strokeWidth={1.4}
          opacity={0.32}
        />
      ))}

      {/* The punch — every stub that has been used has a hole in it. */}
      <circle cx={w * 0.17} cy={h * 0.22} r={h * 0.055} fill="none" stroke={a.ink} strokeWidth={1.4} opacity={0.5} />
      <circle cx={w * 0.17} cy={h * 0.22} r={h * 0.022} fill={a.accent} />

      {/* Perforation: two bitten edges and the dashed line between them. */}
      <circle cx={perfX} cy={0} r={h * 0.045} fill={a.ground} />
      <circle cx={perfX} cy={h} r={h * 0.045} fill={a.ground} />
      <line
        x1={perfX}
        y1={h * 0.07}
        x2={perfX}
        y2={h * 0.93}
        stroke={a.ink}
        strokeWidth={1.5}
        strokeDasharray="2.5 5"
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* The value side is kept clear; a single rule anchors the figure. */}
      <line
        x1={perfX + w * 0.07}
        y1={h * 0.7}
        x2={w * 0.93}
        y2={h * 0.7}
        stroke={a.accent}
        strokeWidth={2.5}
      />
      <rect x={w * 0.93 - 2.5} y={h * 0.7 - h * 0.05} width={2.5} height={h * 0.05} fill={a.accent} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PASS — four admissions on one perforated strip
   ══════════════════════════════════════════════════════════════════════ */

function Pass({ a, w, h, variant }: PieceProps) {
  const segments = 4;
  const inset = h * 0.13;
  const segW = w / segments;
  // The last admission is the one that has been torn off and used.
  const used = segments - 1;

  return (
    <>
      {/* Sprocket edges, top and bottom — the house motif at strip scale. */}
      {(['top', 'bottom'] as const).map((edge) =>
        Array.from({ length: variant === 'tile' ? 9 : 12 }, (_, i) => (
          <rect
            key={`${edge}-${i}`}
            x={w * 0.035 + i * ((w * 0.93) / (variant === 'tile' ? 9 : 12))}
            y={edge === 'top' ? inset * 0.32 : h - inset * 0.32 - h * 0.045}
            width={w * 0.028}
            height={h * 0.045}
            rx={1}
            fill={a.ink}
            opacity={0.4}
          />
        )),
      )}

      {/* Perforations between admissions. */}
      {Array.from({ length: segments - 1 }, (_, i) => (
        <line
          key={i}
          x1={segW * (i + 1)}
          y1={inset}
          x2={segW * (i + 1)}
          y2={h - inset}
          stroke={a.ink}
          strokeWidth={1.4}
          strokeDasharray="2.5 4.5"
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}

      {/* One mark per admission; the used one is punched clean through. */}
      {Array.from({ length: segments }, (_, i) => {
        const cx = segW * (i + 0.5);
        const cy = h * 0.36;
        return i === used ? (
          <g key={i}>
            <circle cx={cx} cy={cy} r={h * 0.085} fill={a.ground} stroke={a.accent} strokeWidth={1.6} />
            <line
              x1={cx - h * 0.045}
              y1={cy - h * 0.045}
              x2={cx + h * 0.045}
              y2={cy + h * 0.045}
              stroke={a.accent}
              strokeWidth={1.6}
            />
            <line
              x1={cx + h * 0.045}
              y1={cy - h * 0.045}
              x2={cx - h * 0.045}
              y2={cy + h * 0.045}
              stroke={a.accent}
              strokeWidth={1.6}
            />
          </g>
        ) : (
          <g key={i}>
            <circle cx={cx} cy={cy} r={h * 0.085} fill="none" stroke={a.ink} strokeWidth={1.4} opacity={0.55} />
            <line
              x1={cx - w * 0.045}
              y1={cy + h * 0.19}
              x2={cx + w * 0.045}
              y2={cy + h * 0.19}
              stroke={a.ink}
              strokeWidth={1.3}
              opacity={0.3}
            />
          </g>
        );
      })}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LEADER — Academy countdown, running down to a late feature
   ══════════════════════════════════════════════════════════════════════ */

function Leader({ a, w, h, variant, animate }: PieceProps) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.min(w, h) * 0.36;
  // The crosshair leaves the middle clear so the figure has a ground.
  const gap = r * 0.42;

  return (
    <>
      {/* Frame edge and corner registration ticks. */}
      <rect
        x={w * 0.035}
        y={h * 0.06}
        width={w * 0.93}
        height={h * 0.88}
        fill="none"
        stroke={a.ink}
        strokeWidth={1.1}
        opacity={0.28}
      />

      <circle cx={cx} cy={cy} r={r} fill="none" stroke={a.ink} strokeWidth={1.5} opacity={0.7} />
      <circle cx={cx} cy={cy} r={r * 0.66} fill="none" stroke={a.ink} strokeWidth={1} opacity={0.4} />

      {/* Crosshair, broken at the centre. */}
      {[
        [cx, h * 0.06, cx, cy - gap],
        [cx, cy + gap, cx, h * 0.94],
        [w * 0.035, cy, cx - gap, cy],
        [cx + gap, cy, w * 0.965, cy],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.ink} strokeWidth={1.1} opacity={0.45} />
      ))}

      {/* The sweep arm. It makes exactly one revolution when the composition
          first comes into view, then rests — a countdown that has finished, not
          a decoration that spins forever. */}
      {animate ? (
        <m.line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r}
          stroke={a.accent}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
          initial={{ rotate: 0, opacity: 0.95 }}
          whileInView={{ rotate: 360, opacity: 0.95 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.5, ease: ease.projection }}
        />
      ) : (
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r}
          stroke={a.accent}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.95}
        />
      )}

      {/* Sprocket columns down both edges. */}
      {(['left', 'right'] as const).map((side) =>
        Array.from({ length: variant === 'tile' ? 5 : 7 }, (_, i) => (
          <rect
            key={`${side}-${i}`}
            x={side === 'left' ? w * 0.008 : w * 0.972}
            y={h * 0.09 + i * ((h * 0.82) / (variant === 'tile' ? 5 : 7))}
            width={w * 0.02}
            height={h * 0.06}
            rx={1}
            fill={a.ink}
            opacity={0.45}
          />
        )),
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   INSERT — a folded programme insert. The quietest of the five.
   ══════════════════════════════════════════════════════════════════════ */

function Insert({ a, w, h, variant }: PieceProps) {
  const foldX = w * 0.52;
  const corner = h * 0.17;
  const rules = variant === 'tile' ? 3 : 5;

  return (
    <>
      {/* The fold: a crease with the light falling off either side of it. */}
      <rect x={foldX - w * 0.05} y={0} width={w * 0.05} height={h} fill={a.ink} opacity={0.05} />
      <rect x={foldX} y={0} width={w * 0.04} height={h} fill={a.accent} opacity={0.04} />
      <line x1={foldX} y1={0} x2={foldX} y2={h} stroke={a.ink} strokeWidth={1} opacity={0.32} />

      {/* Turned-down corner, top right. */}
      <path d={`M ${w - corner} 0 L ${w} 0 L ${w} ${corner} Z`} fill={a.ink} opacity={0.11} />
      <line x1={w - corner} y1={0} x2={w} y2={corner} stroke={a.ink} strokeWidth={1} opacity={0.3} />

      {/* Set copy on the left leaf: one heading rule, then body. */}
      <line
        x1={w * 0.08}
        y1={h * 0.24}
        x2={w * 0.34}
        y2={h * 0.24}
        stroke={a.accent}
        strokeWidth={2.5}
      />
      {Array.from({ length: rules }, (_, i) => (
        <line
          key={i}
          x1={w * 0.08}
          y1={h * 0.4 + i * (h * 0.1)}
          x2={w * 0.44 - (i === rules - 1 ? w * 0.13 : 0)}
          y2={h * 0.4 + i * (h * 0.1)}
          stroke={a.ink}
          strokeWidth={1.3}
          opacity={0.26}
        />
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CARD — a membership card, lying on the counter
   ══════════════════════════════════════════════════════════════════════ */

function Card({ a, w, h, variant }: PieceProps) {
  const x = w * 0.09;
  const y = h * 0.14;
  const cw = w * 0.82;
  const ch = h * 0.72;
  const chips = variant === 'tile' ? 6 : 9;

  return (
    <>
      {/* Print registration: the same card, one pass out of alignment. */}
      <rect x={x + 5} y={y + 5} width={cw} height={ch} rx={3} fill={a.accent} opacity={0.22} />
      <rect
        x={x}
        y={y}
        width={cw}
        height={ch}
        rx={3}
        fill={a.ground}
        stroke={a.ink}
        strokeWidth={1.4}
        opacity={0.98}
      />

      {/* Signature strip. Ruled, but never signed — this is not a real card. */}
      <rect x={x} y={y + ch * 0.62} width={cw} height={ch * 0.19} fill={a.ink} opacity={0.16} />
      <line
        x1={x + cw * 0.05}
        y1={y + ch * 0.755}
        x2={x + cw * 0.62}
        y2={y + ch * 0.755}
        stroke={a.ink}
        strokeWidth={1}
        opacity={0.4}
      />

      {/* Embossed run along the foot. */}
      {Array.from({ length: chips }, (_, i) => (
        <rect
          key={i}
          x={x + cw * 0.05 + i * (cw * 0.072)}
          y={y + ch * 0.87}
          width={cw * 0.045}
          height={ch * 0.07}
          rx={1}
          fill={a.ink}
          opacity={i % 3 === 0 ? 0.5 : 0.28}
        />
      ))}
    </>
  );
}

const pieces = {
  stub: Stub,
  pass: Pass,
  leader: Leader,
  insert: Insert,
  card: Card,
} as const;

/**
 * Where the figure sits, per composition. They differ so that five offers on
 * one page do not resolve into five identically-placed numbers.
 */
const figurePosition: Record<OfferArt['composition'], string> = {
  stub: 'items-end justify-end pb-[32%] pr-[8%] text-right',
  pass: 'items-start justify-end pb-[12%] pl-[6%]',
  leader: 'items-center justify-center text-center',
  insert: 'items-end justify-center pl-[54%] pr-[6%] text-center',
  card: 'items-start justify-start pl-[14%] pt-[22%]',
};

export function OfferComposition({
  offer,
  variant = 'full',
  className,
}: {
  offer: Offer;
  variant?: OfferVariant;
  className?: string;
}) {
  const motion = useMotionPreferences();
  const art = offerArtFor(offer.id);
  const { w, h } = box[variant];
  const gradientId = useId();
  const Piece = pieces[art.composition];

  // Only the leader moves, only on the full composition, and only once.
  const animate = !motion.reduced && art.composition === 'leader' && variant === 'full';

  return (
    <div
      className={cn('relative isolate overflow-hidden', aspect[variant], className)}
      style={{ backgroundColor: art.ground }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`sheen-${gradientId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={art.accent} stopOpacity="0.14" />
            <stop offset="60%" stopColor={art.accent} stopOpacity="0.02" />
            <stop offset="100%" stopColor={art.ground} stopOpacity="0" />
          </linearGradient>
        </defs>

        <Piece a={art} w={w} h={h} variant={variant} animate={animate} />

        {/* A single raking light across the paper. Never behind the figure. */}
        <rect width={w} height={h} fill={`url(#sheen-${gradientId})`} />
      </svg>

      {/* The figure. Real text, in the DOM, transcribed from the offer's own
          mechanic — but `aria-hidden`, because the mechanic itself is set in
          full beside the composition and a screen reader should hear that. */}
      <div
        aria-hidden="true"
        className={cn('absolute inset-0 z-10 flex flex-col', figurePosition[art.composition])}
      >
        <m.p
          className="numeral font-display text-[2rem] leading-[0.9] tracking-[-0.02em] sm:text-[2.6rem]"
          style={{ color: art.figureTone }}
          initial={motion.reduced ? false : { opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: duration.reveal, ease: ease.editorial }}
        >
          {art.figure}
        </m.p>
        <p
          className="mt-1 max-w-[12rem] text-[0.6875rem] uppercase leading-4 tracking-[0.12em]"
          style={{ color: art.figureTone, opacity: 0.68 }}
        >
          {art.figureNote}
        </p>
      </div>
    </div>
  );
}
