import { formatLabels } from '@/data';
import type { Screen } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * A schematic of a venue's houses.
 *
 * No venue photography was supplied with this project, so instead of stock
 * imagery each cinema is represented by a true diagram of itself: one bar per
 * screen, sized by seat count, labelled with its format. It carries real
 * information, which a generic lobby photograph would not.
 */
export function HouseDiagram({
  screens,
  className,
  compact = false,
}: {
  screens: Screen[];
  className?: string;
  compact?: boolean;
}) {
  const largest = Math.max(...screens.map((s) => s.capacity));
  const total = screens.reduce((sum, s) => sum + s.capacity, 0);

  return (
    <div className={cn('w-full', className)}>
      <ul className="space-y-1.5">
        {screens.map((screen) => (
          <li key={screen.id} className="flex items-center gap-3">
            <span
              className={cn(
                'shrink-0 truncate text-[0.6875rem] uppercase tracking-[0.08em] text-content-faint',
                compact ? 'w-16' : 'w-24',
              )}
            >
              {screen.name}
            </span>
            <span
              aria-hidden="true"
              className="relative h-3 flex-1 bg-content/[0.06]"
              title={`${screen.capacity} seats`}
            >
              <span
                className={cn(
                  'block h-full',
                  screen.format === 'velvet'
                    ? 'bg-marigold'
                    : screen.format === 'grandscreen'
                      ? 'bg-projector'
                      : screen.format === 'three-d'
                        ? 'bg-projector/60'
                        : 'bg-content/45',
                )}
                style={{ width: `${Math.round((screen.capacity / largest) * 100)}%` }}
              />
            </span>
            <span className="numeral w-10 shrink-0 text-right text-[0.6875rem] text-content-muted">
              {screen.capacity}
            </span>
            {!compact ? (
              <span className="w-24 shrink-0 text-[0.6875rem] uppercase tracking-[0.08em] text-content-faint">
                {formatLabels[screen.format]}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 border-t border-hairline pt-2 text-[0.6875rem] uppercase tracking-[0.1em] text-content-faint">
        {screens.length} screens · {total} seats
      </p>
    </div>
  );
}
