import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useReducedMotion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Hold to confirm.
 *
 * A destructive action that cannot be taken by a single click. The customer
 * has to hold the control down while a fill sweeps across it, and letting go
 * early cancels — so the commitment is continuous rather than a yes/no they
 * can hit by reflex.
 *
 * It is paired with `UndoNotice` rather than used alone. A hold guards against
 * the accidental press; the undo window guards against the deliberate press
 * that turns out to be a mistake. Neither covers the other.
 *
 * The interaction has more edge cases than it looks:
 *
 *   - Pointer capture, so dragging off the button still delivers the release.
 *   - A boundary check with slack, so a small wobble does not cancel but
 *     genuinely leaving the control does.
 *   - Enter and Space hold too, with `repeat` ignored so key auto-repeat does
 *     not restart the timer.
 *   - Blur and lost capture both cancel, because a hold you cannot see is a
 *     hold you did not agree to.
 *
 * Under reduced motion the fill arrives instantly instead of sweeping — but
 * the hold still takes the full duration. The delay is the safety mechanism;
 * only its animation is decoration.
 */

type HoldStatus = 'idle' | 'holding' | 'confirmed';
export type ConfirmationInput = 'pointer' | 'keyboard';

export type HoldToConfirmProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'onClick'
> & {
  children?: ReactNode;
  /** Replaces the label once confirmed. */
  confirmedContent?: ReactNode;
  /** How long the hold must be sustained, in milliseconds. */
  duration?: number;
  onConfirm: (input: ConfirmationInput) => void;
  /** Return to idle this long after confirming. `0` stays confirmed. */
  resetAfter?: number;
  /** `sm` for use inside a panel, where a full-size control would dominate. */
  size?: 'sm' | 'md';
};

export function HoldToConfirm({
  children,
  className,
  confirmedContent,
  disabled,
  duration = 1600,
  onConfirm,
  resetAfter = 0,
  size = 'md',
  ...buttonProps
}: HoldToConfirmProps) {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const confirmTimer = useRef<number | null>(null);
  const resetTimer = useRef<number | null>(null);
  const activePointer = useRef<number | null>(null);
  const inputMode = useRef<ConfirmationInput>('pointer');
  const holding = useRef(false);
  const [status, setStatus] = useState<HoldStatus>('idle');
  const reduced = useReducedMotion();

  const clearConfirmTimer = useCallback(() => {
    if (confirmTimer.current === null) return;
    window.clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
  }, []);

  const complete = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    activePointer.current = null;
    clearConfirmTimer();
    setStatus('confirmed');
    onConfirm(inputMode.current);

    if (resetAfter > 0) {
      resetTimer.current = window.setTimeout(() => {
        setStatus('idle');
        resetTimer.current = null;
      }, resetAfter);
    }
  }, [clearConfirmTimer, onConfirm, resetAfter]);

  const cancel = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    activePointer.current = null;
    clearConfirmTimer();
    setStatus('idle');
  }, [clearConfirmTimer]);

  const start = useCallback(
    (input: ConfirmationInput) => {
      if (disabled || status === 'confirmed' || holding.current) return;
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
      inputMode.current = input;
      holding.current = true;
      setStatus('holding');
      confirmTimer.current = window.setTimeout(complete, duration);
    },
    [complete, disabled, duration, status],
  );

  useEffect(
    () => () => {
      clearConfirmTimer();
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [clearConfirmTimer],
  );

  useEffect(() => {
    if (disabled) cancel();
  }, [cancel, disabled]);

  function releaseCapture(pointerId: number) {
    const button = buttonRef.current;
    try {
      if (button?.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
    } catch {
      // The pointer is already gone. Nothing to release, nothing to report.
    }
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || disabled) return;
    activePointer.current = event.pointerId;
    // Capture is an optimisation — it keeps the release coming to us if the
    // pointer wanders off the control. It is not required for the hold to
    // work, and it throws on a pointer the browser no longer considers
    // active, so a failure here must not take the interaction down with it.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* proceed without capture */
    }
    start('pointer');
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!holding.current || activePointer.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // Slack, so a small wobble during a 1.6s hold is not read as leaving.
    const slack = 8;
    const outside =
      event.clientX < rect.left - slack ||
      event.clientX > rect.right + slack ||
      event.clientY < rect.top - slack ||
      event.clientY > rect.bottom + slack;
    if (outside) {
      cancel();
      releaseCapture(event.pointerId);
    }
  }

  function onPointerEnd(event: PointerEvent<HTMLButtonElement>) {
    if (activePointer.current !== event.pointerId) return;
    cancel();
    releaseCapture(event.pointerId);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    start('keyboard');
  }

  function onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    cancel();
  }

  const confirmed = status === 'confirmed';
  const isHolding = status === 'holding';
  const label = children ?? t('confirmHold.hold');

  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      type="button"
      disabled={disabled}
      aria-busy={isHolding}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={cancel}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={cancel}
      className={cn(
        'relative isolate inline-flex touch-none select-none items-center justify-center overflow-hidden',
        'border-2 border-danger',
        size === 'sm' ? 'h-9 min-w-40 px-3 text-[0.6875rem]' : 'h-11 min-w-48 px-5 text-[0.8125rem]',
        'font-sans font-semibold uppercase tracking-[0.11em]',
        '[&:lang(bn)]:tracking-normal',
        'transition-colors duration-[--dur-fast] ease-[--ease-out]',
        'active:translate-y-px motion-reduce:active:translate-y-0',
        'disabled:pointer-events-none disabled:opacity-40',
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        confirmed ? 'bg-danger text-white' : 'bg-transparent text-danger',
        className,
      )}
    >
      {confirmed ? (
        <span className="relative flex items-center justify-center gap-2">
          {confirmedContent ?? (
            <>
              <Check strokeWidth={3} />
              {t('confirmHold.confirmed')}
            </>
          )}
        </span>
      ) : (
        <>
          <span className="relative flex items-center justify-center gap-2">{label}</span>
          {/*
           * The fill. A duplicate of the label on a solid ground, revealed by a
           * clip-path sweeping left to right.
           *
           * The progress runs for keyboard holds too. The reference this was
           * ported from suppressed it for keyboard, which left someone holding
           * Enter with no indication anything was happening — the one input
           * mode that most needs the feedback.
           */}
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-2 bg-danger text-white',
              size === 'sm' ? 'px-3' : 'px-5',
            )}
            style={{
              clipPath: isHolding ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transitionProperty: 'clip-path',
              transitionDuration: reduced ? '0ms' : isHolding ? `${duration}ms` : '180ms',
              transitionTimingFunction: isHolding ? 'linear' : 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {label}
          </span>
        </>
      )}
    </button>
  );
}

