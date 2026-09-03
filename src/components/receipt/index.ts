/**
 * The compound namespace.
 *
 * It lives here rather than beside the components because a module that
 * exports both components and a plain object is not hot-reloadable — every
 * component in it gets flagged. Splitting the assembly into a `.ts` file keeps
 * `ReceiptPrinter.tsx` exporting nothing but components and types.
 */
export {
  ReceiptPrinterHeader,
  ReceiptPrinterMachine,
  ReceiptPrinterOutput,
  ReceiptPrinterPaper,
  ReceiptPrinterRoot,
  ReceiptPrinterScreen,
  ReceiptPrinterStatus,
} from './ReceiptPrinter';

export type {
  ReceiptFeedMotion,
  ReceiptPrinterRootProps,
  ReceiptPrinterStage,
  ReceiptPrinterStatusProps,
} from './ReceiptPrinter';

export { RECEIPT_FEED_MS, useReceiptPrinterStage } from './useReceiptPrinterStage';

import {
  ReceiptPrinterHeader,
  ReceiptPrinterMachine,
  ReceiptPrinterOutput,
  ReceiptPrinterPaper,
  ReceiptPrinterRoot,
  ReceiptPrinterScreen,
  ReceiptPrinterStatus,
} from './ReceiptPrinter';

export const ReceiptPrinter = {
  Header: ReceiptPrinterHeader,
  Machine: ReceiptPrinterMachine,
  Output: ReceiptPrinterOutput,
  Paper: ReceiptPrinterPaper,
  Root: ReceiptPrinterRoot,
  Screen: ReceiptPrinterScreen,
  Status: ReceiptPrinterStatus,
};
