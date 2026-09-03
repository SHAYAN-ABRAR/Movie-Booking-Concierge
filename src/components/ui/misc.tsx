import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(function Separator({ className, orientation = 'horizontal', decorative = true, ...props }, ref) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      decorative={decorative}
      className={cn(
        'shrink-0 bg-hairline',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
});

/**
 * A stamped label.
 *
 * Square, tracked out, uppercase — a certificate mark or a format stamp on a
 * printed programme. Every tone pairs a ground with an ink that is guaranteed
 * to hold contrast in *both* themes, which is why the washes and their inks
 * are semantic tokens rather than fixed colours.
 */
const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-[0.15rem]',
    'font-sans text-[0.625rem] font-bold uppercase leading-[1.4] tracking-[0.12em]',
    '[&:lang(bn)]:tracking-[0.04em]',
  ].join(' '),
  {
    variants: {
      tone: {
        neutral: 'bg-content/[0.08] text-content-muted',
        ink: 'bg-content text-surface',
        accent: 'bg-steel-wash text-steel-deep',
        signal: 'bg-signal-wash text-accent',
        ok: 'bg-ok-wash text-ok',
        warn: 'bg-warn-wash text-warn',
        danger: 'bg-danger-wash text-danger',
        outline: 'border border-hairline-strong text-content-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div aria-hidden="true" className={cn('animate-pulse bg-content/[0.07]', className)} {...props} />
  );
}

/**
 * A section mark: an optional index number, a label, and a rule running out to
 * the end of the measure.
 *
 * This is the smallest unit of the Swiss half of the system — a numbered entry
 * in a programme — and it is used for every subdivision inside a page, so that
 * the numbering the customer meets on the home page continues all the way into
 * the booking flow.
 */
export function RuleHeading({
  children,
  className,
  as: Tag = 'h2',
  id,
  index,
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4' | 'div';
  id?: string;
  /** The entry's number, already formatted — e.g. `03`. */
  index?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {index ? (
        <span aria-hidden="true" className="numeral text-[0.6875rem] font-bold text-accent">
          {index}
        </span>
      ) : null}
      <Tag id={id} className="eyebrow shrink-0 text-content">
        {children}
      </Tag>
      <span aria-hidden="true" className="h-px flex-1 bg-hairline-strong" />
    </div>
  );
}

/**
 * The one place a demonstration disclaimer is worded. Used wherever the
 * interface shows operational-looking information that is only sample data.
 */
export function DemoNote({
  children,
  className,
  tone = 'quiet',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'quiet' | 'loud';
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 text-[0.75rem] leading-5',
        tone === 'loud'
          ? 'border-l-2 border-accent bg-surface-sunken px-3 py-2 text-content-muted'
          : 'text-content-faint',
        className,
      )}
    >
      <span aria-hidden="true" className="mt-[0.45em] block size-1 shrink-0 bg-accent" />
      <span>{children}</span>
    </p>
  );
}

/**
 * The oversized index numeral — `01`, `02`, `03`.
 *
 * The single most characteristic mark in the system. It sits beside a film, a
 * section or a booking step and does the job a rule would otherwise have to do:
 * it says *where you are in a sequence* before you have read a word.
 */
export function IndexMark({
  n,
  total,
  className,
  size = 'md',
}: {
  n: number;
  total?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const scale = {
    sm: 'text-[0.75rem]',
    md: 'text-[1.375rem]',
    lg: 'text-[2.5rem] sm:text-[3.25rem]',
  }[size];

  return (
    <span aria-hidden="true" className={cn('index-mark inline-flex items-baseline gap-1', scale, className)}>
      <span className="text-accent">{String(n).padStart(2, '0')}</span>
      {total ? (
        <span className="text-[0.5em] text-content-faint">/ {String(total).padStart(2, '0')}</span>
      ) : null}
    </span>
  );
}
