import type { Movie } from './types';

/**
 * Film art direction.
 *
 * No poster artwork was supplied with this project, so each film is given a
 * deliberate, hand-authored visual identity here. This is *visual* metadata
 * only — nothing in this file affects scheduling, pricing, availability or any
 * other operational behaviour. It lives outside `movies.ts` for exactly that
 * reason.
 *
 * Every value is chosen per film, not generated. Two films never share a
 * family and a palette, so a catalogue grid reads as a shelf of different
 * things rather than one template recoloured.
 */

/**
 * Seven composition families. These differ *structurally* — different geometry,
 * different focal behaviour, different relationship between type and field —
 * not merely in colour.
 */
export type ArtworkFamily =
  | 'aperture' // Concentric projector iris opening off-centre
  | 'strata' // Topographic contour bands, land and water
  | 'registration' // Off-register print layers; the title misprinted over itself
  | 'timecode' // Film leader: countdown numerals, frame bands, cue marks
  | 'lattice' // Architectural window grid; a building at night
  | 'arc' // Celestial or sound-wave arcs sweeping the frame
  | 'thread'; // Kantha running-stitch field, the house motif at full scale

export type LightDirection = 'tl' | 'tr' | 'bl' | 'br' | 'center';

export interface ArtDirection {
  family: ArtworkFamily;
  /** Field colour. */
  ground: string;
  /** Geometry drawn on the field. */
  ink: string;
  /** The one bright note. Used sparingly, per family. */
  accent: string;
  /** Where the projected light falls from. */
  light: LightDirection;
  density: 'sparse' | 'medium' | 'dense';
  /** Which single layer is allowed to move. `still` means none. */
  motion: 'drift' | 'breathe' | 'sweep' | 'still';
  /** Title colour on this field. Must clear AA against `ground`. */
  titleTone: string;
  /** Where the title sits in the card composition. */
  titleAlign: 'bottom-left' | 'bottom-right' | 'top-left' | 'centre';
}

/**
 * Artwork grounds, derived from the documented palette.
 *
 * `clay` and `slate` are new here — clay is the house marigold taken down to a
 * field weight, slate sits between house-raised and hairline-strong. Both were
 * added because seven films needed seven distinguishable fields; neither is a
 * new hue.
 */
const ground = {
  ink: '#14161F',
  house: '#101322',
  indigo: '#22346B',
  projector: '#31497F',
  bone: '#E9E4D9',
  paper: '#F4F1EA',
  clay: '#5E2712',
  slate: '#252B3A',
  moss: '#1E3A31',
} as const;

const tone = {
  paper: '#F4F1EA',
  bone: '#E9E4D9',
  ink: '#14161F',
  marigold: '#C2491A',
  projector: '#35509C',
  marigoldLit: '#F0913C',
  projectorLit: '#93B2F3',
  projectorWash: '#DFE6F8',
  ok: '#2C6349',
} as const;

/**
 * One entry per film. Hand-assigned — the pairing of family to film is an
 * editorial judgement about the film, not a hash of its id.
 */
