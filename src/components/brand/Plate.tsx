import { cn } from '@/lib/utils';
import { formatRuntime } from '@/lib/datetime';
import { certificates } from '@/data/pricing';
import { languageLabels } from '@/data';
import type { Movie } from '@/data/types';

/**
 * The plate.
 *
 * No poster artwork was supplied with this project, and unrelated stock or
 * generated imagery is off the table. So every film is presented through a
 * plate composed from its own title and metadata: type, rule, colour, and the
 * sprocket motif that runs through the whole design system.
 *
 * Six plates exist — three colour pairs across two structures — assigned per
 * film in the seed data. They vary compositionally, not just chromatically,
 * so a catalogue grid never reads as one template repeated.
 */

type Pair = { ground: string; ink: string; accent: string; rule: string };

const pairs: Pair[] = [
  // A — ink ground
  { ground: 'bg-ink', ink: 'text-paper', accent: 'text-marigold-lit', rule: 'bg-marigold' },
  // B — projector ground
  {
    ground: 'bg-projector-deep',
    ink: 'text-projector-wash',
    accent: 'text-projector-lit',
    rule: 'bg-projector-lit',
  },
  // C — paper ground
  { ground: 'bg-paper-sunken', ink: 'text-ink', accent: 'text-projector', rule: 'bg-projector' },
];

function Sprockets({ side, tone }: { side: 'left' | 'right' | 'both'; tone: string }) {
  const strip = (
    <span
      aria-hidden="true"
      className={cn('flex h-full w-[9px] shrink-0 flex-col items-center justify-around py-3 opacity-45')}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={cn('block h-[5px] w-[5px] rounded-[1px]', tone)} />
      ))}
    </span>
  );
  return (
    <>
      {side !== 'right' ? <span className="absolute inset-y-0 left-0 flex">{strip}</span> : null}
      {side !== 'left' ? <span className="absolute inset-y-0 right-0 flex">{strip}</span> : null}
    </>
  );
}

interface PlateProps {
  movie: Movie;
  /** `card` for catalogue grids, `hero` for a feature slot, `tile` for compact rows. */
  variant?: 'card' | 'hero' | 'tile';
  className?: string;
}

export function Plate({ movie, variant = 'card', className }: PlateProps) {
  const pair = pairs[movie.plate % pairs.length]!;
  const structure = movie.plate < pairs.length ? 'offset' : 'centred';
  const certificate = certificates[movie.certificate];

  const isTile = variant === 'tile';
  const isHero = variant === 'hero';

  return (
    <div
      className={cn(
        'relative isolate flex overflow-hidden',
        pair.ground,
        pair.ink,
        isTile ? 'aspect-[3/2]' : isHero ? 'aspect-[4/5] sm:aspect-[16/10]' : 'aspect-[2/3]',
        className,
      )}
      // The plate is a composition of the film's own metadata, all of which is
      // also present as real text nearby, so it is decorative to assistive tech.
      role="presentation"
    >
      <Sprockets side={structure === 'offset' ? 'left' : 'both'} tone={pair.rule} />

      {/* The runtime, set enormous and quiet — the plate's only ornament. */}
      <span
        aria-hidden="true"
        className={cn(
          'numeral pointer-events-none absolute select-none font-display leading-[0.72] opacity-[0.13]',
          structure === 'offset'
            ? 'right-[-0.08em] top-[-0.06em] text-[9rem] sm:text-[12rem]'
            : 'bottom-[-0.12em] left-1/2 -translate-x-1/2 text-[10rem] sm:text-[13rem]',
        )}
      >
        {movie.runtimeMinutes}
      </span>

      <div
        className={cn(
          'relative z-10 flex flex-1 flex-col px-[18px] py-4',
          structure === 'centred' ? 'items-center text-center' : 'items-start',
          isTile ? 'justify-center' : 'justify-end',
        )}
      >
        {structure === 'centred' ? (
          <span aria-hidden="true" className={cn('mb-4 h-[2px] w-10', pair.rule)} />
        ) : null}

        <p
          className={cn(
            'eyebrow mb-2',
            pair.accent,
            structure === 'centred' ? 'text-center' : '',
          )}
        >
          {certificate.label.split('—')[0]?.trim()} · {formatRuntime(movie.runtimeMinutes)}
        </p>

        <h3
          className={cn(
            'font-display font-medium leading-[0.94] tracking-[-0.02em]',
            isTile ? 'text-lg' : isHero ? 'text-3xl sm:text-5xl' : 'text-[1.6rem] sm:text-[1.75rem]',
          )}
          // Wonk off for titles — they need to sit straight.
          style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 0" }}
        >
          {movie.title}
        </h3>

        {movie.titleBn && !isTile ? (
          <p lang="bn" className={cn('mt-1.5 text-sm opacity-70', pair.ink)}>
            {movie.titleBn}
          </p>
        ) : null}

        {!isTile ? (
          <>
            <span aria-hidden="true" className={cn('my-3 h-[2px] w-full max-w-[3.5rem]', pair.rule)} />
            <p className={cn('text-[0.6875rem] uppercase tracking-[0.12em] opacity-60')}>
              {languageLabels[movie.language]}
              {movie.genres[0] ? ` · ${movie.genres[0].replace('-', ' ')}` : ''}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The same construction at offer scale — a wide plate for a promotion, since
 * no offer artwork was supplied either.
 */
export function OfferPlate({
  title,
  kicker,
  plate,
  className,
}: {
  title: string;
  kicker: string;
  plate: number;
  className?: string;
}) {
  const pair = pairs[plate % pairs.length]!;
  return (
    <div
      role="presentation"
      className={cn(
        'relative flex aspect-[16/9] items-end overflow-hidden px-5 py-5 sm:aspect-[2/1]',
        pair.ground,
        pair.ink,
        className,
      )}
    >
      <Sprockets side="both" tone={pair.rule} />
      <div className="relative z-10 px-2">
        <p className={cn('eyebrow mb-2', pair.accent)}>{kicker}</p>
        <p
          className="font-display text-2xl leading-[1.02] sm:text-[2rem]"
          style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 0" }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
