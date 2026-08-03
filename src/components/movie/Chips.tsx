import { useTranslation } from 'react-i18next';
import { Accessibility, AudioLines, Captions, Ear, Sparkle, Subtitles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/misc';
import { InfoTip } from '@/components/ui/popover';
import { accessibilityBlurbKeys, accessibilityKeys } from '@/i18n/domain';
import { formatKeys, languageKeys } from '@/i18n/domain';
import { certificateGuidance, certificateShort } from '@/i18n/domain';
import type { CertificateCode, Format, Language, ScreeningAccessibility } from '@/data/types';
import { cn } from '@/lib/utils';

export function CertificateChip({ code, className }: { code: CertificateCode; className?: string }) {
  useTranslation();
  const short = certificateShort(code);
  const guidance = certificateGuidance(code);
  return (
    <InfoTip label={guidance}>
      <span
        className={cn(
          'inline-flex cursor-help items-center border border-current px-1.5 py-0.5',
          'text-[0.6875rem] font-bold uppercase tracking-[0.06em]',
          code === 'A18' ? 'text-danger' : code === 'U' ? 'text-ok' : 'text-content-muted',
          className,
        )}
      >
        {short}
        <span className="sr-only"> — {guidance}</span>
      </span>
    </InfoTip>
  );
}

export function FormatChip({ format, className }: { format: Format; className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge tone={format === 'standard' ? 'neutral' : 'accent'} className={className}>
      {t(formatKeys[format])}
    </Badge>
  );
}

export function LanguageChip({ language, className }: { language: Language; className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge tone="outline" className={className}>
      {t(languageKeys[language])}
    </Badge>
  );
}

const accessibilityIcons: Record<ScreeningAccessibility, LucideIcon> = {
  'open-captions': Subtitles,
  'closed-captions': Captions,
  'audio-description': AudioLines,
  'wheelchair-spaces': Accessibility,
  'hearing-loop': Ear,
  'sensory-friendly': Sparkle,
};

/** Two-letter codes so the meaning survives without colour, icons or hover. */
const accessibilityCodes: Record<ScreeningAccessibility, string> = {
  'open-captions': 'OC',
  'closed-captions': 'CC',
  'audio-description': 'AD',
  'wheelchair-spaces': 'WC',
  'hearing-loop': 'HL',
  'sensory-friendly': 'SF',
};

/**
 * Accessibility markers.
 *
 * Every marker carries its own abbreviation as text, so the information does
 * not depend on colour or on an icon being recognised. Open captions and
 * closed captions are always distinguished — never merged into one "captions"
 * marker, because they are not the same provision.
 */
export function AccessibilityChips({
  features,
  className,
  size = 'md',
}: {
  features: ScreeningAccessibility[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation();
  if (features.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap items-center gap-1', className)}>
      {features.map((feature) => {
        const Icon = accessibilityIcons[feature];
        return (
          <li key={feature}>
            <InfoTip
              label={`${t(accessibilityKeys[feature])} — ${t(accessibilityBlurbKeys[feature])}`}
            >
              <span
                className={cn(
                  'inline-flex cursor-help items-center gap-1 border border-hairline-strong bg-surface-raised px-1 font-semibold text-content-muted',
                  size === 'sm' ? 'py-px text-[0.625rem]' : 'py-0.5 text-[0.6875rem]',
                )}
              >
                <Icon aria-hidden="true" className={size === 'sm' ? 'size-3' : 'size-3.5'} />
                <span aria-hidden="true">{accessibilityCodes[feature]}</span>
                <span className="sr-only">{t(accessibilityKeys[feature])}</span>
              </span>
            </InfoTip>
          </li>
        );
      })}
    </ul>
  );
}

/** The legend that explains the codes above. Shown once per page that uses them. */
export function AccessibilityLegend({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn('text-[0.8125rem] leading-6 text-content-muted', className)}>
      <h3 className="eyebrow mb-2">{t('markers.heading')}</h3>
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {(Object.keys(accessibilityCodes) as ScreeningAccessibility[]).map((feature) => (
          <div key={feature} className="flex gap-2">
            <dt className="w-7 shrink-0 font-semibold text-content">{accessibilityCodes[feature]}</dt>
            <dd>
              <span className="font-medium text-content">{t(accessibilityKeys[feature])}</span> —{' '}
              {t(accessibilityBlurbKeys[feature])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
