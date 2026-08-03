import { cn } from '@/lib/utils';

/**
 * Empty-state compositions.
 *
 * One dashed box repeated across seven contexts told the customer nothing about
 * *which* thing was empty. These are drawn per context instead: a schedule with
 * no screenings on it, a programme index cut short, a till roll with no lines,
 * a ticket book nobody has torn a ticket from, a notification strip lying flat.
 *
 * All authored geometry — no icon set, nothing fetched. Every drawing is
 * `aria-hidden`; the heading and body text beside it carry the meaning, and the
 * action button is what a keyboard or screen reader actually operates.
 */

export type EmptyVariant = 'schedule' | 'index' | 'receipt' | 'ticket-book' | 'alerts';

const W = 180;
const H = 112;
const INK = 'currentColor';

/* ── No screenings: an empty projection schedule ─────────────────────── */

function Schedule() {
  const rows = [0, 1, 2, 3];
  return (
    <>
      {/* The time column — the hours are still there, the screenings are not. */}
      {rows.map((i) => (
        <line
          key={`t-${i}`}
          x1={10}
          y1={26 + i * 22}
          x2={30}
          y2={26 + i * 22}
          stroke={INK}
          strokeWidth={2}
          opacity={0.68}
        />
      ))}
      <line x1={38} y1={10} x2={38} y2={H - 10} stroke={INK} strokeWidth={1.2} opacity={0.47} />

      {/* Slots, ruled but unfilled. */}
      {rows.map((i) =>
        [0, 1, 2].map((j) => (
          <rect
            key={`s-${i}-${j}`}
            x={48 + j * 44}
            y={18 + i * 22}
            width={36}
            height={15}
            fill="none"
            stroke={INK}
            strokeWidth={1.1}
            strokeDasharray="3 4"
            opacity={0.38}
          />
        )),
      )}
    </>
  );
}

/* ── No results: a programme index, cut short ────────────────────────── */

function Index() {
  const lines = [0, 1, 2, 3, 4, 5];
  // The page is clipped on the diagonal — entries run off the cut.
  const clip = 'polygon(0 0, 100% 0, 100% 42%, 58% 100%, 0 100%)';
  return (
    <>
      <g style={{ clipPath: clip }}>
        <rect x={8} y={8} width={W - 16} height={H - 16} fill={INK} opacity={0.05} />
        <line x1={16} y1={22} x2={70} y2={22} stroke={INK} strokeWidth={2.4} opacity={0.74} />
        {lines.map((i) => (
          <line
            key={i}
            x1={16}
            y1={38 + i * 12}
            x2={i % 3 === 0 ? 150 : i % 3 === 1 ? 128 : 164}
            y2={38 + i * 12}
            stroke={INK}
            strokeWidth={1.4}
            opacity={0.41}
          />
        ))}
      </g>
      {/* The cut itself. */}
      <line
        x1={W - 8}
        y1={8 + (H - 16) * 0.42}
        x2={8 + (W - 16) * 0.58}
        y2={H - 8}
        stroke={INK}
        strokeWidth={1.6}
        strokeDasharray="5 4"
        opacity={0.68}
      />
    </>
  );
}

/* ── Empty cart: a till roll with nothing printed on it ──────────────── */

function Receipt() {
  const x = 46;
  const w = 88;
  // A torn bottom edge, drawn as a run of zigzags.
  const teeth = Array.from({ length: 11 }, (_, i) => {
    const step = w / 11;
    return `${x + i * step + step / 2} ${i % 2 ? H - 12 : H - 6}`;
  }).join(' L ');

  return (
    <>
      <path
        d={`M ${x} 8 L ${x + w} 8 L ${x + w} ${H - 9} L ${teeth} L ${x} ${H - 9} Z`}
        fill={INK}
        opacity={0.07}
      />
      <path
        d={`M ${x} 8 L ${x + w} 8 L ${x + w} ${H - 9} L ${teeth} L ${x} ${H - 9} Z`}
        fill="none"
        stroke={INK}
        strokeWidth={1.3}
        opacity={0.61}
        strokeLinejoin="round"
      />
      {/* Header rule, then the space where lines would print, then the total. */}
      <line x1={x + 12} y1={24} x2={x + w - 12} y2={24} stroke={INK} strokeWidth={2} opacity={0.68} />
      <line
        x1={x + 12}
        y1={70}
        x2={x + w - 12}
        y2={70}
        stroke={INK}
        strokeWidth={1.2}
        opacity={0.47}
      />
      <line x1={x + 12} y1={80} x2={x + 34} y2={80} stroke={INK} strokeWidth={2.2} opacity={0.61} />
    </>
  );
}

/* ── No bookings: a ticket book with every ticket still in it ────────── */

function TicketBook() {
  const rows = [0, 1, 2];
  return (
    <>
      {rows.map((i) => {
        const y = 16 + i * 30;
        return (
          <g key={i}>
            <rect
              x={20}
              y={y}
              width={W - 40}
              height={24}
              fill={INK}
              opacity={0.05}
              stroke={INK}
              strokeWidth={1.2}
              strokeOpacity={0.54}
            />
            {/* The stub perforation — none of them has been torn. */}
            <line
              x1={62}
              y1={y + 3}
              x2={62}
              y2={y + 21}
              stroke={INK}
              strokeWidth={1.2}
              strokeDasharray="2.5 3.5"
              opacity={0.68}
            />
            <line x1={74} y1={y + 9} x2={132} y2={y + 9} stroke={INK} strokeWidth={1.5} opacity={0.38} />
            <line x1={74} y1={y + 16} x2={112} y2={y + 16} stroke={INK} strokeWidth={1.3} opacity={0.27} />
          </g>
        );
      })}
      {/* The spine, still stitched. */}
      <line x1={20} y1={10} x2={20} y2={H - 8} stroke={INK} strokeWidth={2} opacity={0.68} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={14}
          y1={18 + i * 20}
          x2={26}
          y2={18 + i * 20}
          stroke={INK}
          strokeWidth={1.4}
          opacity={0.47}
        />
      ))}
    </>
  );
}

/* ── No alerts: the strip, lying flat ────────────────────────────────── */

function Alerts() {
  return (
    <>
      <rect
        x={12}
        y={30}
        width={W - 24}
        height={52}
        fill={INK}
        opacity={0.05}
        stroke={INK}
        strokeWidth={1.2}
        strokeOpacity={0.47}
      />
      {/* A trace with nothing on it. */}
      <line x1={22} y1={56} x2={W - 22} y2={56} stroke={INK} strokeWidth={1.6} opacity={0.68} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1={30 + i * 24}
          y1={52}
          x2={30 + i * 24}
          y2={60}
          stroke={INK}
          strokeWidth={1.1}
          opacity={0.34}
        />
      ))}
    </>
  );
}

const drawings: Record<EmptyVariant, () => React.JSX.Element> = {
  schedule: Schedule,
  index: Index,
  receipt: Receipt,
  'ticket-book': TicketBook,
  alerts: Alerts,
};

export function EmptyDrawing({
  variant,
  className,
}: {
  variant: EmptyVariant;
  className?: string;
}) {
  const Drawing = drawings[variant];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      // `content-muted`, not `content-faint`: at faint the geometry stopped
      // reading as a drawing and started reading as a rendering fault.
      className={cn('block w-full text-content-muted', className)}
      aria-hidden="true"
      focusable="false"
    >
      <Drawing />
    </svg>
  );
}
