import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/store/preferences';

/**
 * Announces a preference change once, politely.
 *
 * `polite`, never `assertive`: changing the theme is not an emergency, and
 * interrupting whatever a screen reader is mid-way through reading would be
 * worse than saying nothing.
 *
 * The first render is skipped — a page load is not a change, and announcing
 * "Language changed to English" to somebody who just arrived is noise.
 */
export function PreferenceAnnouncer() {
  const { t } = useTranslation();
  const locale = usePreferences((s) => s.locale);
  const theme = usePreferences((s) => s.theme);

  const [message, setMessage] = useState('');
  const previous = useRef({ locale, theme });
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previous.current = { locale, theme };
      return;
    }

    if (previous.current.locale !== locale) {
      // Read from the newly selected language — the confirmation that Bangla is
      // on should itself be in Bangla.
      setMessage(t('preferences.language.changed'));
    } else if (previous.current.theme !== theme) {
      setMessage(
        theme === 'dark'
          ? t('preferences.appearance.changedDark')
          : t('preferences.appearance.changedLight'),
      );
    }

    previous.current = { locale, theme };
  }, [locale, theme, t]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
