import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Accessibility, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seatMapFor, screenFor } from '@/data/schedule';
import { isWeekend, seatPrice } from '@/data/pricing';
import { money } from '@/lib/format';
import type { Seat, SeatClass, SeatRow, Showtime } from '@/data/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { BOOKING_FEE_PER_TICKET } from '@/data/pricing';

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

/**
 * Seat vocabulary, as translation keys rather than English.
 *
 * These strings go into every seat's accessible name, so leaving them as
 * literals made the whole auditorium English-only for a Bangla customer — the
 * one surface in the product where a misread is expensive.
 */
const seatClassKeys = {
  regular: 'seatMap.seatClass.regular',
  premium: 'seatMap.seatClass.premium',
  recliner: 'seatMap.seatClass.recliner',
  wheelchair: 'seatMap.seatClass.wheelchair',
  companion: 'seatMap.seatClass.companion',
} as const satisfies Record<SeatClass, string>;

const statusKeys = {
  available: 'seatMap.status.available',
  sold: 'seatMap.status.sold',
  held: 'seatMap.status.held',
  unavailable: 'seatMap.status.notASeat',
} as const satisfies Record<Seat['status'], string>;

/**
 * Seat silhouette.
 *
 * Class is carried by *shape* as well as tone, so the map still reads in
 * greyscale and at a glance: a rounder back and a deeper cushion mean a better
 * seat. Every silhouette is 24px on the outside (28px for a recliner) — the
 * bottom border thickens inside the box, so nothing shifts when state changes.
 */
function seatShape(seatClass: SeatClass): string {
  switch (seatClass) {
    case 'recliner':
      return 'h-7 w-7 rounded-t-[9px] rounded-b-[2px] border-b-[4px]';
    case 'premium':
      return 'h-6 w-6 rounded-t-[8px] rounded-b-[1px] border-b-[3px]';
    // Access seats are square and icon-bearing — the icon is the identifier.
    case 'wheelchair':
    case 'companion':
      return 'h-6 w-6 rounded-[3px]';
    default:
      return 'h-6 w-6 rounded-t-[3px] rounded-b-[1px]';
  }
}

function seatTone(seat: Seat, selected: boolean, proposed: boolean): string {
  if (selected) return 'border-accent bg-signal text-paper';
  if (proposed) return 'border-accent border-dashed bg-accent/25 text-house-ink';
  // Sold seats recede. They were previously filled at house-ink/15, which on a
  // dark ground is *lighter* than an available seat — the unbookable seats were
  // the most prominent thing in the house.
  if (seat.status === 'sold') return 'border-transparent bg-house-sunken text-house-ink/40';
  if (seat.status === 'held') return 'border-house-ink/25 bg-transparent text-house-ink/45';
  if (seat.seatClass === 'wheelchair' || seat.seatClass === 'companion') {
    return 'border-steel-lit/70 bg-steel-lit/10 text-steel-lit hover:bg-steel-lit/25';
  }
  if (seat.seatClass === 'recliner') {
    return 'border-accent/60 bg-accent/10 text-accent hover:bg-accent/25';
  }
  if (seat.seatClass === 'premium') {
    return 'border-house-ink/55 bg-house-ink/12 text-house-ink hover:bg-house-ink/28';
  }
  // /40 rather than /30: an available seat is an active control, so its outline
  // is held to 1.4.11's 3:1 against the house ground (this measures 3.43:1).
  // Sold and held seats are aria-disabled and therefore exempt.
  return 'border-house-ink/40 bg-transparent text-house-ink/80 hover:bg-house-ink/15';
}

/**
 * The sold cross.
 *
 * Both arms are pinned to the vertical centre before rotating. Anchoring them
 * to the top edge instead — as this did originally — swings two edge-aligned
 * rules into a caret rather than a cross.
 */
function SoldMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block',
        'before:absolute before:inset-x-0 before:top-1/2 before:rotate-45 before:border-t before:border-current',
        'after:absolute after:inset-x-0 after:top-1/2 after:-rotate-45 after:border-t after:border-current',
        className,
      )}
    />
  );
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
  const { t } = useTranslation();
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
        ? t('seatMap.released', {
            seat: `${seat.row}${seat.number}`,
            chosen: selected.length - 1,
            limit,
          })
        : t('seatMap.taken', {
            seat: `${seat.row}${seat.number}`,
            seatClass: t(seatClassKeys[seat.seatClass]),
            price: money(priceFor(seat.seatClass)),
            chosen: selected.length + 1,
            limit,
          }),
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
    <div className="auditorium auditorium-enter relative overflow-hidden border-2 border-house-rule">
      {/* Light thrown from the screen, falling off toward the back of the
          house. Purely atmospheric; it sits behind everything and is inert. */}
      <div
        aria-hidden="true"
        className="screen-enter pointer-events-none absolute inset-x-0 top-0 h-2/3"
        style={{
          background:
            'radial-gradient(120% 70% at 50% 0%, rgb(255 92 54 / 0.10) 0%, rgb(239 235 227 / 0.05) 42%, transparent 72%)',
        }}
      />

      {/* ── Screen ──────────────────────────────────────────────────── */}
      <div className="relative px-4 pt-6 sm:px-6">
        <svg
          viewBox="0 0 600 42"
          className="mx-auto block h-8 w-full max-w-2xl"
          role="img"
          aria-label={t('seatMap.screenEnd')}
        >
          <defs>
            <linearGradient id="screen-glow" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--steel-lit)" stopOpacity="0.15" />
              <stop offset="50%" stopColor="var(--steel-lit)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--steel-lit)" stopOpacity="0.15" />
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
        <p className="eyebrow mt-1 text-center text-house-muted">{t('seatMap.screen')}</p>
      </div>

      {/* ── Zoom (small screens) ────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 pt-5 sm:px-6">
        <p className="text-[0.8125rem] text-house-muted">
          {screen?.name}
          <span aria-hidden="true"> · </span>
          {t('seatMap.chosenOf', { chosen: selected.length, limit })}
        </p>
        <div className="flex items-center gap-1 lg:hidden">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('seatMap.zoomOut')}
            disabled={zoom <= 0.7}
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            className="border-house-rule text-house-ink"
          >
            <Minus aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('seatMap.zoomIn')}
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
          aria-label={t('seatMap.listbox', {
            screen: screen?.name ?? t('seatMap.thisScreen'),
            limit: t('seatMap.seatsToChoose', { count: limit }),
          })}
          className="mx-auto w-fit origin-top space-y-1.5"
          style={{ zoom }}
        >
          {rows.map((row: SeatRow, rowIndex) => (
            <div
              key={row.row}
              role="group"
              aria-label={t('seatMap.rowLabel', { row: row.row })}
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
                          t('seatMap.seatLabel', { row: seat.row, number: seat.number }),
                          t(seatClassKeys[seat.seatClass]),
                          disabled ? t(statusKeys[seat.status]) : money(price),
                          seat.aisleRight || seat.aisleLeft ? t('seatMap.besideAisle') : null,
                          t(`seatMap.band.${row.band}` as const),
                          isProposed ? t('seatMap.suggestedByMax') : null,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        className={cn(
                          'seat relative grid place-items-center border',
                          'text-[0.5rem] font-bold leading-none',
                          seatShape(seat.seatClass),
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
                          <SoldMark className="absolute inset-1.25" />
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
      <div className="border-t-2 border-house-rule px-4 py-4 sm:px-6">
        <h3 className="eyebrow mb-3 text-house-muted">{t('seatMap.legend')}</h3>
        <ul className="flex flex-wrap gap-x-5 gap-y-2.5 text-[0.75rem] text-house-muted">
          {(
            [
              {
                key: 'regular',
                shape: 'regular',
                label: `${t('seatMap.seatClass.regular')} · ${money(priceFor('regular'))}`,
              },
              {
                key: 'premium',
                shape: 'premium',
                label: `${t('seatMap.seatClass.premium')} · ${money(priceFor('premium'))}`,
              },
              ...(screen?.layout.reclinerRows.length
                ? [
                    {
                      key: 'recliner',
                      shape: 'recliner',
                      label: `${t('seatMap.seatClass.recliner')} · ${money(priceFor('recliner'))}`,
                    } as const,
                  ]
                : []),
              {
                key: 'wheelchair',
                shape: 'wheelchair',
                label: `${t('seatMap.seatClass.wheelchair')} · ${money(priceFor('wheelchair'))}`,
              },
              {
                key: 'companion',
                shape: 'companion',
                label: `${t('seatMap.seatClass.companionShort')} · ${money(priceFor('companion'))}`,
              },
              // The three status swatches use the ordinary seat silhouette —
              // status is what varies, not the class.
              { key: 'selected', shape: 'regular', label: t('seatMap.state.chosen') },
              { key: 'held', shape: 'regular', label: t('seatMap.state.held') },
              { key: 'sold', shape: 'regular', label: t('seatMap.state.sold') },
            ] as const
          ).map((entry) => (
            <li key={entry.key} className="flex items-center gap-2">
              {/* The swatch reproduces the seat exactly — same silhouette, same
                  tone — so the legend teaches the map rather than approximating it. */}
              <span
                aria-hidden="true"
                className={cn(
                  'relative grid shrink-0 place-items-center border text-[0.5rem] font-bold',
                  seatShape(entry.shape),
                  entry.key === 'selected'
                    ? 'border-accent bg-signal text-paper'
                    : entry.key === 'sold'
                      ? 'border-transparent bg-house-sunken text-house-ink/40'
                      : entry.key === 'held'
                        ? 'border-house-ink/25 text-house-ink/45'
                        : entry.key === 'wheelchair' || entry.key === 'companion'
                          ? 'border-steel-lit/70 bg-steel-lit/10 text-steel-lit'
                          : entry.key === 'recliner'
                            ? 'border-accent/60 bg-accent/10 text-accent'
                            : entry.key === 'premium'
                              ? 'border-house-ink/55 bg-house-ink/12'
                              : 'border-house-ink/40',
                )}
              >
                {entry.key === 'wheelchair' ? (
                  <Accessibility className="size-3" />
                ) : entry.key === 'companion' ? (
                  '+'
                ) : entry.key === 'sold' ? (
                  <SoldMark className="absolute inset-1.25" />
                ) : entry.key === 'held' ? (
                  <span className="block size-1.5 rounded-stub bg-current" />
                ) : null}
              </span>
              {entry.label}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.75rem] leading-5 text-house-faint">
          {t('seatMap.priceNote', { fee: money(BOOKING_FEE_PER_TICKET) })}
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
              onAnnounce?.(t('seatMap.allReleased'));
            }}
            className="border-house-rule text-house-ink hover:bg-house-ink/10"
          >
            <RotateCcw aria-hidden="true" />
            {t('seatMap.clearSeats')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
