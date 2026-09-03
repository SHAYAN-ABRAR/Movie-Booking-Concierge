import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ReceiptPrinterStage } from './ReceiptPrinter';

/** How long the paper takes to feed all the way out, in milliseconds. */
export const RECEIPT_FEED_MS = 1750;

/** How long the machine thinks before the head starts printing. */
const PROCESSING_MS = 620;

/**
 * Drives `processing → printing → complete` once, on mount.
 *
 * `enabled: false` lands on `complete` immediately and stays there — which is
 * what every visit that is *not* the moment of purchase gets. Reprinting a
 * ticket every time someone opens it from their bookings would be a toy.
 */
export function useReceiptPrinterStage(enabled: boolean): ReceiptPrinterStage {
  const reduced = useReducedMotion();
  const play = enabled && !reduced;
  const [stage, setStage] = useState<ReceiptPrinterStage>(play ? 'processing' : 'complete');

  useEffect(() => {
    if (!play) {
      setStage('complete');
      return;
    }
    const toPrinting = window.setTimeout(() => setStage('printing'), PROCESSING_MS);
    const toComplete = window.setTimeout(() => setStage('complete'), PROCESSING_MS + RECEIPT_FEED_MS);
    return () => {
      window.clearTimeout(toPrinting);
      window.clearTimeout(toComplete);
    };
  }, [play]);

  return stage;
}
