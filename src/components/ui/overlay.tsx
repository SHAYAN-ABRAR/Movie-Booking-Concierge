import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Dialogs and sheets share Radix's dialog behaviour — focus trap, scroll lock,
 * escape handling, `aria-modal` — and differ only in how they arrive.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

const Overlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function Overlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('o-fade fixed inset-0 z-50 bg-ink/70', className)}
      {...props}
    />
  );
});

export const DialogOverlay = Overlay;

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Renders the built-in close button. Set false when supplying your own. */
  showClose?: boolean;
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, showClose = true, ...props }, ref) {
  const { t } = useTranslation();
  return (
    <DialogPortal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'o-pop fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
          'max-h-[calc(100dvh-2rem)] overflow-y-auto',
          'border-2 border-content bg-surface-raised p-6 text-content',
          'focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-3 top-3 grid size-9 place-items-center',
              'text-content-muted transition-colors hover:bg-content hover:text-surface',
            )}
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">{t('common.actions.close')}</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1.5 pr-10', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('font-display text-2xl uppercase leading-none text-content', className)}
      {...props}
    />
  );
});

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm leading-6 text-content-muted', className)}
      {...props}
    />
  );
});

/* ── Sheet ─────────────────────────────────────────────────────────────── */

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'left' | 'right' | 'bottom';
  showClose?: boolean;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent({ className, children, side = 'right', showClose = true, ...props }, ref) {
  const { t } = useTranslation();
  const sides = {
    right: 'o-slide-right inset-y-0 right-0 h-dvh w-[min(28rem,100vw-2rem)] border-l-2',
    left: 'o-slide-left inset-y-0 left-0 h-dvh w-[min(24rem,100vw-2rem)] border-r-2',
    bottom: 'o-slide-bottom inset-x-0 bottom-0 max-h-[88dvh] border-t-2',
  } as const;

  return (
    <DialogPortal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col border-content bg-surface text-content focus:outline-none',
          sides[side],
          side === 'bottom' ? 'pb-[max(1rem,var(--safe-b))]' : '',
          className,
        )}
        {...props}
      >
        {side === 'bottom' ? (
          <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-stub bg-hairline-strong" />
        ) : null}
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-3 top-3 grid size-11 place-items-center',
              'text-content-muted transition-colors hover:bg-content hover:text-surface',
            )}
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">{t('common.actions.close')}</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
