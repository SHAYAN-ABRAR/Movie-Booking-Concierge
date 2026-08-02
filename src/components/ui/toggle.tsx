import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer grid size-5 shrink-0 place-items-center rounded-xs border border-hairline-strong bg-surface-raised',
        'transition-colors duration-[--dur-fast]',
        'hover:border-content/50',
        'data-[state=checked]:border-content data-[state=checked]:bg-content data-[state=checked]:text-surface',
        'data-[state=indeterminate]:border-content data-[state=indeterminate]:bg-content data-[state=indeterminate]:text-surface',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-items-center text-current">
        {props.checked === 'indeterminate' ? (
          <Minus className="size-3.5" aria-hidden="true" />
        ) : (
          <Check className="size-3.5" aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />;
});

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-stub border border-hairline-strong bg-surface-raised',
        'transition-colors duration-[--dur-fast] hover:border-content/50',
        'data-[state=checked]:border-content',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="block size-2.5 rounded-stub bg-content" />
    </RadioGroupPrimitive.Item>
  );
});

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-stub border border-hairline-strong p-0.5',
        'transition-colors duration-[--dur-base] ease-[--ease-out]',
        'data-[state=checked]:border-content data-[state=checked]:bg-content',
        'data-[state=unchecked]:bg-surface-sunken',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-4 rounded-stub bg-surface-raised',
          'transition-transform duration-[--dur-base] ease-[--ease-out]',
          'data-[state=checked]:translate-x-5 data-[state=checked]:bg-surface',
          'data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-content-faint',
        )}
      />
    </SwitchPrimitive.Root>
  );
});

/**
 * A filter chip built on a real checkbox, so it is reachable by keyboard,
 * announced with its state, and usable without a mouse.
 */
interface FilterChipProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  count?: number;
}

export function FilterChip({
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
  count,
}: FilterChipProps) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-2 rounded-sm border px-3 py-1.5',
        'text-[0.8125rem] font-medium transition-colors duration-[--dur-fast]',
        checked
          ? 'border-content bg-content text-surface'
          : 'border-hairline-strong bg-transparent text-content hover:bg-content/[0.06]',
        disabled ? 'cursor-not-allowed opacity-40' : '',
        'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
        className,
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span>{children}</span>
      {count !== undefined ? (
        <span className={cn('numeral text-[0.6875rem]', checked ? 'opacity-70' : 'text-content-faint')}>
          {count}
        </span>
      ) : null}
    </label>
  );
}
