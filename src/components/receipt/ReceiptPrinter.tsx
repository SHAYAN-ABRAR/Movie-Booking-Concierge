import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RECEIPT_FEED_MS } from './useReceiptPrinterStage';

/**
 * The box-office printer.
 *
 * A thermal printer that feeds a ticket out of a slot, line by line, the way
 * the machine at a real counter does. It exists for one moment in the product —
 * the instant a booking completes — and it is the only skeuomorphic object in
 * a system that is otherwise flat and typographic. That is the point: the
 * reward at the end of a transaction is allowed to be a physical thing.
 *
 * Two rules keep it honest:
 *
 *   1. **It never gates content.** The ticket is in the DOM, complete and
 *      readable, from the first frame. The animation moves it; it does not
 *      reveal it. Under reduced motion, or on any visit that is not the moment
 *      of purchase, the paper is simply already out.
 *   2. **It is not the ticket.** The machine is chrome and is hidden in print;
 *      the paper is the deliverable and prints on its own.
 *
 * Composed rather than configured — `Root` holds the stage, everything else
 * reads it from context, and the caller decides what goes on the screen and
 * what gets printed.
 */

export type ReceiptPrinterStage = 'processing' | 'printing' | 'complete';
export type ReceiptFeedMotion = 'smooth' | 'stepped';

type ReceiptPrinterContextValue = {
  animate: boolean;
  feedMotion: ReceiptFeedMotion;
  /** Animation is wanted *and* the customer has not asked for less of it. */
  shouldMove: boolean;
  stage: ReceiptPrinterStage;
};

const ReceiptPrinterContext = createContext<ReceiptPrinterContextValue | null>(null);

function useReceiptPrinter(component: string): ReceiptPrinterContextValue {
  const context = useContext(ReceiptPrinterContext);
  if (!context) throw new Error(`${component} must be used inside ReceiptPrinter.Root.`);
  return context;
}

const easeOut = [0.16, 1, 0.3, 1] as const;
const easeInOut = [0.65, 0, 0.35, 1] as const;

/* ── The tear ──────────────────────────────────────────────────────────────
 * A receipt is torn against a serrated bar, so its bottom edge is a row of
 * teeth rather than a straight line. Drawn as a clip-path polygon: no image,
 * no extra element, and it survives any paper height.
 * ───────────────────────────────────────────────────────────────────────── */
