import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Accessibility, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seatMapFor, screenFor } from '@/data/schedule';
import { isWeekend, seatPrice } from '@/data/pricing';
import { money } from '@/lib/format';
import type { Seat, SeatClass, SeatRow, Showtime } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * The seat selector.
 *
 * Interaction model: a multi-select listbox. Each row is a group, each seat an
 * option. One roving tab stop moves through the map with the arrow keys, Home
 * and End jump to the ends of a row, PageUp and PageDown to the front and back
 * of the house. Selection is announced through a live region rather than by
 * moving focus.
 *
 * Nothing here depends on colour: every state carries a distinct shape or
 * pattern as well, and every seat's full description is in its accessible name.
 */

const seatClassLabels: Record<SeatClass, string> = {
  regular: 'Regular',
  premium: 'Premium',
  recliner: 'Recliner',
  wheelchair: 'Wheelchair space',
  companion: 'Companion seat',
};

const statusLabels: Record<Seat['status'], string> = {
  available: 'available',
  sold: 'sold',
  held: 'being booked by someone else',
  unavailable: 'not a seat',
};

function seatTone(seat: Seat, selected: boolean, proposed: boolean): string {
  if (selected) return 'border-marigold bg-marigold text-paper';
  if (proposed) return 'border-marigold border-dashed bg-marigold/25 text-house-ink';
  if (seat.status === 'sold') return 'border-transparent bg-house-ink/15 text-house-ink/30';
  if (seat.status === 'held') return 'border-house-ink/25 bg-transparent text-house-ink/35';
  if (seat.seatClass === 'wheelchair' || seat.seatClass === 'companion') {
    return 'border-projector-lit/70 bg-projector-lit/10 text-projector-lit hover:bg-projector-lit/25';
  }
  if (seat.seatClass === 'recliner') {
    return 'border-marigold-lit/60 bg-marigold-lit/10 text-marigold-lit hover:bg-marigold-lit/25';
  }
  if (seat.seatClass === 'premium') {
    return 'border-house-ink/50 bg-house-ink/10 text-house-ink hover:bg-house-ink/25';
  }
  return 'border-house-ink/30 bg-transparent text-house-ink/80 hover:bg-house-ink/15';
}

interface SeatMapProps {
  showtime: Showtime;
  selected: string[];
  proposed?: string[];
  limit: number;
  onToggle: (seatId: string) => void;
  onReset: () => void;
  onAnnounce?: (message: string) => void;
}

