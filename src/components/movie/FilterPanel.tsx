import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/field';
import { FilterChip } from '@/components/ui/toggle';
import { RuleHeading } from '@/components/ui/misc';
import {
  accessibilityLabels,
  allGenres,
  cinemas,
  formatLabels,
  genreLabels,
  languageLabels,
} from '@/data';
import { certificates } from '@/data/pricing';
import type { CertificateCode, Format, Language, ScreeningAccessibility } from '@/data/types';
import type { FilterControls } from '@/hooks/useMovieFilters';
import { cn } from '@/lib/utils';

const languages: Language[] = ['bn', 'en', 'hi'];
const formats: Format[] = ['standard', 'three-d', 'grandscreen', 'velvet'];
const certificateCodes: CertificateCode[] = ['U', 'UA12', 'UA16', 'A18'];
const accessibilityFeatures: ScreeningAccessibility[] = [
  'open-captions',
  'closed-captions',
  'audio-description',
  'wheelchair-spaces',
  'hearing-loop',
  'sensory-friendly',
];
const runtimeOptions = [
  { value: 100, label: 'Under 1h 40m' },
  { value: 120, label: 'Under 2h' },
  { value: 150, label: 'Under 2h 30m' },
];

/**
 * The filter panel.
 *
 * The same component serves the desktop sidebar and the mobile sheet, so the
 * two can never drift apart. Every control is a real form control: chips are
 * checkboxes, not divs with click handlers.
 */