const TOOTH_COUNT = 40;
const TOOTH_DEPTH = 4;
const toothPoints = Array.from({ length: TOOTH_COUNT * 2 }, (_, index) => {
  const x = 100 - ((index + 1) * 100) / (TOOTH_COUNT * 2);
  const y = index % 2 === 0 ? '100%' : `calc(100% - ${TOOTH_DEPTH}px)`;
  return `${x}% ${y}`;
}).join(', ');
const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${TOOTH_DEPTH}px), ${toothPoints})`;

/* ── The feed ──────────────────────────────────────────────────────────────
 * Ten advance-and-hold pairs. A thermal head prints a band, the stepper motor
 * advances the paper, and it holds while the next band prints — so the paper
 * arrives in visible increments rather than gliding out. Expressed as `y`
 * percentages rather than a `transform` string, because Framer Motion resolves
 * percentage `y` against the element's own height and can interpolate it.
 * ───────────────────────────────────────────────────────────────────────── */
const steppedFeed = [
  '-100%', '-91%', '-91%', '-81%', '-81%', '-70%', '-70%', '-58%', '-58%', '-45%',
  '-45%', '-32%', '-32%', '-20%', '-20%', '-10%', '-10%', '-3%', '-3%', '0%',
];

const steppedFeedTimes = [
  0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6, 0.63,
  0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
];

/* ══════════════════════════════════════════════════════════════════════════
   Root
   ══════════════════════════════════════════════════════════════════════════ */

export type ReceiptPrinterRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  /** Disables every stage transition when false. */
  animate?: boolean;
  children: ReactNode;
  /** Continuous glide, or one line at a time. */
  feedMotion?: ReceiptFeedMotion;
  stage: ReceiptPrinterStage;
};

export function ReceiptPrinterRoot({
  animate = true,
  children,
  className,
  feedMotion = 'stepped',
  stage,
  ...props
}: ReceiptPrinterRootProps) {
  const reduced = useReducedMotion();

  return (
    <ReceiptPrinterContext.Provider
      value={{ animate, feedMotion, shouldMove: animate && !reduced, stage }}
    >
      <div
        className={cn('relative isolate flex w-full max-w-sm flex-col items-center', className)}
        data-stage={stage}
        {...props}
      >
        {children}
      </div>
    </ReceiptPrinterContext.Provider>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Machine — the housing
   ══════════════════════════════════════════════════════════════════════════ */

export function ReceiptPrinterMachine({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-print="hide"
      className={cn(
        'relative isolate z-10 w-full overflow-hidden border-2 border-content bg-surface-sunken',
        'p-3 pb-7',
        // The moulding: a hairline highlight along the top edge and a shadow
        // along the bottom. Two 1px rules, no gradient, no bevel.
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-0 before:h-px',
        "before:bg-content/10 before:content-['']",
        className,
      )}
      {...props}
    >
      {/* Casing grain. The same turbulence the page uses, so the machine is
          made of the same material as everything else. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.045] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {children}

      {/* The slot the paper comes out of. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-3 bottom-3 z-40 block h-2 bg-content"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Header · Screen — the fascia
   ══════════════════════════════════════════════════════════════════════════ */

export function ReceiptPrinterHeader({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('relative z-10 mb-3 flex items-center justify-between gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ReceiptPrinterScreen({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        // `.auditorium` rather than a bespoke dark panel: a lit display in a
        // dark housing is the same material the seat map is made of, and it is
        // dark in both themes for the same reason.
        'auditorium relative isolate z-10 overflow-hidden border-2 border-content p-4',
        className,
      )}
      {...props}
    >
      {/* Scanlines. One repeating gradient, held well back. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-[0.12]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--content) 0 1px, transparent 1px 3px)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Status
   ══════════════════════════════════════════════════════════════════════════ */

function StatusIndicator({
  animate,
  move,
  stage,
}: {
  animate: boolean;
  move: boolean;
  stage: ReceiptPrinterStage;
}) {
  const complete = stage === 'complete';
  const enter = {
    initial: { opacity: animate ? 0 : 1, scale: move ? 0.94 : 1 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: animate ? 0 : 1, scale: move ? 0.96 : 1 },
    transition: { duration: animate ? 0.16 : 0, ease: easeOut },
  };

  return (
    <span aria-hidden="true" className="relative grid size-4 shrink-0 place-items-center">
      <AnimatePresence initial={false} mode="sync">
        {complete ? (
          <m.span key="complete" className="col-start-1 row-start-1 text-accent" {...enter}>
            <Check className="size-4" strokeWidth={3} />
          </m.span>
        ) : (
          <m.span
            key="working"
            className="col-start-1 row-start-1 text-content-muted"
            {...enter}
          >
            <LoaderCircle
              className={cn('size-4', animate && 'animate-spin motion-reduce:animate-none')}
            />
          </m.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export type ReceiptPrinterStatusProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  /** Custom status copy. Defaults to a label derived from the stage. */
  children?: ReactNode;
};

export function ReceiptPrinterStatus({ children, className, ...props }: ReceiptPrinterStatusProps) {
  const { animate, shouldMove, stage } = useReceiptPrinter('ReceiptPrinter.Status');
  const { t } = useTranslation();

  const label = {
    processing: t('receipt.processing'),
    printing: t('receipt.printing'),
    complete: t('receipt.complete'),
  }[stage];

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)} {...props}>
      <StatusIndicator animate={animate} move={shouldMove} stage={stage} />
      <div aria-live="polite" role="status" className="grid min-w-0 flex-1 items-center">
        <AnimatePresence initial={false} mode="sync">
          <m.p
            key={stage}
            className="eyebrow col-start-1 row-start-1 truncate text-content-muted"
            initial={{ opacity: animate ? 0 : 1, y: shouldMove ? 4 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: animate ? 0 : 1, y: shouldMove ? -4 : 0 }}
            transition={{ duration: animate ? 0.18 : 0, ease: easeOut }}
          >
            {children ?? label}
          </m.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Output · Paper
   ══════════════════════════════════════════════════════════════════════════ */

export function ReceiptPrinterOutput({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const { animate, feedMotion, shouldMove, stage } = useReceiptPrinter('ReceiptPrinter.Output');
  const out = stage !== 'processing';
  const stepped = feedMotion === 'stepped' && stage === 'printing' && shouldMove;

  return (
    <div
      data-receipt="output"
      className={cn('relative z-0 -mt-5 w-[calc(100%-1.5rem)] overflow-hidden px-1', className)}
      {...props}
    >
      {/* The shadow the slot's lip casts onto the emerging paper. */}
      {out ? (
        <span
          aria-hidden="true"
          data-print="hide"
          className="pointer-events-none absolute inset-x-1 top-0 z-20 block h-3 bg-gradient-to-b from-content/35 to-transparent"
        />
      ) : null}

      <m.div
        className="relative"
        initial={false}
        animate={{
          opacity: out ? 1 : 0,
          y: stage === 'printing' && shouldMove ? (stepped ? steppedFeed : '0%') : out || !shouldMove ? '0%' : '-100%',
        }}
        transition={{
          opacity: { duration: animate ? 0.16 : 0, ease: easeOut },
          y: {
            duration: shouldMove ? RECEIPT_FEED_MS / 1000 : 0,
            ease: stepped ? 'linear' : easeInOut,
            times: stepped ? steppedFeedTimes : undefined,
          },
        }}
      >
        {children}
      </m.div>
    </div>
  );
}

export function ReceiptPrinterPaper({
  children,
  className,
  style,
  ...props
}: ComponentPropsWithoutRef<'article'>) {
  return (
    <article
      data-print="page"
      data-receipt="paper"
      className={cn(
        // Thermal paper is a fixed material: bone stock, black print, in both
        // themes and on a printer. It does not follow the page's appearance
        // any more than a real receipt would — which is also why it takes the
        // *raised* stock rather than the page's own, so the roll reads as a
        // separate object in light mode instead of dissolving into the page.
        'relative bg-paper-raised px-5 pb-7 pt-6 font-mono text-ink',
        // The cut edges of the roll.
        'border-x border-paper-edge',
        className,
      )}
      style={{ clipPath: receiptClipPath, ...style }}
      {...props}
    >
      {/* Thermal banding — the faint horizontal grain of a printed roll. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #111113 0 1px, transparent 1px 4px)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   The stage machine
   ══════════════════════════════════════════════════════════════════════════ */
