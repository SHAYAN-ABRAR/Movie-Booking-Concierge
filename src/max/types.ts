import type { MovieFilter } from '@/data';
import type {
  Format,
  Genre,
  Language,
  ScreeningAccessibility,
  TicketCategory,
} from '@/data/types';
import type { TicketCounts } from '@/lib/bookingMath';
import type { BookingStep } from '@/store/booking';
import type { LostItemCategory, ClaimReason } from '@/store/reports';
import type { WatchKind } from '@/store/watches';

/**
 * Max's typed contracts.
 *
 * Everything Max says and does is a typed value. Nothing in the application
 * parses Max's prose to decide what to do — an assistant reply is a list of
 * response blocks plus a list of typed actions, and the executor only ever
 * looks at the actions.
 */

/* ── Intents ───────────────────────────────────────────────────────── */

export type MaxIntent =
  | 'greeting'
  | 'capabilities'
  | 'find_movies'
  | 'find_showtimes'
  | 'compare_showtimes'
  | 'movie_info'
  | 'watch_trailer'
  | 'movie_story'
  | 'runtime_info'
  | 'apply_filters'
  | 'clear_filters'
  | 'price_explain'
  | 'budget_optimise'
  | 'seat_recommend'
  | 'seat_clear'
  | 'group_booking'
  | 'accessibility_query'
  | 'concession_recommend'
  | 'cinema_info'
  | 'policy_question'
  | 'booking_lookup'
  | 'late_arrival'
  | 'lost_item'
  | 'insurance_claim'
  | 'create_watch'
  | 'calendar'
  | 'start_booking'
  | 'contact'
  | 'clear_conversation'
  | 'unknown';

/* ── Entities ──────────────────────────────────────────────────────── */

export interface MaxEntities {
  movieIds: string[];
  cinemaIds: string[];
  genres: Genre[];
  languages: Language[];
  formats: Format[];
  accessibility: ScreeningAccessibility[];
  /** Resolved to an ISO date in the viewer's own time zone. */
  date?: string;
  /** How the date was expressed, for the "I read that as…" summary. */
  dateExpression?: string;
  /** Inclusive start-time floor, "HH:mm". */
  after?: string;
  /** Inclusive start-time ceiling, "HH:mm". */
  before?: string;
  timeExpression?: string;
  maxRuntime?: number;
  partySize?: number;
  ticketCounts?: Partial<TicketCounts>;
  budget?: number;
  seatPreference?: 'front' | 'middle' | 'back' | 'centre' | 'aisle';
  wheelchairSpaces?: number;
  companionSeats?: number;
  reducedWalking?: boolean;
  premium?: boolean;
  cheapest?: boolean;
  bookingReference?: string;
  lostItemCategory?: LostItemCategory;
  claimReason?: ClaimReason;
  watchKind?: WatchKind;
  dietary?: Array<'vegetarian' | 'vegan' | 'halal'>;
  avoidAllergens?: Array<'milk' | 'nuts' | 'peanuts' | 'gluten' | 'soy' | 'egg'>;
  ticketCategory?: TicketCategory;
}

export function emptyEntities(): MaxEntities {
  return {
    movieIds: [],
    cinemaIds: [],
    genres: [],
    languages: [],
    formats: [],
    accessibility: [],
  };
}

/* ── Parse result ──────────────────────────────────────────────────── */

export interface MaxParse {
  raw: string;
  normalised: string;
  language: 'en' | 'bn';
  intent: MaxIntent;
  /** 0–1. Below `CLARIFY_THRESHOLD` Max asks rather than guesses. */
  confidence: number;
  entities: MaxEntities;
  /** Human-readable list of what was understood, shown as removable chips. */
  readAs: Array<{ id: string; label: string; clears: keyof MaxEntities }>;
}

/* ── Actions ───────────────────────────────────────────────────────── */

export type MaxAction =
  | { type: 'navigate'; label: string; to: string }
  | { type: 'apply_filters'; label: string; filter: MovieFilter; to?: string }
  | { type: 'clear_filters'; label: string }
  | { type: 'select_cinema'; label: string; cinemaId: string }
  | { type: 'select_date'; label: string; date: string }
  | { type: 'start_booking'; label: string; movieSlug: string; showtimeId?: string }
  | {
      type: 'set_ticket_counts';
      label: string;
      counts: TicketCounts;
      confirm: MaxConfirmation;
    }
  | { type: 'propose_seats'; label: string; seatIds: string[] }
  | { type: 'apply_seats'; label: string; seatIds: string[]; confirm: MaxConfirmation }
  | { type: 'clear_seats'; label: string; confirm: MaxConfirmation }
  | {
      type: 'add_concessions';
      label: string;
      items: Array<{ itemId: string; quantity: number }>;
      confirm: MaxConfirmation;
    }
  | { type: 'remove_concession'; label: string; itemId: string; confirm: MaxConfirmation }
  | { type: 'open_booking'; label: string; reference: string }
  | { type: 'download_ics'; label: string; reference: string }
  | { type: 'create_watch'; label: string; kind: WatchKind; showtimeId: string; partySize?: number }
  | { type: 'remove_watch'; label: string; watchId: string }
  | { type: 'save_lost_report'; label: string; draft: LostReportDraft; confirm: MaxConfirmation }
  | { type: 'save_claim_draft'; label: string; bookingReference: string; reason: ClaimReason }
  | { type: 'copy_text'; label: string; text: string }
  | { type: 'open_mail'; label: string; to: string; subject: string; body: string }
  | { type: 'call'; label: string; phone: string }
  | { type: 'focus_field'; label: string; fieldId: string; confirm: MaxConfirmation }
  | { type: 'clear_conversation'; label: string }
  /*
   * Opens the film's verified trailer dialog.
   *
   * Carries the movie id, never a URL or a video id — Max hands over the film
   * and the player looks up the trailer from the same catalogue record every
   * other surface reads. That is what makes it impossible for Max to invent a
   * trailer or open an unofficial one: there is nowhere in this action to put
   * a video Max made up.
   *
   * Playback still requires the user to activate the action; Max never starts
   * a video on its own.
   */
  | { type: 'watch_trailer'; label: string; movieId: string }
  | { type: 'open_movie_details'; label: string; movieId: string };

