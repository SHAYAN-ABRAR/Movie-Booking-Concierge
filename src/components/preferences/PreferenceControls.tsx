import { Moon, Sun } from 'lucide-react';
import { usePreferences } from '@/store/preferences';
import type { AppLocale, AppTheme } from '@/store/preferences';
import { cn } from '@/lib/utils';

/**
 * Language and appearance controls.
 *
 * Both are segmented controls built from real buttons with `aria-pressed`,
 * because that is what they are: two or three mutually exclusive options, both
 * visible, current one marked. A switch would be wrong for language, and a
 * lone globe icon would not tell anybody what language they are about to get.
 *
 * Geometry follows the house style — square, hairline-bordered, no pills, no
 * flags, no glow. The selected segment fills with ink the way the date strip
 * and filter chips already do.
 */

/* ── Language ─────────────────────────────────────────────────────────── */

const LOCALES: Array<{ value: AppLocale; short: string; full: string }> = [
  // The label for each language is written *in* that language. "বাংলা" tells a
  // Bangla reader far more than a translated word "Bengali" ever would.
  { value: 'en', short: 'EN', full: 'English' },
  { value: 'bn', short: 'বাংলা', full: 'বাংলা' },
];

export function LanguageToggle({
  className,
  size = 'compact',
  label,
}: {
  className?: string;
  /** `compact` for the header, `full` for the mobile sheet. */
  size?: 'compact' | 'full';
  label: string;
}) {
  const locale = usePreferences((s) => s.locale);
  const setLocale = usePreferences((s) => s.setLocale);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-stretch rounded-sm border border-hairline-strong',
        size === 'full' ? 'w-full' : '',
        className,
      )}
    >
      {LOCALES.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            // The accessible name is always the language's own name, so a
            // screen reader announces "বাংলা, pressed" rather than "EN".
            aria-label={option.full}
            onClick={() => setLocale(option.value)}
            className={cn(
              'min-h-11 px-3 text-[0.8125rem] font-semibold transition-colors duration-[--dur-fast]',
              'focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              size === 'full' ? 'flex-1' : '',
              option.value === 'bn' ? 'font-bangla' : '',
              active
                ? 'bg-content text-surface'
                : 'text-content-muted hover:bg-content/[0.07] hover:text-content',
            )}
          >
            {size === 'full' ? option.full : option.short}
          </button>
        );
      })}
    </div>
  );
}

/* ── Appearance ───────────────────────────────────────────────────────── */

const THEMES: Array<{ value: AppTheme; icon: typeof Sun }> = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

export function ThemeToggle({
  className,
  size = 'compact',
  label,
  lightLabel,
  darkLabel,
}: {
  className?: string;
  size?: 'compact' | 'full';
  label: string;
  lightLabel: string;
  darkLabel: string;
}) {
  const theme = usePreferences((s) => s.theme);
  const setTheme = usePreferences((s) => s.setTheme);
  const names: Record<AppTheme, string> = { light: lightLabel, dark: darkLabel };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-stretch rounded-sm border border-hairline-strong',
        size === 'full' ? 'w-full' : '',
        className,
      )}
    >
      {THEMES.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            // The state never rests on the icon alone.
            aria-label={names[option.value]}
            title={names[option.value]}
            onClick={() => setTheme(option.value)}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-2 px-3',
              'text-[0.8125rem] font-semibold transition-colors duration-[--dur-fast]',
              'focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
              size === 'full' ? 'flex-1' : '',
              active
                ? 'bg-content text-surface'
                : 'text-content-muted hover:bg-content/[0.07] hover:text-content',
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {size === 'full' ? names[option.value] : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── Both, for the mobile sheet ───────────────────────────────────────── */

export function PreferenceControls({
  languageLabel,
  appearanceLabel,
  lightLabel,
  darkLabel,
  className,
}: {
  languageLabel: string;
  appearanceLabel: string;
  lightLabel: string;
  darkLabel: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-5', className)}>
      <div>
        <p className="eyebrow mb-2.5">{languageLabel}</p>
        <LanguageToggle size="full" label={languageLabel} />
      </div>
      <div>
        <p className="eyebrow mb-2.5">{appearanceLabel}</p>
        <ThemeToggle
          size="full"
          label={appearanceLabel}
          lightLabel={lightLabel}
          darkLabel={darkLabel}
        />
      </div>
    </div>
  );
}
