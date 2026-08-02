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

const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-xs px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]',
  {
    variants: {
      tone: {
        neutral: 'bg-content/[0.08] text-content-muted',
        ink: 'bg-content text-surface',
        accent: 'bg-projector-wash text-projector-deep',
        marigold: 'bg-marigold-wash text-marigold',
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
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-content/[0.07]', className)}
      {...props}
    />
  );
}

/** A hairline rule with an optional label set into it — the programme's divider. */
export function RuleHeading({
  children,
  className,
  as: Tag = 'h2',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3' | 'h4' | 'div';
  id?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Tag id={id} className="eyebrow shrink-0">
        {children}
      </Tag>
      <span aria-hidden="true" className="stitch-x h-[1.5px] flex-1" />
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
          ? 'border border-hairline-strong bg-surface-sunken px-3 py-2 text-content-muted'
          : 'text-content-faint',
        className,
      )}
    >
      <span aria-hidden="true" className="mt-[0.45em] block size-1 shrink-0 bg-marigold" />
      <span>{children}</span>
    </p>
  );
}