export interface MaxConfirmation {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
}

export interface LostReportDraft {
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
}

/* ── Response blocks ───────────────────────────────────────────────── */

export type MaxBlock =
  | { kind: 'text'; text: string; tone?: 'default' | 'caution' }
  | { kind: 'read-as'; chips: MaxParse['readAs'] }
  | { kind: 'movies'; movieIds: string[]; note?: string }
  | { kind: 'showtimes'; showtimeIds: string[]; note?: string; showCinema?: boolean }
  | {
      kind: 'seats';
      showtimeId: string;
      seatIds: string[];
      total: number;
      split: boolean;
      groups: Array<{ row: string; seatIds: string[] }>;
      reasons: string[];
    }
  | {
      kind: 'price';
      title: string;
      lines: Array<{ label: string; amount: number }>;
      total: number;
      footnote?: string;
    }
  | { kind: 'concessions'; itemIds: string[]; note?: string }
  | { kind: 'booking'; reference: string }
  | { kind: 'watches'; watchIds: string[] }
  | { kind: 'facts'; title: string; rows: Array<{ label: string; value: string }> }
  | { kind: 'checklist'; title: string; items: string[]; note?: string }
  | { kind: 'contact'; cinemaId?: string; email?: string; phone?: string; note?: string }
  | { kind: 'demo-note'; text: string }
  | { kind: 'spoiler'; summary: string; detail: string }
  /*
   * The short, spoiler-free story for one film. Renders the same panel the
   * booking surfaces use, so what Max shows and what the page shows cannot
   * drift apart.
   */
  | { kind: 'movie-story'; movieId: string };

/* ── Messages ──────────────────────────────────────────────────────── */

export interface MaxMessage {
  id: string;
  role: 'user' | 'assistant';
  /** The plain text of the message, used for the transcript and screen readers. */
  text: string;
  blocks?: MaxBlock[];
  actions?: MaxAction[];
  /** A concise clarification, when Max is not confident enough to act. */
  clarify?: { question: string; options: Array<{ label: string; reply: string }> };
  createdAt: number;
  /** Which provider produced it, shown in the transcript's footer. */
  source?: 'local' | 'ollama';
}

export interface MaxReply {
  text: string;
  blocks: MaxBlock[];
  actions: MaxAction[];
  clarify?: MaxMessage['clarify'];
  source: 'local' | 'ollama';
}

/* ── Context ───────────────────────────────────────────────────────── */

/**
 * What Max can see. Assembled fresh on every turn from the router and the
 * stores. Nothing private or internal is exposed to the customer through it.
 */
export interface MaxContext {
  route: string;
  /** The film being viewed, if any. */
  movieId: string | null;
  cinemaId: string | null;
  date: string | null;
  showtimeId: string | null;
  activeFilter: MovieFilter;
  booking: {
    step: BookingStep | null;
    movieId: string | null;
    showtimeId: string | null;
    counts: TicketCounts;
    seatIds: string[];
    concessions: Record<string, number>;
    insurance: boolean;
    subtotal: number;
    /** Whatever the wizard is currently refusing to move past. */
    blocker: string | null;
  };
  localBookings: string[];
  watchIds: string[];
  accessibilityPreferences: {
    wheelchair: boolean;
    openCaptions: boolean;
    reducedWalking: boolean;
    audioDescription: boolean;
  };
  now: Date;
}

/* ── Provider contract ─────────────────────────────────────────────── */

export interface MaxProviderInput {
  parse: MaxParse;
  context: MaxContext;
  /** The last few turns, for pronoun and follow-up resolution. */
  history: MaxMessage[];
}

/**
 * A source of replies.
 *
 * `LocalMaxAssistantProvider` is the only provider that produces application
 * behaviour. Any other provider may only rephrase text that the local provider
 * has already produced — it can never invent an action, a price or a showtime.
 */
export interface MaxAssistantProvider {
  readonly id: 'local' | 'ollama';
  readonly label: string;
  respond(input: MaxProviderInput): Promise<MaxReply>;
}

export const CLARIFY_THRESHOLD = 0.45;