const directions: Record<string, ArtDirection> = {
  // A night coach, eleven passengers, one missing conductor. Headlights on a
  // road: an aperture opening in the dark.
  'mov-cholonto-chhaya': {
    family: 'aperture',
    ground: ground.ink,
    ink: '#2C3040',
    accent: tone.marigoldLit,
    light: 'center',
    density: 'medium',
    motion: 'breathe',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },

  // A coastline that moved eleven kilometres inland. Contour lines, redrawn.
  'mov-the-salt-line': {
    family: 'strata',
    ground: ground.indigo,
    ink: '#4A67AE',
    accent: tone.projectorWash,
    light: 'tr',
    density: 'dense',
    motion: 'drift',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },

  // Four hundred rickshaw journeys from one fixed camera. A city grid at
  // street height, printed slightly out of register.
  'mov-rickshaw-city': {
    family: 'registration',
    ground: ground.bone,
    ink: '#B9AF9C',
    accent: tone.marigold,
    light: 'tl',
    density: 'medium',
    motion: 'still',
    titleTone: tone.ink,
    titleAlign: 'top-left',
  },

  // Sixty years of a sandbank in the Meghna. Water in layers.
  'mov-nadir-naam-meghna': {
    family: 'strata',
    ground: ground.moss,
    ink: '#3E6B5C',
    accent: '#D8C88A',
    light: 'bl',
    density: 'medium',
    motion: 'drift',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },

  // A glazier who hears fractures before they happen. Threads under tension.
  'mov-kaanch': {
    family: 'thread',
    ground: ground.slate,
    ink: '#3D4557',
    accent: tone.projectorLit,
    light: 'tr',
    density: 'dense',
    motion: 'still',
    titleTone: tone.paper,
    titleAlign: 'bottom-right',
  },

  // A paper lantern travelling a city on the wind, past nine households.
  'mov-paper-lantern': {
    family: 'lattice',
    ground: ground.clay,
    ink: '#8A4526',
    accent: '#F5C87A',
    light: 'center',
    density: 'medium',
    motion: 'breathe',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },

  // Navigation by heading, speed and elapsed time. A stopwatch and a chart.
  'mov-dead-reckoning-hour': {
    family: 'timecode',
    ground: ground.house,
    ink: '#2A3145',
    accent: tone.marigoldLit,
    light: 'tl',
    density: 'dense',
    motion: 'sweep',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },

  // Eleven kilometres across the worst traffic day of the year.
  'mov-aamar-shohor': {
    family: 'lattice',
    ground: ground.paper,
    ink: '#C9C0AE',
    accent: tone.marigold,
    light: 'tl',
    density: 'dense',
    motion: 'still',
    titleTone: tone.ink,
    titleAlign: 'bottom-left',
  },

  // Nine numbers sung live on camera. Sound as geometry.
  'mov-sitara': {
    family: 'arc',
    ground: ground.clay,
    ink: '#96502F',
    accent: '#F2CE8B',
    light: 'bl',
    density: 'medium',
    motion: 'breathe',
    titleTone: tone.paper,
    titleAlign: 'centre',
  },

  // Forty years of accounts and one entry that never balanced. Ruled ledger
  // paper, printed twice.
  'mov-the-quiet-ledger': {
    family: 'registration',
    ground: ground.paper,
    ink: '#BEB5A3',
    accent: tone.projector,
    light: 'tl',
    density: 'dense',
    motion: 'still',
    titleTone: tone.ink,
    titleAlign: 'bottom-left',
  },

  // One night in an industrial district, told from three shifts.
  'mov-nishiddho-raat': {
    family: 'lattice',
    ground: ground.house,
    ink: '#232A3C',
    accent: '#C2491A',
    light: 'br',
    density: 'sparse',
    motion: 'breathe',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },

  // A hundred years of handwritten rainfall records.
  'mov-monsoon-archive': {
    family: 'thread',
    ground: ground.bone,
    ink: '#AFA69A',
    accent: tone.projector,
    light: 'tl',
    density: 'dense',
    motion: 'still',
    titleTone: tone.ink,
    titleAlign: 'top-left',
  },

  // Tracking the last tiger in the district. Stripes, and a census.
  'mov-bagh': {
    family: 'timecode',
    ground: ground.moss,
    ink: '#31584B',
    accent: '#E0A53C',
    light: 'tr',
    density: 'medium',
    motion: 'sweep',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },

  // Two stations, one orbit, a nine-minute delay between every sentence.
  'mov-orbital-drift': {
    family: 'arc',
    ground: ground.ink,
    ink: '#2E3448',
    accent: tone.projectorLit,
    light: 'tr',
    density: 'sparse',
    motion: 'drift',
    titleTone: tone.paper,
    titleAlign: 'bottom-left',
  },
};

/** Fallback for any film without an explicit direction. */
const fallback: ArtDirection = {
  family: 'thread',
  ground: ground.ink,
  ink: '#2C3040',
  accent: tone.marigoldLit,
  light: 'tl',
  density: 'medium',
  motion: 'still',
  titleTone: tone.paper,
  titleAlign: 'bottom-left',
};

export function artworkFor(movie: Pick<Movie, 'id'>): ArtDirection {
  return directions[movie.id] ?? fallback;
}

export function artworkForId(movieId: string): ArtDirection {
  return directions[movieId] ?? fallback;
}

/** Light-direction to an SVG gradient origin, in viewBox units of 100. */
export function lightOrigin(light: LightDirection): { x: number; y: number } {
  switch (light) {
    case 'tl':
      return { x: 18, y: 14 };
    case 'tr':
      return { x: 82, y: 14 };
    case 'bl':
      return { x: 18, y: 86 };
    case 'br':
      return { x: 82, y: 86 };
    default:
      return { x: 50, y: 46 };
  }
}

export const densityScale = { sparse: 0.62, medium: 1, dense: 1.5 } as const;
