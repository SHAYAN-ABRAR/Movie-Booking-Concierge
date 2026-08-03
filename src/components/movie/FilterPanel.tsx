import { useTranslation } from 'react-i18next';
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
import { certificateShort } from '@/i18n/domain';
import { useFormatters } from '@/i18n/useFormatters';
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
/** Thresholds in minutes; the label is built from the active locale. */
const runtimeOptions = [100, 120, 150];

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
  const { t } = useTranslation();
  const f = useFormatters();
  const { filter, setFilter, toggleIn } = controls;

  return (
    <div className={cn('space-y-7', className)}>
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">{t('filters.search')}</Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content-faint"
          />
          <Input
            id="filter-search"
            type="search"
            value={filter.query ?? ''}
            placeholder={t('filters.searchPlaceholder')}
            className="pl-9"
            onChange={(event) => setFilter({ query: event.target.value || undefined }, { replace: true })}
          />
        </div>
      </div>

      <fieldset>
        <RuleHeading as="h3" className="mb-3">
          {t('filters.genre')}
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
          {t('filters.language')}
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
          {t('filters.format')}
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
            {t('filters.cinema')}
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
          {t('filters.certificate')}
        </RuleHeading>
        <div className="flex flex-wrap gap-1.5">
          {certificateCodes.map((code) => (
            <FilterChip
              key={code}
              checked={filter.certificates?.includes(code) ?? false}
              onCheckedChange={() => toggleIn('certificates', code)}
            >
              {certificateShort(code)}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <RuleHeading as="h3" className="mb-3">
          {t('filters.runningTime')}
        </RuleHeading>
        <div className="flex flex-wrap gap-1.5">
          {runtimeOptions.map((minutes) => (
            <FilterChip
              key={minutes}
              checked={filter.maxRuntime === minutes}
              onCheckedChange={(checked) => setFilter({ maxRuntime: checked ? minutes : undefined })}
            >
              {t('filters.under', { duration: f.runtime(minutes) })}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      {showAccessibility ? (
        <fieldset>
          <RuleHeading as="h3" className="mb-2">
            {t('filters.accessibility')}
          </RuleHeading>
          <p className="mb-3 text-[0.8125rem] leading-5 text-content-muted">
            {t('filters.accessibilityNote')}
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
  const { t } = useTranslation();
  const f = useFormatters();
  const { filter, setFilter, toggleIn, clear } = controls;

  const chips: Array<{ key: string; label: string; remove: () => void }> = [];

  if (filter.query?.trim()) {
    chips.push({
      key: 'q',
      label: t('filters.quotedQuery', { query: filter.query.trim() }),
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
      label: certificateShort(code),
      remove: () => toggleIn('certificates', code),
    });
  }
  if (filter.maxRuntime !== undefined) {
    chips.push({
      key: 'runtime',
      label: t('filters.under', { duration: f.runtime(filter.maxRuntime) }),
      remove: () => setFilter({ maxRuntime: undefined }),
    });
  }
  if (filter.after) {
    chips.push({
      key: 'after',
      label: t('filters.after', { time: f.time(filter.after) }),
      remove: () => setFilter({ after: undefined }),
    });
  }
  if (filter.before) {
    chips.push({
      key: 'before',
      label: t('filters.before', { time: f.time(filter.before) }),
      remove: () => setFilter({ before: undefined }),
    });
  }
  if (filter.maxPrice !== undefined) {
    chips.push({
      key: 'price',
      label: t('filters.underPrice', { price: f.money(filter.maxPrice) }),
      remove: () => setFilter({ maxPrice: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="eyebrow mr-1">{t('filters.filteringBy')}</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex items-center gap-1.5 border border-content bg-content px-2.5 py-1 text-[0.8125rem] font-medium text-surface transition-opacity hover:opacity-80"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{t('filters.removeFilter')}</span>
        </button>
      ))}
      <Button variant="link" size="sm" className="px-1" onClick={clear}>
        {t('filters.clearAll')}
      </Button>
    </div>
  );
}
