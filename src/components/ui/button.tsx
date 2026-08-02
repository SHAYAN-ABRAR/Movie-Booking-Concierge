import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Buttons are printed, not extruded: flat fills, hairline rules, a 4px radius
 * and no shadow anywhere. See docs/design-system.md §Controls.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm',
    'font-sans text-sm font-semibold tracking-[0.01em]',
    'transition-[background-color,color,border-color,opacity] duration-[--dur-fast] ease-[--ease-out]',
    'disabled:pointer-events-none disabled:opacity-40',
    'select-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-content text-surface hover:bg-content/86 active:bg-content/94',
        accent: 'bg-accent text-accent-contrast hover:bg-accent/88 active:bg-accent/95',
        outline:
          'border border-hairline-strong bg-transparent text-content hover:bg-content/[0.06] active:bg-content/[0.1]',
        subtle: 'bg-content/[0.06] text-content hover:bg-content/[0.11] active:bg-content/[0.14]',
        ghost: 'bg-transparent text-content hover:bg-content/[0.06] active:bg-content/[0.1]',
        link: 'bg-transparent text-content underline decoration-hairline-strong decoration-1 underline-offset-4 hover:decoration-current',
        danger: 'bg-danger text-white hover:bg-danger/88 active:bg-danger/95',
      },
      size: {
        sm: 'h-9 px-3 text-[0.8125rem] [&_svg]:size-4',
        md: 'h-11 px-4 [&_svg]:size-4',
        lg: 'h-13 px-6 text-base [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-5',
        'icon-sm': 'size-9 [&_svg]:size-4',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
});

export { buttonVariants };
