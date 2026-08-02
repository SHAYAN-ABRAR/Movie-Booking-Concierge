import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dateWindow, dayLabelParts, longDayLabel } from '@/lib/datetime';
import { useRailScroll } from '@/hooks';
import { cn } from '@/lib/utils';

/**
 * The date selector.
 *
 * Built as a real radiogroup: arrow keys move between days, Home and End jump
 * to the ends, and the selected day is the only tab stop. Labels come from the
 * viewer's own clock, so "Today" is always actually today.
 */
export function DateStrip({
  value,
  onChange,
  days = 10,
  className,
}: {
  value: string;
  onChange: (date: string) => void;
  days?: number;
  className?: string;
}) {
  const dates = dateWindow(days);
  const { ref, canLeft, canRight, scrollBy } = useRailScroll<HTMLDivElement>();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  // Keep the chosen day in view when it changes from outside (e.g. from Max).
  useEffect(() => {
    const node = buttonRefs.current.get(value);
    node?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [value]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = dates.indexOf(value);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = Math.min(dates.length - 1, index + 1);
    else if (event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = dates.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    const next = dates[nextIndex];
    if (!next) return;
    onChange(next);
    buttonRefs.current.get(next)?.focus();
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          className="hidden shrink-0 sm:inline-flex"
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          aria-label="Scroll dates backwards"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>

        <div
          ref={ref}
          role="radiogroup"
          aria-label="Choose a date"
          onKeyDown={onKeyDown}
          className="rail flex flex-1 gap-1.5 pb-1"
        >
          {dates.map((date) => {
            const parts = dayLabelParts(date);
            const selected = date === value;
            return (
              <button
                key={date}
                ref={(node) => {
                  if (node) buttonRefs.current.set(date, node);
                  else buttonRefs.current.delete(date);
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(date)}
                className={cn(
                  'flex min-w-[4.25rem] shrink-0 scroll-ml-2 snap-start flex-col items-center gap-0.5 border px-3 py-2.5',
                  'transition-colors duration-[--dur-fast]',
                  selected
                    ? 'border-content bg-content text-surface'
                    : 'border-hairline-strong bg-surface-raised text-content hover:border-content/50',
                )}
              >
                <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em]">
                  {parts.top}
                </span>
                <span className="numeral text-[0.8125rem] font-semibold">{parts.bottom}</span>
                <span className="sr-only">{longDayLabel(date)}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          className="hidden shrink-0 sm:inline-flex"
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          aria-label="Scroll dates forwards"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
