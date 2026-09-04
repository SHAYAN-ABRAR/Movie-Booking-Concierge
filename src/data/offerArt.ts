import { offers } from './offers';

/**
 * Offer art direction.
 *
 * Offers are not films, so they do not get the film artwork families. They get
 * the cinema's *stationery* — the printed things a box office actually hands
 * you. Five compositions, one per offer, each structurally different: a torn
 * stub, a perforated pass, film leader, a folded insert, a membership card.
 *
 * This is visual metadata only. Nothing here affects which offers exist, when
 * they run, where they run, or what they are worth — that all lives in
 * `offers.ts`, and this file is deliberately separate for that reason.
 *
 * `figure` and `figureNote` are the one number each offer is really about. Both
 * are transcribed from that offer's own `mechanic` string and must stay true to
 * it; the composition prints the offer's value, it does not invent one.
 */

export type OfferComposition =
  | 'stub' // A ticket stub torn from the book, punched through
  | 'pass' // A perforated strip of admissions
  | 'leader' // Academy film leader, counting down to a late show
  | 'insert' // A folded programme insert, quiet by design
  | 'card'; // A membership card with a signature strip

export interface OfferArt {
  composition: OfferComposition;
  /** Field colour. */
  ground: string;
  /** Geometry and rules drawn on the field. */
  ink: string;
  /** The one bright note, used once per composition. */
  accent: string;
  /** Colour for `figure`. Must clear AA against `ground`. */
  figureTone: string;
  /** The offer's value, transcribed from its `mechanic`. */
  figure: string;
  /** What the figure means. Set small, directly beneath it. */
  figureNote: string;
  /**
   * Sub-key under `offers.figures` holding the translated pair.
   *
   * `figure` and `figureNote` above are the English source of truth: they are
   * what the honesty test checks against the offer's own `mechanic`. What is
   * actually *rendered* is the translation at this key, so that ৳200 can be
   * ৳২০০ in Bangla. A test asserts the English resource still matches the two
   * fields above, so the two copies cannot drift.
   *
   * Absent only on the fallback direction below, which by definition belongs
   * to an offer nobody has designed yet. That one prints its English literal
   * rather than borrowing another offer's translated value.
   */
  figureKey?: OfferFigureKey;
}

/** The five sub-keys under `offers.figures` in the locale resources. */
export type OfferFigureKey =
  | 'matinee'
  | 'familyFour'
  | 'lateRepertory'
  | 'sensory'
  | 'studentWeeknight';

/** Grounds and tones are the documented palette — no new hues. */
const ground = {
  ink: '#111113',
  house: '#0B0B0D',
  /* Was an indigo. A second chromatic ground competed with the vermilion, so
     it is now the achromatic steel — the offer set reads as one series. */
  slate: '#2B303B',
  bone: '#EAE6DE',
  clay: '#5A1A0B',
} as const;

const tone = {
  paper: '#F4F1EB',
  bone: '#EAE6DE',
  ink: '#111113',
  inkMuted: '#494A4F',
  signal: '#BE2A10',
  signalLit: '#FF5C36',
  steel: '#4A5160',
  steelLit: '#9AA3B4',
  steelWash: '#E3E4E8',
} as const;

/**
 * One entry per offer, hand-assigned. The pairing is an editorial reading of
 * what each offer *is* — a matinee is a stub, a family booking is a strip of
 * four admissions, a late strand is leader running down to the feature.
 */
const directions: Record<string, OfferArt> = {
  // A matinee price, every day, on every seat. The plainest thing a box office
  // hands over: one stub, torn off, punched.
  'off-matinee': {
    composition: 'stub',
    ground: ground.bone,
    ink: tone.ink,
    accent: tone.signal,
    figureTone: tone.ink,
    figure: '৳60',
    figureNote: 'off each seat',
    figureKey: 'matinee',
  },

  // Two adults, two children, one box between them — four admissions on a
  // single perforated strip.
  'off-family-four': {
    composition: 'pass',
    ground: ground.slate,
    ink: tone.steelWash,
    accent: tone.signalLit,
    figureTone: tone.paper,
    figure: '৳200',
    figureNote: 'off the Family box',
    figureKey: 'familyFour',
  },

  // The 10:45 pm Thursday strand. Leader running down to a late feature.
  'off-late-repertory': {
    composition: 'leader',
    ground: ground.house,
    ink: tone.steelLit,
    accent: tone.signalLit,
    figureTone: tone.paper,
    figure: '10 pm',
    figureNote: 'Thursdays, Dhanmondi',
    figureKey: 'lateRepertory',
  },

  // House lights half up, sound brought down, no trailers. The composition is
  // deliberately the quietest of the five.
  'off-sensory': {
    composition: 'insert',
    ground: ground.bone,
    ink: tone.inkMuted,
    accent: tone.steel,
    figureTone: tone.ink,
    figure: '1st',
    figureNote: 'Saturday of the month',
    figureKey: 'sensory',
  },

  // The door checks a student ID, so the offer is a card you carry.
  'off-student-weeknight': {
    composition: 'card',
    ground: ground.clay,
    ink: tone.bone,
    accent: tone.signalLit,
    figureTone: tone.paper,
    figure: '15%',
    figureNote: 'off the seat price',
    figureKey: 'studentWeeknight',
  },
};

/**
 * Fallback for an offer added to `offers.ts` without art direction. It renders
 * a valid composition rather than nothing, so a new offer is never broken —
 * only undesigned. A test asserts every shipped offer has a real entry.
 */
const fallback: OfferArt = {
  composition: 'insert',
  ground: ground.bone,
  ink: tone.inkMuted,
  accent: tone.steel,
  figureTone: tone.ink,
  figure: '—',
  figureNote: 'see the terms',
};

export function offerArtFor(offerId: string): OfferArt {
  return directions[offerId] ?? fallback;
}

/** Every offer that has hand-authored art direction. Used by the tests. */
export const offerArtIds = Object.keys(directions);

/** Ids present in `offers.ts` but not designed here. Should always be empty. */
export const undesignedOfferIds = offers.filter((o) => !directions[o.id]).map((o) => o.id);
