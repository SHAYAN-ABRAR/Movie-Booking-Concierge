import { useMemo, useId } from 'react';
import { m } from 'framer-motion';
import { artworkFor, densityScale, lightOrigin } from '@/data/artwork';
import type { ArtDirection } from '@/data/artwork';
import { rngFor } from '@/lib/deterministic';
import { useMotionPreferences } from '@/motion';
import { formatRuntime } from '@/lib/datetime';
import { certificates } from '@/data/pricing';
import { languageLabels } from '@/data';
import type { Movie } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * Film artwork.
 *
 * Seven composition families, one per editorial reading of the film, drawn as
 * SVG from the film's own art direction in `src/data/artwork.ts`. Nothing here
 * is fetched, generated at runtime, or randomised per render — the same film
 * always draws the same picture.
 *
 * The four variants genuinely re-compose rather than scale:
 *
 * - `card`  2:3, condensed, carries its own title
 * - `hero`  5:3, expanded, no title (the page sets it much larger)
 * - `tile`  3:2, simplified — fewer layers, for Max results and rails
 * - `mark`  1:1, the motif reduced to an identity stamp
 *
 * The whole SVG is `aria-hidden`: every fact it depicts is real text beside it.
 */

export type ArtworkVariant = 'card' | 'hero' | 'tile' | 'mark';

const box: Record<ArtworkVariant, { w: number; h: number }> = {
  card: { w: 200, h: 300 },
  hero: { w: 400, h: 240 },
  tile: { w: 240, h: 160 },
  mark: { w: 64, h: 64 },
};

const aspect: Record<ArtworkVariant, string> = {
  card: 'aspect-[2/3]',
  hero: 'aspect-[4/5] sm:aspect-[5/3]',
  tile: 'aspect-[3/2]',
  mark: 'aspect-square',
};

interface FamilyProps {
  d: ArtDirection;
  w: number;
  h: number;
  seed: string;
  detail: number;
  variant: ArtworkVariant;
  animate: boolean;
}

/* ══════════════════════════════════════════════════════════════════════
   FAMILY 1 — APERTURE
   A projector iris opening off-centre. Concentric rings, brightest at the
   core, with the light source placed by the film's `light` direction.
   ══════════════════════════════════════════════════════════════════════ */

