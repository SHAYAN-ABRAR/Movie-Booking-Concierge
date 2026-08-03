import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyDrawing } from '@/components/visual/EmptyStates';
import type { EmptyVariant } from '@/components/visual/EmptyStates';

export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('border-b border-hairline py-8 sm:py-12', className)}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h1 className="font-display text-[2.25rem] leading-[1.02] tracking-[-0.025em] sm:text-[3rem]">
            {title}
          </h1>
          {lede ? (
            <p className="mt-4 max-w-prose text-[1.0625rem] leading-7 text-content-muted">{lede}</p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}

/**
 * An empty state.
 *
 * `variant` selects a drawn composition for the thing that is actually empty —
 * a schedule with no screenings, an index cut short, a till roll with no lines.
 * Without one it falls back to the original stitched panel, so any call site
 * that has not been given a drawing still renders correctly.
 */
export function EmptyState({
  title,
  body,
  action,
  variant,
  className,
}: {
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  variant?: EmptyVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border border-hairline-strong bg-surface-sunken/50 px-6 py-8',
        variant ? 'sm:flex sm:items-center sm:gap-8' : 'border-dashed py-10',
        className,
      )}
    >
      {variant ? (
        <div className="mb-6 w-full max-w-52 shrink-0 sm:mb-0 sm:w-52">
          <EmptyDrawing variant={variant} />
        </div>
      ) : null}

      <div className="flex flex-col items-start gap-3">
        {variant ? null : <span aria-hidden="true" className="stitch-x h-[1.5px] w-16" />}
        <h3 className="font-display text-xl leading-tight">{title}</h3>
        <div className="max-w-prose text-[0.9375rem] leading-6 text-content-muted">{body}</div>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}

/** A polite live region. Renders nothing visible. */
export function Announcer({ message }: { message: string }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main"
      className="sr-only-focusable left-4 top-4 bg-content px-4 py-3 text-sm font-semibold text-surface"
    >
      {t('nav.skipToContent')}
    </a>
  );
}

/**
 * The section heading used throughout the programme: an eyebrow, a display
 * title, and an optional link out — always on the same baseline grid.
 */
export function SectionHeading({
  eyebrow,
  title,
  to,
  linkLabel,
  className,
  id,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  to?: string;
  linkLabel?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('mb-6 flex items-end justify-between gap-6 border-b border-hairline pb-4', className)}>
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h2 id={id} className="font-display text-[1.75rem] leading-tight tracking-[-0.02em] sm:text-[2rem]">
          {title}
        </h2>
      </div>
      {to && linkLabel ? (
        <Button asChild variant="link" size="sm" className="mb-1 shrink-0 px-0">
          <Link to={to}>{linkLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

/** A definition row — the programme's way of setting a label against a value. */
export function DataRow({
  label,
  children,
  className,
  emphasis = false,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-6 border-b border-hairline py-2.5 last:border-0',
        emphasis ? 'font-semibold text-content' : '',
        className,
      )}
    >
      <dt className={cn('text-sm', emphasis ? 'text-content' : 'text-content-muted')}>{label}</dt>
      <dd className={cn('numeral text-right text-sm', emphasis ? 'text-base' : 'text-content')}>
        {children}
      </dd>
    </div>
  );
}
