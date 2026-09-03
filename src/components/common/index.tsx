import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyDrawing } from '@/components/visual/EmptyStates';
import type { EmptyVariant } from '@/components/visual/EmptyStates';

/**
 * The head of a route.
 *
 * A slab rule, an eyebrow, and then the title at a size that is deliberately
 * uncomfortable — this is the one piece of type on the page allowed to behave
 * like a title card. `clamp()` rather than breakpoint steps, so a long film
 * name and a short route name both fill the measure instead of one of them
 * wrapping into three lines on a tablet.
 */
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
    <header className={cn('slab pb-8 pt-5 sm:pb-12 sm:pt-6', className)}>
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0 max-w-4xl">
          {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
          <h1
            className="font-display uppercase leading-[0.9] tracking-[-0.03em] [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(2.5rem, 7.5vw, 5rem)' }}
          >
            {title}
          </h1>
          {lede ? (
            <p className="mt-6 max-w-prose text-[1.0625rem] leading-[1.65] text-content-muted">
              {lede}
            </p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0 lg:pb-2">{aside}</div> : null}
      </div>
    </header>
  );
}

/**
 * An empty state.
 *
 * `variant` selects a drawn composition for the thing that is actually empty —
 * a schedule with no screenings, an index cut short, a till roll with no lines.
 * Without one it falls back to a plain framed panel, so any call site that has
 * not been given a drawing still renders correctly.
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
        'edge bg-surface-sunken/40 px-6 py-8',
        variant ? 'sm:flex sm:items-center sm:gap-8' : 'py-10',
        className,
      )}
    >
      {variant ? (
        <div className="mb-6 w-full max-w-52 shrink-0 sm:mb-0 sm:w-52">
          <EmptyDrawing variant={variant} />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col items-start gap-3">
        <span aria-hidden="true" className="block h-[3px] w-10 bg-accent" />
        <h3 className="font-display text-2xl uppercase leading-none">{title}</h3>
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
      className="sr-only-focusable left-4 top-4 bg-accent px-4 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-accent-contrast"
    >
      {t('nav.skipToContent')}
    </a>
  );
}

/**
 * The section head used throughout the programme.
 *
 * Numbered on the left, titled in the display face, and closed by a link out —
 * always on the same slab rule, so scrolling a long page produces a repeating
 * horizontal beat rather than a stack of unrelated blocks.
 */
export function SectionHeading({
  eyebrow,
  title,
  to,
  linkLabel,
  className,
  id,
  index,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  to?: string;
  linkLabel?: string;
  className?: string;
  id?: string;
  /** Position in the page's sequence. Rendered as `01`. */
  index?: number;
}) {
  return (
    <div className={cn('slab mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pt-4', className)}>
      <div className="flex min-w-0 items-baseline gap-4">
        {index !== undefined ? (
          <span aria-hidden="true" className="index-mark shrink-0 text-[1.25rem] text-accent">
            {String(index).padStart(2, '0')}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h2
            id={id}
            className="font-display uppercase leading-[0.95] tracking-[-0.025em] [overflow-wrap:anywhere]"
            style={{ fontSize: 'clamp(1.75rem, 3.8vw, 2.75rem)' }}
          >
            {title}
          </h2>
        </div>
      </div>
      {to && linkLabel ? (
        <Link
          to={to}
          className={cn(
            'group inline-flex shrink-0 items-center gap-2 pb-1.5',
            'text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-content-muted',
            'transition-colors duration-[--dur-fast] hover:text-accent',
            '[&:lang(bn)]:tracking-normal',
          )}
        >
          {linkLabel}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-[--dur-base] ease-[--ease-out] group-hover:translate-x-1 motion-reduce:transform-none"
          />
        </Link>
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
      <dt
        className={cn(
          'text-[0.6875rem] font-semibold uppercase tracking-[0.1em]',
          '[&:lang(bn)]:tracking-normal [&:lang(bn)]:text-[0.8125rem]',
          emphasis ? 'text-content' : 'text-content-faint',
        )}
      >
        {label}
      </dt>
      <dd className={cn('numeral text-right text-sm', emphasis ? 'text-base' : 'text-content')}>
        {children}
      </dd>
    </div>
  );
}