function Aperture({ d, w, h, detail, animate }: FamilyProps) {
  const origin = lightOrigin(d.light);
  const cx = (origin.x / 100) * w;
  const cy = (origin.y / 100) * h;
  const maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
  const rings = Math.round(7 * detail);

  return (
    <>
      {Array.from({ length: rings }, (_, i) => {
        const t = (i + 1) / rings;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={maxR * t}
            fill="none"
            stroke={d.ink}
            strokeWidth={t < 0.4 ? 1.6 : 0.9}
            opacity={0.9 - t * 0.62}
          />
        );
      })}

      {/* The iris blades — a hard-edged polygon aperture over the rings. */}
      <g opacity={0.5}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const inner = maxR * 0.16;
          const outer = maxR * 1.1;
          return (
            <line
              key={i}
              x1={cx + Math.cos(angle) * inner}
              y1={cy + Math.sin(angle) * inner}
              x2={cx + Math.cos(angle) * outer}
              y2={cy + Math.sin(angle) * outer}
              stroke={d.ground}
              strokeWidth={maxR * 0.05}
            />
          );
        })}
      </g>

      {animate ? (
        <m.circle
          cx={cx}
          cy={cy}
          r={maxR * 0.13}
          fill={d.accent}
          initial={{ opacity: 0.55, scale: 0.94 }}
          animate={{ opacity: [0.55, 0.85, 0.55], scale: [0.94, 1.06, 0.94] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        />
      ) : (
        <circle cx={cx} cy={cy} r={maxR * 0.13} fill={d.accent} opacity={0.7} />
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAMILY 2 — STRATA
   Topographic contours. Land, water, a coastline that has moved.
   ══════════════════════════════════════════════════════════════════════ */

function Strata({ d, w, h, seed, detail, animate }: FamilyProps) {
  const lines = useMemo(() => {
    const rng = rngFor(`${seed}|strata`);
    const count = Math.round(13 * detail);
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1 || 1);
      const baseY = h * (0.12 + t * 0.82);
      const amp = h * (0.012 + rng() * 0.05) * (1 - Math.abs(t - 0.55));
      const phase = rng() * Math.PI * 2;
      const freq = 1.2 + rng() * 1.6;
      const steps = 22;
      const points = Array.from({ length: steps + 1 }, (_, s) => {
        const x = (s / steps) * w;
        const y = baseY + Math.sin((s / steps) * Math.PI * freq + phase) * amp;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return { path: `M${points.join(' L')}`, t, width: 0.7 + (1 - Math.abs(t - 0.5) * 2) * 1.5 };
    });
  }, [seed, w, h, detail]);

  const highlight = Math.floor(lines.length * 0.55);

  return (
    <>
      {lines.map((line, i) => (
        <path
          key={i}
          d={line.path}
          fill="none"
          stroke={i === highlight ? d.accent : d.ink}
          strokeWidth={i === highlight ? line.width + 0.8 : line.width}
          opacity={i === highlight ? 0.95 : 0.32 + (1 - Math.abs(line.t - 0.5) * 2) * 0.45}
          strokeLinecap="round"
        />
      ))}

      {animate ? (
        <m.g
          initial={{ x: 0 }}
          animate={{ x: [0, -w * 0.035, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          opacity={0.5}
        >
          <path
            d={lines[Math.floor(lines.length * 0.3)]?.path ?? ''}
            fill="none"
            stroke={d.accent}
            strokeWidth={1.1}
          />
        </m.g>
      ) : null}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAMILY 3 — REGISTRATION
   Off-register printing. The same block struck three times, each pass a
   few units out — the misprint that a press operator would reject and a
   designer would frame.
   ══════════════════════════════════════════════════════════════════════ */

function Registration({ d, w, h, seed, detail, variant }: FamilyProps) {
  const rules = useMemo(() => {
    const count = Math.round(16 * detail);
    return Array.from({ length: count }, (_, i) => h * (0.1 + (i / count) * 0.84));
  }, [h, detail]);

  const rng = rngFor(`${seed}|reg`);
  const offset = 3 + rng() * 4;
  const blockW = w * 0.52;
  const blockH = h * (variant === 'hero' ? 0.42 : 0.3);
  const bx = w * 0.2;
  const by = h * (variant === 'hero' ? 0.28 : 0.36);

  return (
    <>
      {/* Ruled ledger paper underneath. */}
      {rules.map((y, i) => (
        <line key={i} x1={w * 0.06} y1={y} x2={w * 0.94} y2={y} stroke={d.ink} strokeWidth={0.55} opacity={0.42} />
      ))}
      <line x1={w * 0.17} y1={0} x2={w * 0.17} y2={h} stroke={d.accent} strokeWidth={0.8} opacity={0.45} />

      {/* Three passes of the same block, out of register. */}
      <rect
        x={bx - offset}
        y={by - offset * 0.6}
        width={blockW}
        height={blockH}
        fill={d.accent}
        opacity={0.34}
      />
      <rect
        x={bx + offset}
        y={by + offset * 0.6}
        width={blockW}
        height={blockH}
        fill={d.ink}
        opacity={0.4}
      />
      <rect x={bx} y={by} width={blockW} height={blockH} fill="none" stroke={d.ink} strokeWidth={1.2} opacity={0.85} />

      {/* Registration crosshairs, as a print sheet carries. */}
      {[
        [w * 0.1, h * 0.09],
        [w * 0.9, h * 0.09],
      ].map(([x, y], i) => (
        <g key={i} opacity={0.6}>
          <line x1={x! - 5} y1={y!} x2={x! + 5} y2={y!} stroke={d.accent} strokeWidth={0.8} />
          <line x1={x!} y1={y! - 5} x2={x!} y2={y! + 5} stroke={d.accent} strokeWidth={0.8} />
          <circle cx={x!} cy={y!} r={3} fill="none" stroke={d.accent} strokeWidth={0.6} />
        </g>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAMILY 4 — TIMECODE
   Film leader. A countdown numeral behind frame bands and cue marks.
   ══════════════════════════════════════════════════════════════════════ */

function Timecode({ d, w, h, seed, detail, variant, animate }: FamilyProps) {
  const rng = rngFor(`${seed}|tc`);
  const numeral = 3 + Math.floor(rng() * 5);
  const bands = Math.round(10 * detail);
  const cueR = Math.min(w, h) * 0.09;

  return (
    <>
      {/* Frame bands running down the strip. */}
      {Array.from({ length: bands }, (_, i) => {
        const y = (i / bands) * h;
        const bh = h / bands;
        return (
          <rect
            key={i}
            x={0}
            y={y}
            width={w}
            height={bh * 0.5}
            fill={d.ink}
            opacity={i % 2 === 0 ? 0.5 : 0.22}
          />
        );
      })}

      {/* The countdown numeral, struck through by the crosshair. */}
      <text
        x={w * 0.5}
        y={h * 0.58}
        textAnchor="middle"
        fontFamily="'Fraunces Variable', Georgia, serif"
        fontSize={Math.min(w, h) * (variant === 'hero' ? 0.62 : 0.7)}
        fontWeight={600}
        fill={d.accent}
        opacity={0.5}
      >
        {numeral}
      </text>

      <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} stroke={d.accent} strokeWidth={1} opacity={0.65} />
      <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={h} stroke={d.accent} strokeWidth={1} opacity={0.65} />

      {/* Cue mark, top right — the reel-change dot. */}
      <circle cx={w * 0.86} cy={h * 0.12} r={cueR} fill="none" stroke={d.accent} strokeWidth={1.4} opacity={0.9} />

      {/* Perforations down both edges. */}
      {Array.from({ length: Math.round(h / 22) }, (_, i) => (
        <g key={i} fill={d.ink} opacity={0.75}>
          <rect x={w * 0.02} y={12 + i * 22} width={w * 0.035} height={9} rx={1} />
          <rect x={w * 0.945} y={12 + i * 22} width={w * 0.035} height={9} rx={1} />
        </g>
      ))}

      {animate ? (
        <m.rect
          x={0}
          width={w}
          height={h * 0.06}
          fill={d.accent}
          opacity={0.28}
          initial={{ y: -h * 0.06 }}
          animate={{ y: [-h * 0.06, h] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.5 }}
        />
      ) : null}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAMILY 5 — LATTICE
   A building at night. A grid of windows, a few of them lit.
   ══════════════════════════════════════════════════════════════════════ */

function Lattice({ d, w, h, seed, detail, animate }: FamilyProps) {
  const cells = useMemo(() => {
    const rng = rngFor(`${seed}|lattice`);
    const cols = Math.max(4, Math.round(7 * detail));
    const rows = Math.max(5, Math.round(10 * detail));
    const gapX = w * 0.035;
    const gapY = h * 0.022;
    const cw = (w - gapX * (cols + 1)) / cols;
    const ch = (h - gapY * (rows + 1)) / rows;

    return Array.from({ length: cols * rows }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const roll = rng();
      return {
        x: gapX + col * (cw + gapX),
        y: gapY + row * (ch + gapY),
        w: cw,
        h: ch,
        lit: roll > 0.82,
        dim: roll > 0.55,
        delay: rng() * 6,
      };
    });
  }, [seed, w, h, detail]);

  const litCells = cells.filter((c) => c.lit).slice(0, 6);

  return (
    <>
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          fill={cell.lit ? d.accent : d.ink}
          opacity={cell.lit ? 0.62 : cell.dim ? 0.38 : 0.16}
        />
      ))}

      {animate
        ? litCells.map((cell, i) => (
            <m.rect
              key={`lit-${i}`}
              x={cell.x}
              y={cell.y}
              width={cell.w}
              height={cell.h}
              fill={d.accent}
              initial={{ opacity: 0.25 }}
              animate={{ opacity: [0.25, 0.8, 0.25] }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: cell.delay,
              }}
            />
          ))
        : null}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAMILY 6 — ARC
   Sweeping arcs. Sound in geometry, or an orbit seen edge-on.
   ══════════════════════════════════════════════════════════════════════ */

function Arc({ d, w, h, seed, detail, animate }: FamilyProps) {
  const origin = lightOrigin(d.light);
  const cx = (origin.x / 100) * w;
  const cy = (origin.y / 100) * h;

  const arcs = useMemo(() => {
    const rng = rngFor(`${seed}|arc`);
    const count = Math.round(11 * detail);
    const maxR = Math.hypot(w, h) * 0.85;
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 1) / count;
      return {
        r: maxR * t,
        width: 0.6 + rng() * 2.4 * (1 - t * 0.5),
        opacity: 0.7 - t * 0.42,
      };
    });
  }, [seed, w, h, detail]);

  return (
    <>
      {arcs.map((arcDef, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={arcDef.r}
          fill="none"
          stroke={i % 4 === 1 ? d.accent : d.ink}
          strokeWidth={arcDef.width}
          opacity={arcDef.opacity}
        />
      ))}

      {/* A chord cutting the arcs — the horizon, or the resonant line. */}
      <line x1={0} y1={cy} x2={w} y2={cy} stroke={d.accent} strokeWidth={1.2} opacity={0.8} />

      {animate ? (
        <m.circle
          cx={cx}
          cy={cy}
          fill="none"
          stroke={d.accent}
          strokeWidth={1.6}
          initial={{ r: 0, opacity: 0.75 }}
          animate={{ r: Math.hypot(w, h) * 0.8, opacity: 0 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeOut' }}
        />
      ) : null}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAMILY 7 — THREAD
   The house motif at full scale: a kantha running-stitch field, worked
   in rows that shift as a hand would shift.
   ══════════════════════════════════════════════════════════════════════ */

function Thread({ d, w, h, seed, detail }: FamilyProps) {
  const rows = useMemo(() => {
    const rng = rngFor(`${seed}|thread`);
    const count = Math.round(16 * detail);
    return Array.from({ length: count }, (_, i) => ({
      y: h * (0.06 + (i / count) * 0.88),
      dash: 4 + rng() * 5,
      gap: 3 + rng() * 4,
      offset: rng() * 12,
      accent: rng() > 0.82,
      opacity: 0.28 + rng() * 0.45,
    }));
  }, [seed, h, detail]);

  const columns = useMemo(() => {
    const rng = rngFor(`${seed}|thread-col`);
    const count = Math.round(5 * detail);
    return Array.from({ length: count }, (_, i) => ({
      x: w * (0.12 + (i / count) * 0.78),
      dash: 3 + rng() * 4,
      offset: rng() * 10,
      opacity: 0.2 + rng() * 0.3,
    }));
  }, [seed, w, detail]);

  return (
    <>
      {rows.map((row, i) => (
        <line
          key={`r-${i}`}
          x1={w * 0.05}
          y1={row.y}
          x2={w * 0.95}
          y2={row.y}
          stroke={row.accent ? d.accent : d.ink}
          strokeWidth={row.accent ? 1.9 : 1.3}
          strokeDasharray={`${row.dash} ${row.gap}`}
          strokeDashoffset={row.offset}
          strokeLinecap="round"
          opacity={row.accent ? 0.9 : row.opacity}
        />
      ))}
      {columns.map((col, i) => (
        <line
          key={`c-${i}`}
          x1={col.x}
          y1={h * 0.05}
          x2={col.x}
          y2={h * 0.95}
          stroke={d.ink}
          strokeWidth={1}
          strokeDasharray={`${col.dash} ${col.dash + 2}`}
          strokeDashoffset={col.offset}
          strokeLinecap="round"
          opacity={col.opacity}
        />
      ))}
    </>
  );
}

const families = {
  aperture: Aperture,
  strata: Strata,
  registration: Registration,
  timecode: Timecode,
  lattice: Lattice,
  arc: Arc,
  thread: Thread,
} as const;

/* ══════════════════════════════════════════════════════════════════════
   THE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export function CinematicArtwork({
  movie,
  variant = 'card',
  className,
  /** Allows the family's single moving layer to run. Off for dense grids. */
  animated = false,
}: {
  movie: Movie;
  variant?: ArtworkVariant;
  className?: string;
  animated?: boolean;
}) {
  const motion = useMotionPreferences();
  const direction = artworkFor(movie);
  const { w, h } = box[variant];
  const gradientId = useId();
  const detail = densityScale[direction.density] * (variant === 'tile' || variant === 'mark' ? 0.55 : 1);
  const Family = families[direction.family];

  // A family may move one layer, and only when it is asked to and allowed to.
  const animate = animated && !motion.reduced && direction.motion !== 'still' && variant !== 'mark';
  const origin = lightOrigin(direction.light);
  const certificate = certificates[movie.certificate];

  return (
    <div
      className={cn('relative isolate overflow-hidden', aspect[variant], className)}
      style={{ backgroundColor: direction.ground }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id={`light-${gradientId}`} cx={`${origin.x}%`} cy={`${origin.y}%`} r="78%">
            <stop offset="0%" stopColor={direction.accent} stopOpacity="0.26" />
            <stop offset="55%" stopColor={direction.accent} stopOpacity="0.06" />
            <stop offset="100%" stopColor={direction.ground} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`falloff-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={direction.ground} stopOpacity="0" />
            <stop offset="62%" stopColor={direction.ground} stopOpacity="0.34" />
            <stop offset="100%" stopColor={direction.ground} stopOpacity="0.88" />
          </linearGradient>
        </defs>

        <Family
          d={direction}
          w={w}
          h={h}
          seed={movie.id}
          detail={detail}
          variant={variant}
          animate={animate}
        />

        {/* Projected light, then a falloff so type always has a ground to sit on. */}
        <rect width={w} height={h} fill={`url(#light-${gradientId})`} />
        {variant !== 'mark' ? <rect width={w} height={h} fill={`url(#falloff-${gradientId})`} /> : null}
      </svg>

      {/* Sprocket edge — the house motif, tying every family together. */}
      {variant !== 'mark' ? (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 flex w-[9px] flex-col items-center justify-around py-3">
          {Array.from({ length: variant === 'tile' ? 6 : 12 }, (_, i) => (
            <span
              key={i}
              className="block size-[5px] rounded-[1px]"
              style={{ backgroundColor: direction.accent, opacity: 0.42 }}
            />
          ))}
        </span>
      ) : null}

      {/* The card carries its own title; the hero does not — the page sets it. */}
      {variant === 'card' ? (
        <div
          className={cn(
            'absolute inset-0 z-10 flex flex-col px-[18px] py-4',
            direction.titleAlign === 'top-left'
              ? 'justify-start'
              : direction.titleAlign === 'centre'
                ? 'items-center justify-center text-center'
                : 'justify-end',
            direction.titleAlign === 'bottom-right' ? 'items-end text-right' : '',
          )}
        >
          <p
            className="eyebrow mb-1.5"
            style={{ color: direction.accent }}
          >
            {certificate.label.split('—')[0]?.trim()} · {formatRuntime(movie.runtimeMinutes)}
          </p>
          <h3
            className="font-display text-[1.55rem] font-medium leading-[0.94] tracking-[-0.02em] sm:text-[1.7rem]"
            style={{ color: direction.titleTone, fontVariationSettings: "'SOFT' 0, 'WONK' 0" }}
          >
            {movie.title}
          </h3>
          {movie.titleBn ? (
            <p
              lang="bn"
              className="mt-1.5 text-sm opacity-75"
              style={{ color: direction.titleTone }}
            >
              {movie.titleBn}
            </p>
          ) : null}
          <span
            aria-hidden="true"
            className="my-2.5 block h-[2px] w-10"
            style={{ backgroundColor: direction.accent }}
          />
          <p
            className="text-[0.6875rem] uppercase tracking-[0.12em] opacity-70"
            style={{ color: direction.titleTone }}
          >
            {languageLabels[movie.language]}
            {movie.genres[0] ? ` · ${movie.genres[0].replace('-', ' ')}` : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}
