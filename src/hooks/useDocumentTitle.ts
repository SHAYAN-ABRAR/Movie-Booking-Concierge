import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Sets `<title>` for a route, in the active language.
 *
 * The tab title is interface copy like any other, and it is the one piece a
 * customer sees while the page is still loading. Leaving it in English while
 * the page renders Bangla is the kind of half-translation that makes a build
 * feel unfinished.
 *
 * `page` is either a translation key, or — for a film, a venue, anything whose
 * name is a proper noun that does not translate — pre-resolved text.
 */
export function useDocumentTitle(page: string | null | undefined) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!page) return;
    document.title = t('metadata.titleTemplate', { page });
    // `i18n.language` is in the dependency list rather than just `t`: `t` is
    // referentially stable across a language change in some react-i18next
    // configurations, and the title would silently keep the old language.
  }, [page, t, i18n.language]);
}
