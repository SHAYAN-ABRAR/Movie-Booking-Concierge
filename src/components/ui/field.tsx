import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        // Every label in the product speaks in the same small, tracked voice as
        // the section eyebrows, so a form reads as part of the programme rather
        // than as a web form dropped into it.
        'block font-sans text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-content',
        '[&:lang(bn)]:text-[0.8125rem] [&:lang(bn)]:tracking-normal',
        'peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

const controlBase = [
  'w-full border-2 border-hairline-strong bg-surface-raised px-3',
  'font-sans text-[0.9375rem] text-content placeholder:text-content-faint',
  'transition-colors duration-[--dur-fast]',
  'hover:border-content focus:border-content',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-wash/40',
].join(' ');

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return <input ref={ref} type={type} className={cn(controlBase, 'h-11', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(controlBase, 'py-2.5 leading-6', className)} {...props} />;
});

export function FieldHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[0.8125rem] leading-5 text-content-muted', className)} {...props} />;
}

/**
 * Errors are announced politely rather than assertively: a form with several
 * invalid fields should not interrupt the screen reader four times over.
 */
export function FieldError({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return (
    <p
      role="status"
      className={cn(
        'flex items-start gap-1.5 text-[0.8125rem] font-medium leading-5 text-danger',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="mt-[0.35em] block size-1.5 shrink-0 bg-danger" />
      <span>{children}</span>
    </p>
  );
}

interface FieldProps {
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Label, control, hint and error wired together with the right aria plumbing. */
export function Field({ label, htmlFor, hint, error, optional, children, className }: FieldProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional ? (
          <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-content-faint">
            {t('common.labels.optional')}
          </span>
        ) : null}
      </div>
      {children}
      {hint && !error ? <FieldHint id={`${htmlFor}-hint`}>{hint}</FieldHint> : null}
      {error ? <FieldError id={`${htmlFor}-error`}>{error}</FieldError> : null}
    </div>
  );
}
