import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MovieFilter } from '@/data';
import type {
  CertificateCode,
  Format,
  Genre,
  Language,
  ScreeningAccessibility,
} from '@/data/types';

/**
 * Filter state, stored in the URL.
 *
 * Keeping it in the query string means a filtered view is shareable, survives
 * a reload, works with the back button — and gives Max somewhere real to write
 * to when it applies a filter, rather than a private store it alone can reach.
 */

const CSV = (value: string | null): string[] => (value ? value.split(',').filter(Boolean) : []);

export interface FilterControls {
  filter: MovieFilter;
  setFilter: (patch: Partial<MovieFilter>, options?: { replace?: boolean }) => void;
  toggleIn: <K extends 'genres' | 'languages' | 'formats' | 'cinemaIds' | 'accessibility' | 'certificates'>(
    key: K,
    value: NonNullable<MovieFilter[K]>[number],
  ) => void;
  clear: () => void;
  clearOne: (key: keyof MovieFilter) => void;
}

export function useMovieFilters(defaults: Partial<MovieFilter> = {}): FilterControls {
  const [params, setParams] = useSearchParams();

  const filter = useMemo<MovieFilter>(() => {
    const runtime = params.get('runtime');
    const price = params.get('price');
    const status = params.get('status');

    return {
      ...defaults,
      ...(params.get('q') ? { query: params.get('q')! } : {}),
      ...(CSV(params.get('genre')).length ? { genres: CSV(params.get('genre')) as Genre[] } : {}),
      ...(CSV(params.get('lang')).length ? { languages: CSV(params.get('lang')) as Language[] } : {}),
      ...(CSV(params.get('format')).length ? { formats: CSV(params.get('format')) as Format[] } : {}),
      ...(CSV(params.get('cinema')).length ? { cinemaIds: CSV(params.get('cinema')) } : {}),
      ...(CSV(params.get('access')).length
        ? { accessibility: CSV(params.get('access')) as ScreeningAccessibility[] }
        : {}),
      ...(CSV(params.get('cert')).length
        ? { certificates: CSV(params.get('cert')) as CertificateCode[] }
        : {}),
      ...(params.get('date') ? { date: params.get('date')! } : {}),
      ...(params.get('after') ? { after: params.get('after')! } : {}),
      ...(params.get('before') ? { before: params.get('before')! } : {}),
      ...(runtime ? { maxRuntime: Number(runtime) } : {}),
      ...(price ? { maxPrice: Number(price) } : {}),
      ...(status ? { status: status as MovieFilter['status'] } : {}),
    };
    // `defaults` is a literal at every call site; re-reading it each render is
    // cheaper than asking callers to memoise it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const write = useCallback(
    (next: MovieFilter, replace = false) => {
      const search = new URLSearchParams();
      if (next.query?.trim()) search.set('q', next.query.trim());
      if (next.genres?.length) search.set('genre', next.genres.join(','));
      if (next.languages?.length) search.set('lang', next.languages.join(','));
      if (next.formats?.length) search.set('format', next.formats.join(','));
      if (next.cinemaIds?.length) search.set('cinema', next.cinemaIds.join(','));
      if (next.accessibility?.length) search.set('access', next.accessibility.join(','));
      if (next.certificates?.length) search.set('cert', next.certificates.join(','));
      if (next.date) search.set('date', next.date);
      if (next.after) search.set('after', next.after);
      if (next.before) search.set('before', next.before);
      if (next.maxRuntime !== undefined) search.set('runtime', String(next.maxRuntime));
      if (next.maxPrice !== undefined) search.set('price', String(next.maxPrice));
      if (next.status && next.status !== 'now-showing') search.set('status', next.status);
      setParams(search, { replace });
    },
    [setParams],
  );

  const setFilter = useCallback<FilterControls['setFilter']>(
    (patch, options) => {
      const next = { ...filter, ...patch };
      for (const key of Object.keys(patch) as Array<keyof MovieFilter>) {
        if (patch[key] === undefined) delete next[key];
      }
      write(next, options?.replace);
    },
    [filter, write],
  );

  const toggleIn = useCallback<FilterControls['toggleIn']>(
    (key, value) => {
      const current = (filter[key] ?? []) as string[];
      const next = current.includes(value as string)
        ? current.filter((item) => item !== value)
        : [...current, value as string];
      setFilter({ [key]: next.length ? next : undefined } as Partial<MovieFilter>);
    },
    [filter, setFilter],
  );

  const clear = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  const clearOne = useCallback(
    (key: keyof MovieFilter) => setFilter({ [key]: undefined } as Partial<MovieFilter>),
    [setFilter],
  );

  return { filter, setFilter, toggleIn, clear, clearOne };
}