export function SeatMap({
  showtime,
  selected,
  proposed = [],
  limit,
  onToggle,
  onReset,
  onAnnounce,
}: SeatMapProps) {
  const rows = useMemo(() => seatMapFor(showtime), [showtime]);
  const screen = screenFor(showtime);
  const weekend = isWeekend(showtime.date);
  const [zoom, setZoom] = useState(1);
  const [focused, setFocused] = useState<string | null>(null);
  const seatRefs = useRef(new Map<string, HTMLButtonElement>());

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const proposedSet = useMemo(() => new Set(proposed), [proposed]);

  const priceFor = useCallback(
    (seatClass: SeatClass) =>
      seatPrice({ seatClass, format: showtime.format, matinee: showtime.matinee, weekend }),
    [showtime.format, showtime.matinee, weekend],
  );

  // The first selectable seat is the map's initial tab stop.
  const firstSelectable = useMemo(() => {
    for (const row of rows) {
      for (const seat of row.seats) {
        if (seat.status === 'available') return seat.id;
      }
    }
    return null;
  }, [rows]);

  const tabStop = focused ?? selected[0] ?? firstSelectable;

  // If a proposal arrives from Max, bring the first proposed seat into view.
  useEffect(() => {
    if (proposed.length === 0) return;
    const node = seatRefs.current.get(proposed[0]!);
    node?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [proposed]);

  function move(rowIndex: number, seatIndex: number) {
    const row = rows[rowIndex];
    if (!row) return;
    const seat = row.seats[seatIndex];
    if (!seat) return;
    setFocused(seat.id);
    const node = seatRefs.current.get(seat.id);
    node?.focus();
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function onKeyDown(event: React.KeyboardEvent, rowIndex: number, seatIndex: number) {
    const row = rows[rowIndex];
    if (!row) return;
    let handled = true;

    switch (event.key) {
      case 'ArrowRight':
        move(rowIndex, Math.min(row.seats.length - 1, seatIndex + 1));
        break;
      case 'ArrowLeft':
        move(rowIndex, Math.max(0, seatIndex - 1));
        break;
      case 'ArrowDown':
        move(Math.min(rows.length - 1, rowIndex + 1), seatIndex);
        break;
      case 'ArrowUp':
        move(Math.max(0, rowIndex - 1), seatIndex);
        break;
      case 'Home':
        move(rowIndex, 0);
        break;
      case 'End':
        move(rowIndex, row.seats.length - 1);
        break;
      case 'PageUp':
        move(0, seatIndex);
        break;
      case 'PageDown':
        move(rows.length - 1, seatIndex);
        break;
      default:
        handled = false;
    }

    if (handled) event.preventDefault();
  }

  function toggle(seat: Seat) {
    if (seat.status !== 'available') return;
    const isSelected = selectedSet.has(seat.id);
    if (!isSelected && selected.length >= limit) {
      onAnnounce?.(
        `You have already chosen ${limit} ${limit === 1 ? 'seat' : 'seats'}. Remove one before choosing another, or change the number of tickets.`,
      );
      return;
    }
    onToggle(seat.id);
    onAnnounce?.(
      isSelected
        ? `Seat ${seat.row}${seat.number} released. ${selected.length - 1} of ${limit} chosen.`
        : `Seat ${seat.row}${seat.number}, ${seatClassLabels[seat.seatClass]}, ${money(priceFor(seat.seatClass))}. ${selected.length + 1} of ${limit} chosen.`,
    );
  }

  const total = selected.reduce((sum, id) => {
    for (const row of rows) {
      const seat = row.seats.find((s) => s.id === id);
      if (seat) return sum + priceFor(seat.seatClass);
    }
    return sum;
  }, 0);

  return (
    <div className="auditorium auditorium-enter relative overflow-hidden border border-house-rule">
      {/* Light thrown from the screen, falling off toward the back of the
          house. Purely atmospheric; it sits behind everything and is inert. */}
      <div
        aria-hidden="true"
        className="screen-enter pointer-events-none absolute inset-x-0 top-0 h-2/3"
        style={{
          background:
            'radial-gradient(120% 70% at 50% 0%, rgb(147 178 243 / 0.16) 0%, rgb(147 178 243 / 0.05) 42%, transparent 72%)',
        }}
      />

      {/* ── Screen ──────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-6 sm:px-6">
        <svg
          viewBox="0 0 600 42"
          className="mx-auto block h-8 w-full max-w-2xl"
          role="img"
          aria-label="The screen is at this end of the house"
        >
          <defs>
            <linearGradient id="screen-glow" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--projector-lit)" stopOpacity="0.15" />
              <stop offset="50%" stopColor="var(--projector-lit)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--projector-lit)" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path
            d="M12 34 Q300 2 588 34"
            fill="none"
            stroke="url(#screen-glow)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <p className="eyebrow mt-1 text-center text-house-muted">Screen</p>
      </div>

      {/* ── Zoom (small screens) ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 pt-5 sm:px-6">
        <p className="text-[0.8125rem] text-house-muted">
          {screen?.name}
          <span aria-hidden="true"> · </span>
          <span className="numeral">{selected.length}</span> of{' '}
          <span className="numeral">{limit}</span> chosen
        </p>
        <div className="flex items-center gap-1 lg:hidden">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Zoom out"
            disabled={zoom <= 0.7}
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            className="border-house-rule text-house-ink"
          >
            <Minus aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Zoom in"
            disabled={zoom >= 1.6}
            onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.15).toFixed(2))))}
            className="border-house-rule text-house-ink"
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ── The map ─────────────────────────────────────────────────── */}
      <div className="relative overflow-x-auto overscroll-x-contain px-4 py-5 sm:px-6">
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={`Seat map for ${screen?.name ?? 'this screen'}. Use the arrow keys to move between seats and Enter or Space to choose one. ${limit} ${limit === 1 ? 'seat' : 'seats'} to choose.`}
          className="mx-auto w-fit origin-top space-y-1.5"
          style={{ zoom }}
        >
          {rows.map((row: SeatRow, rowIndex) => (
            <div
              key={row.row}
              role="group"
              aria-label={`Row ${row.row}`}
              className="row-enter flex items-center gap-1.5"
              style={{ '--row': rowIndex } as React.CSSProperties}
            >
              <span
                aria-hidden="true"
                className="numeral w-5 shrink-0 text-center text-[0.6875rem] font-semibold text-house-faint"
              >
                {row.row}
              </span>

              <div className="flex items-center">
                {row.seats.map((seat, seatIndex) => {
                  const isSelected = selectedSet.has(seat.id);
                  const isProposed = proposedSet.has(seat.id) && !isSelected;
                  const disabled = seat.status !== 'available';
                  const price = priceFor(seat.seatClass);

                  return (
                    <span key={seat.id} className="flex items-center">
                      <button
                        ref={(node) => {
                          if (node) seatRefs.current.set(seat.id, node);
                          else seatRefs.current.delete(seat.id);
                        }}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={disabled}
                        tabIndex={seat.id === tabStop ? 0 : -1}
                        onFocus={() => setFocused(seat.id)}
                        onClick={() => toggle(seat)}
                        onKeyDown={(event) => onKeyDown(event, rowIndex, seatIndex)}
                        aria-label={[
                          `Row ${seat.row}, seat ${seat.number}`,
                          seatClassLabels[seat.seatClass],
                          disabled ? statusLabels[seat.status] : money(price),
                          seat.aisleRight || seat.aisleLeft ? 'beside an aisle' : null,
                          row.band === 'front'
                            ? 'front of the house'
                            : row.band === 'back'
                              ? 'back of the house'
                              : 'middle of the house',
                          isProposed ? 'suggested by Max' : null,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        className={cn(
                          'seat relative grid place-items-center border',
                          'text-[0.5rem] font-bold leading-none',
                          seat.seatClass === 'recliner' ? 'h-7 w-7' : 'h-6 w-6',
                          seat.seatClass === 'premium' ? 'rounded-t-[4px] rounded-b-xs' : 'rounded-xs',
                          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                          seatTone(seat, isSelected, isProposed),
                        )}
                      >
                        {seat.seatClass === 'wheelchair' ? (
                          <Accessibility aria-hidden="true" className="size-3.5" />
                        ) : seat.seatClass === 'companion' ? (
                          <span aria-hidden="true">+</span>
                        ) : seat.status === 'sold' ? (
                          // A cross, so "sold" survives without colour.
                          <span
                            aria-hidden="true"
                            className="absolute inset-1.5 before:absolute before:inset-0 before:rotate-45 before:border-t before:border-current after:absolute after:inset-0 after:-rotate-45 after:border-t after:border-current"
                          />
                        ) : seat.status === 'held' ? (
                          <span aria-hidden="true" className="block size-1.5 rounded-stub bg-current" />
                        ) : isSelected ? (
                          <span aria-hidden="true" className="numeral">
                            {seat.number}
                          </span>
                        ) : null}
                      </button>
                      {seat.aisleRight ? <span aria-hidden="true" className="w-5 shrink-0" /> : null}
                    </span>
                  );
                })}
              </div>

              <span
                aria-hidden="true"
                className="numeral w-5 shrink-0 text-center text-[0.6875rem] font-semibold text-house-faint"
              >
                {row.row}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div className="border-t border-house-rule px-4 py-4 sm:px-6">
        <h3 className="eyebrow mb-3 text-house-muted">Legend</h3>
        <ul className="flex flex-wrap gap-x-5 gap-y-2.5 text-[0.75rem] text-house-muted">
          {(
            [
              { key: 'regular', label: `Regular · ${money(priceFor('regular'))}` },
              { key: 'premium', label: `Premium · ${money(priceFor('premium'))}` },
              ...(screen?.layout.reclinerRows.length
                ? [{ key: 'recliner', label: `Recliner · ${money(priceFor('recliner'))}` }]
                : []),
              { key: 'wheelchair', label: `Wheelchair space · ${money(priceFor('wheelchair'))}` },
              { key: 'companion', label: `Companion · ${money(priceFor('companion'))}` },
              { key: 'selected', label: 'Chosen' },
              { key: 'held', label: 'Being booked' },
              { key: 'sold', label: 'Sold' },
            ] as const
          ).map((entry) => (
            <li key={entry.key} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-xs border text-[0.5rem] font-bold',
                  entry.key === 'selected'
                    ? 'border-marigold bg-marigold text-paper'
                    : entry.key === 'sold'
                      ? 'border-transparent bg-house-ink/15 text-house-ink/30'
                      : entry.key === 'held'
                        ? 'border-house-ink/25 text-house-ink/35'
                        : entry.key === 'wheelchair' || entry.key === 'companion'
                          ? 'border-projector-lit/70 bg-projector-lit/10 text-projector-lit'
                          : entry.key === 'recliner'
                            ? 'border-marigold-lit/60 bg-marigold-lit/10'
                            : entry.key === 'premium'
                              ? 'rounded-t-[4px] border-house-ink/50 bg-house-ink/10'
                              : 'border-house-ink/30',
                )}
              >
                {entry.key === 'wheelchair' ? (
                  <Accessibility className="size-3" />
                ) : entry.key === 'companion' ? (
                  '+'
                ) : entry.key === 'sold' ? (
                  <span className="relative block size-2.5 before:absolute before:inset-0 before:rotate-45 before:border-t before:border-current after:absolute after:inset-0 after:-rotate-45 after:border-t after:border-current" />
                ) : entry.key === 'held' ? (
                  <span className="block size-1.5 rounded-stub bg-current" />
                ) : null}
              </span>
              {entry.label}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.75rem] leading-5 text-house-faint">
          Prices are per seat before your ticket category is applied, and exclude the ৳20 per-ticket
          booking fee. Wheelchair spaces and companion seats are always charged at the regular rate.
        </p>
      </div>

      {/* ── Running total ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-house-rule px-4 py-4 sm:px-6">
        <div>
          <p className="numeral text-lg font-semibold text-house-ink">
            {selected.length > 0 ? money(total) : '—'}
          </p>
          <p className="text-[0.75rem] text-house-faint">
            {selected.length > 0
              ? `${selected.length} of ${limit} seats · before category discounts and fee`
              : `Choose ${limit} ${limit === 1 ? 'seat' : 'seats'}`}
          </p>
        </div>
        {selected.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onReset();
              onAnnounce?.('All seats released.');
            }}
            className="border-house-rule text-house-ink hover:bg-house-ink/10"
          >
            <RotateCcw aria-hidden="true" />
            Clear seats
          </Button>
        ) : null}
      </div>
    </div>
  );
}