export function FilterPanel({
  controls,
  showCinemas = true,
  showAccessibility = true,
  className,
}: {
  controls: FilterControls;
  showCinemas?: boolean;
  showAccessibility?: boolean;
  className?: string;
}) {
  const { filter, setFilter, toggleIn } = controls;

  return (
    <div className={cn('space-y-7', className)}>
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">Search</Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-faint"
          />
          <Input
            id="filter-search"
            type="search"
            value={filter.query ?? ''}
            placeholder="Title, director, cast…"
            className="pl-9"
            onChange={(event) => setFilter({ query: event.target.value || undefined }, { replace: true })}
          />
        </div>
      </div>

      <fieldset>
        <RuleHeading as="h3" className="mb-3">
          Genre
        </RuleHeading>
        <div className="flex flex-wrap gap-1.5">
          {allGenres.map((genre) => (
            <FilterChip
              key={genre}
              checked={filter.genres?.includes(genre) ?? false}
              onCheckedChange={() => toggleIn('genres', genre)}
            >
              {genreLabels[genre]}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <RuleHeading as="h3" className="mb-3">
          Language
        </RuleHeading>
        <div className="flex flex-wrap gap-1.5">
          {languages.map((language) => (
            <FilterChip
              key={language}
              checked={filter.languages?.includes(language) ?? false}
              onCheckedChange={() => toggleIn('languages', language)}
            >
              {languageLabels[language]}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <RuleHeading as="h3" className="mb-3">
          Format
        </RuleHeading>
        <div className="flex flex-wrap gap-1.5">
          {formats.map((format) => (
            <FilterChip
              key={format}
              checked={filter.formats?.includes(format) ?? false}
              onCheckedChange={() => toggleIn('formats', format)}
            >
              {formatLabels[format]}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      {showCinemas ? (
        <fieldset>
          <RuleHeading as="h3" className="mb-3">
            Cinema
          </RuleHeading>
          <div className="flex flex-wrap gap-1.5">
            {cinemas.map((cinema) => (
              <FilterChip
                key={cinema.id}
                checked={filter.cinemaIds?.includes(cinema.id) ?? false}
                onCheckedChange={() => toggleIn('cinemaIds', cinema.id)}
              >
                {cinema.shortName}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <RuleHeading as="h3" className="mb-3">
          Certificate
        </RuleHeading>
        <div className="flex flex-wrap gap-1.5">
          {certificateCodes.map((code) => (
            <FilterChip
              key={code}
              checked={filter.certificates?.includes(code) ?? false}
              onCheckedChange={() => toggleIn('certificates', code)}
            >
              {certificates[code].label.split('—')[0]?.trim()}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <RuleHeading as="h3" className="mb-3">
          Running time
        </RuleHeading>
        <div className="flex flex-wrap gap-1.5">
          {runtimeOptions.map((option) => (
            <FilterChip
              key={option.value}
              checked={filter.maxRuntime === option.value}
              onCheckedChange={(checked) =>
                setFilter({ maxRuntime: checked ? option.value : undefined })
              }
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      {showAccessibility ? (
        <fieldset>
          <RuleHeading as="h3" className="mb-2">
            Accessibility
          </RuleHeading>
          <p className="mb-3 text-[0.8125rem] leading-5 text-content-muted">
            Filters screenings, not films. Open captions are on the print; closed captions come on a
            device from the box office.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {accessibilityFeatures.map((feature) => (
              <FilterChip
                key={feature}
                checked={filter.accessibility?.includes(feature) ?? false}
                onCheckedChange={() => toggleIn('accessibility', feature)}
              >
                {accessibilityLabels[feature]}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

/** The removable summary of what is currently applied. */
export function ActiveFilters({
  controls,
  className,
}: {
  controls: FilterControls;
  className?: string;
}) {
  const { filter, setFilter, toggleIn, clear } = controls;

  const chips: Array<{ key: string; label: string; remove: () => void }> = [];

  if (filter.query?.trim()) {
    chips.push({
      key: 'q',
      label: `“${filter.query.trim()}”`,
      remove: () => setFilter({ query: undefined }),
    });
  }
  for (const genre of filter.genres ?? []) {
    chips.push({ key: `g-${genre}`, label: genreLabels[genre], remove: () => toggleIn('genres', genre) });
  }
  for (const language of filter.languages ?? []) {
    chips.push({
      key: `l-${language}`,
      label: languageLabels[language],
      remove: () => toggleIn('languages', language),
    });
  }
  for (const format of filter.formats ?? []) {
    chips.push({
      key: `f-${format}`,
      label: formatLabels[format],
      remove: () => toggleIn('formats', format),
    });
  }
  for (const cinemaId of filter.cinemaIds ?? []) {
    const cinema = cinemas.find((c) => c.id === cinemaId);
    if (cinema) {
      chips.push({
        key: `c-${cinemaId}`,
        label: cinema.shortName,
        remove: () => toggleIn('cinemaIds', cinemaId),
      });
    }
  }
  for (const feature of filter.accessibility ?? []) {
    chips.push({
      key: `a-${feature}`,
      label: accessibilityLabels[feature],
      remove: () => toggleIn('accessibility', feature),
    });
  }
  for (const code of filter.certificates ?? []) {
    chips.push({
      key: `cert-${code}`,
      label: certificates[code].label.split('—')[0]?.trim() ?? code,
      remove: () => toggleIn('certificates', code),
    });
  }
  if (filter.maxRuntime !== undefined) {
    chips.push({
      key: 'runtime',
      label: `Under ${Math.floor(filter.maxRuntime / 60)}h ${filter.maxRuntime % 60}m`,
      remove: () => setFilter({ maxRuntime: undefined }),
    });
  }
  if (filter.after) {
    chips.push({ key: 'after', label: `After ${filter.after}`, remove: () => setFilter({ after: undefined }) });
  }
  if (filter.before) {
    chips.push({
      key: 'before',
      label: `Before ${filter.before}`,
      remove: () => setFilter({ before: undefined }),
    });
  }
  if (filter.maxPrice !== undefined) {
    chips.push({
      key: 'price',
      label: `Under ৳${filter.maxPrice}`,
      remove: () => setFilter({ maxPrice: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="eyebrow mr-1">Filtering by</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex items-center gap-1.5 border border-content bg-content px-2.5 py-1 text-[0.8125rem] font-medium text-surface transition-opacity hover:opacity-80"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <Button variant="link" size="sm" className="px-1" onClick={clear}>
        Clear all
      </Button>
    </div>
  );
}