/**
 * The window in which a destructive action can be taken back.
 *
 * The countdown is drawn *into* the Undo control — the fill retreats as the
 * time runs out, so the thing you are about to lose and the time you have left
 * to keep it are the same object. It announces politely, so a screen reader
 * hears what happened without being interrupted.
 */
export function UndoNotice({
  className,
  duration = 6000,
  message,
  onExpire,
  onUndo,
}: {
  className?: string;
  duration?: number;
  message: string;
  onExpire: () => void;
  onUndo: () => void;
}) {
  const { t } = useTranslation();
  const [counting, setCounting] = useState(false);
  const reduced = useReducedMotion();

  /*
   * `onExpire` is held in a ref, and the effect depends only on `duration`.
   *
   * Callers pass an inline arrow, so the prop is a new function on every
   * parent render. Depending on it directly tore down and restarted the
   * countdown each time — the bar jumped back to full and the window silently
   * extended for as long as anything above kept re-rendering. The window has
   * to mean six seconds, so it is started once.
   */
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    // A frame before starting, or the transition has nothing to animate from.
    const frame = window.requestAnimationFrame(() => setCounting(true));
    const timer = window.setTimeout(() => expire.current(), duration);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-2 border-content bg-surface-raised px-4 py-3',
        className,
      )}
    >
      <p className="min-w-0 text-[0.9375rem] font-medium">{message}</p>

      <button
        type="button"
        onClick={onUndo}
        className={cn(
          'relative isolate inline-flex h-9 min-w-28 shrink-0 items-center justify-center overflow-hidden',
          'border-2 border-content px-3',
          'font-sans text-[0.6875rem] font-bold uppercase tracking-[0.12em]',
          '[&:lang(bn)]:tracking-normal',
          'transition-colors duration-[--dur-fast]',
          'active:translate-y-px motion-reduce:active:translate-y-0',
          '[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0',
        )}
      >
        <span className="relative flex items-center gap-1.5">
          <RotateCcw strokeWidth={2.5} />
          {t('confirmHold.undo')}
        </span>
        {/* The time remaining, retreating across the control. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center gap-1.5 bg-content px-3 text-surface"
          style={{
            clipPath: counting ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
            transitionProperty: 'clip-path',
            transitionDuration: reduced ? '0ms' : `${duration}ms`,
            transitionTimingFunction: 'linear',
          }}
        >
          <RotateCcw strokeWidth={2.5} />
          {t('confirmHold.undo')}
        </span>
      </button>
    </div>
  );
}
