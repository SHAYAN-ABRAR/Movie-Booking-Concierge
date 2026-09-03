import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Buttons are stamped, not extruded.
 *
 * Square corners, flat fills, no shadow and no gradient anywhere. What makes
 * them read as pressable is the label itself: condensed, uppercase, wide
 * tracking — the same voice as a cinema's own signage — plus a 1px downward
 * shift on press that acknowledges the click on the same frame.
 *
 * The variants are ranked, and the ranking is the point. Exactly one `accent`
 * button should be visible in any one view: it is the thing that moves the
 * booking forward. `primary` is the solid ink button for everything else that
 * is a real action; `outline` and `ghost` are for actions that are available
 * but not being recommended.
 *
 * See docs/design-system.md §Controls.
 */
const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-sans text-[0.8125rem] font-semibold uppercase tracking-[0.11em]',
    'transition-[background-color,color,border-color,opacity,transform] duration-[--dur-fast] ease-[--ease-out]',
    'active:translate-y-px motion-reduce:active:translate-y-0',
    'disabled:pointer-events-none disabled:opacity-40 disabled:active:translate-y-0',
    'select-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
    // Bengali has no case and its conjuncts lose their shape when tracked out.
    '[&:lang(bn)]:tracking-normal',
  ].join(' '),
  {
    variants: {
      variant: {
        /** The one action that moves a booking forward. */
        /*
         * Both filled variants invert to the *other* fill on hover — vermilion
         * to ink, ink to vermilion — rather than tinting themselves. A tint has
         * to be checked for contrast at every step; a swap between two colours
         * that each already carry a guaranteed contrast pair cannot drift.
         */
        accent: 'bg-accent text-accent-contrast hover:bg-content hover:text-surface',
        /** Every other real action. */
        primary: 'bg-content text-surface hover:bg-accent hover:text-accent-contrast',
        outline:
          'border-2 border-content bg-transparent text-content hover:bg-content hover:text-surface',
        subtle:
          'border-2 border-transparent bg-content/[0.07] text-content hover:border-content hover:bg-transparent',
        ghost: 'bg-transparent text-content hover:bg-content/[0.08] active:bg-content/[0.12]',
        link: 'bg-transparent text-content underline decoration-accent decoration-2 underline-offset-[6px] hover:text-accent',
        danger: 'bg-danger text-white hover:bg-danger/85 active:bg-danger',
      },
      size: {
        sm: 'h-9 px-3.5 text-[0.6875rem] [&_svg]:size-4',
        md: 'h-11 px-5 [&_svg]:size-4',
        lg: 'h-14 px-7 text-[0.875rem] [&_svg]:size-5',
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
