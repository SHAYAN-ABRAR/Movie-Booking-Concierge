import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hashString } from '@/lib/deterministic';

/**
 * Lost-property reports and ticket-cover claim drafts.
 *
 * Both are *drafts*. This application has no backend, so nothing here is
 * submitted, sent, queued or seen by anyone. Each record is stored in this
 * browser only, with the customer's explicit consent, and exists so it can be
 * copied into an email or read down a phone.
 *
 * The types are deliberately shaped so a real submission adapter could be
 * added later without changing the customer-facing flow — but no dead
 * "submit" control is exposed while none exists.
 */

export type LostItemCategory =
  | 'phone'
  | 'wallet-or-purse'
  | 'keys'
  | 'bag'
  | 'clothing'
  | 'glasses'
  | 'jewellery'
  | 'documents'
  | 'child-item'
  | 'other';

export const lostItemCategoryLabels: Record<LostItemCategory, string> = {
  phone: 'Phone',
  'wallet-or-purse': 'Wallet or purse',
  keys: 'Keys',
  bag: 'Bag or backpack',
  clothing: 'Clothing',
  glasses: 'Glasses',
  jewellery: 'Jewellery',
  documents: 'Documents',
  'child-item': "Child's item",
  other: 'Something else',
};

export interface LostItemReport {
  id: string;
  createdAt: string;
  /** Local booking reference, where the customer had one. */
  bookingReference: string | null;
  cinemaId: string;
  date: string;
  time: string;
  screenName: string;
  seatIds: string[];
  category: LostItemCategory;
  description: string;
  lastSeen: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  /** Always 'draft'. There is nothing to submit it to. */
  status: 'draft';
}

export type ClaimReason = 'illness' | 'transport' | 'bereavement' | 'work' | 'weather';

export interface ClaimDraft {
  id: string;
  createdAt: string;
  bookingReference: string;
  reason: ClaimReason;
  /** A short free-text note. No medical detail is requested or stored. */
  note: string;
  contactEmail: string;
  checklist: Array<{ id: string; label: string; done: boolean }>;
  /** Always 'draft' — no claim has been submitted or assessed. */
  status: 'draft';
}

interface ReportsState {
  lostItems: LostItemReport[];
  claims: ClaimDraft[];
  addLostItem: (report: Omit<LostItemReport, 'id' | 'createdAt' | 'status'>) => LostItemReport;
  removeLostItem: (id: string) => void;
  addClaim: (claim: Omit<ClaimDraft, 'id' | 'createdAt' | 'status'>) => ClaimDraft;
  updateClaimChecklist: (id: string, itemId: string, done: boolean) => void;
  removeClaim: (id: string) => void;
  clearAll: () => void;
}

let sequence = 0;
function makeReportId(prefix: string, seed: string): string {
  sequence += 1;
  const code = hashString(`${seed}|${sequence}|${Date.now()}`).toString(36).toUpperCase().slice(0, 5);
  return `${prefix}-${code}`;
}

export const useReports = create<ReportsState>()(
  persist(
    (set) => ({
      lostItems: [],
      claims: [],

      addLostItem: (input) => {
        const report: LostItemReport = {
          ...input,
          id: makeReportId('LF', `${input.cinemaId}|${input.date}`),
          createdAt: new Date().toISOString(),
          status: 'draft',
        };
        set((state) => ({ lostItems: [report, ...state.lostItems] }));
        return report;
      },

      removeLostItem: (id) =>
        set((state) => ({ lostItems: state.lostItems.filter((r) => r.id !== id) })),

      addClaim: (input) => {
        const claim: ClaimDraft = {
          ...input,
          id: makeReportId('TC', input.bookingReference),
          createdAt: new Date().toISOString(),
          status: 'draft',
        };
        set((state) => ({ claims: [claim, ...state.claims] }));
        return claim;
      },

      updateClaimChecklist: (id, itemId, done) =>
        set((state) => ({
          claims: state.claims.map((claim) =>
            claim.id === id
              ? {
                  ...claim,
                  checklist: claim.checklist.map((item) =>
                    item.id === itemId ? { ...item, done } : item,
                  ),
                }
              : claim,
          ),
        })),

      removeClaim: (id) => set((state) => ({ claims: state.claims.filter((c) => c.id !== id) })),

      clearAll: () => set({ lostItems: [], claims: [] }),
    }),
    {
      name: 'nokshi.reports.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const claimChecklistTemplate = [
  { id: 'reference', label: 'Have your booking reference to hand' },
  { id: 'reason', label: 'Note which of the covered reasons applies' },
  { id: 'evidence', label: 'Gather anything that supports it (a ticket, a message, a receipt)' },
  { id: 'window', label: 'Check you are inside the 14-day claim window' },
  { id: 'send', label: 'Email or call Ticket Cover using the details below' },
];

/** A plain-text summary the customer can copy into an email. */
export function lostItemSummary(
  report: LostItemReport,
  context: { cinemaName: string; movieTitle: string },
): string {
  return [
    `Lost property report — draft ${report.id}`,
    '',
    `Cinema:      ${context.cinemaName}`,
    `Film:        ${context.movieTitle}`,
    `Date:        ${report.date}`,
    `Time:        ${report.time}`,
    `Screen:      ${report.screenName}`,
    report.seatIds.length ? `Seat(s):     ${report.seatIds.join(', ')}` : null,
    report.bookingReference ? `Booking:     ${report.bookingReference}` : null,
    '',
    `Item:        ${lostItemCategoryLabels[report.category]}`,
    `Description: ${report.description}`,
    report.lastSeen ? `Last seen:   ${report.lastSeen}` : null,
    '',
    `Contact:     ${report.contactName}`,
    `Email:       ${report.contactEmail}`,
    report.contactPhone ? `Phone:       ${report.contactPhone}` : null,
    '',
    'This report was prepared in the Nokshi Cinemas demonstration site and has',
    'not been submitted to anyone. Please treat this message as the report.',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}
