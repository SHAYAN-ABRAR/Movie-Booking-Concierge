/**
 * Domain types for the Nokshi Cinemas demonstration catalogue.
 *
 * Every value in this application originates from typed seed data in `src/data`.
 * There is no backend, no database and no network call to any ticketing service.
 */

export type Language = 'bn' | 'en' | 'hi';

export type Genre =
  | 'drama'
  | 'thriller'
  | 'action'
  | 'comedy'
  | 'romance'
  | 'sci-fi'
  | 'documentary'
  | 'animation'
  | 'family'
  | 'horror'
  | 'musical'
  | 'historical';

/** Screening formats. Original house names — not third-party format trademarks. */
export type Format = 'standard' | 'three-d' | 'grandscreen' | 'velvet';

/**
 * Local certificate scheme for this demonstration catalogue.
 * `minAge` drives the age-category warning in the booking flow.
 */
export type CertificateCode = 'U' | 'UA12' | 'UA16' | 'A18';

export interface Certificate {
  code: CertificateCode;
  label: string;
  /** Minimum unaccompanied age this demo applies. `null` = no restriction. */
  minAge: number | null;
  guidance: string;
}

/** Accessibility provisions that can apply to an individual screening. */
export type ScreeningAccessibility =
  | 'open-captions'
  | 'closed-captions'
  | 'audio-description'
  | 'wheelchair-spaces'
  | 'hearing-loop'
  | 'sensory-friendly';

/** Facilities that belong to a venue rather than a single screening. */
export type VenueAccessibility =
  | 'step-free-access'
  | 'accessible-toilet'
  | 'hearing-loop'
  | 'companion-seat'
  | 'assistance-dogs'
  | 'lift-access'
  | 'accessible-parking';

export type Amenity =
  | 'parking'
  | 'cafe'
  | 'lounge'
  | 'atm'
  | 'prayer-room'
  | 'baby-change'
  | 'cloakroom'
  | 'gift-card';

/** An optional, spoiler-light low-action window, stored explicitly per film. */
export interface BreakWindow {
  /** Minutes from the feature's start (excludes trailers). */
  fromMinute: number;
  toMinute: number;
  /** Spoiler-light description. Revealed only after an explicit spoiler prompt. */
  note: string;
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  /** Bengali title where the film has one. Preserved verbatim by Max. */
  titleBn?: string;
  /** One-line programme note. */
  tagline: string;
  synopsis: string;
  runtimeMinutes: number;
  /** Listed interval, where the film is programmed with one. */
  intermissionMinutes: number | null;
  certificate: CertificateCode;
  genres: Genre[];
  language: Language;
  /** Subtitle languages available on at least some screenings. */
  subtitles: Language[];
  director: string;
  cast: string[];
  releaseDate: string; // ISO date
  status: 'now-showing' | 'coming-soon';
  formats: Format[];
  /** Explicitly authored break guidance. Absent = Max must say it has none. */
  breakWindows?: BreakWindow[];
  /** Local trailer file in /public, when one exists. None are supplied. */
  trailerSrc?: string;
  /** Deterministic accent index (0–5) used for the typographic plate. */
  plate: number;
  /** Editorial pull-quote from the programme's own notes. */
  programmeNote: string;
}

export interface ScreenSeatRule {
  /** Row letters, in order from the screen backwards. */
  rows: string[];
  seatsPerRow: number;
  /** 1-based seat indices after which an aisle gap is drawn. */
  aislesAfter: number[];
  /** Rows (letters) whose seats are premium. */
  premiumRows: string[];
  /** Rows whose seats are recliners. */
  reclinerRows: string[];
  /** Explicit wheelchair space coordinates, e.g. `['D1','D2']`. */
  wheelchairSpaces: string[];
  /** Companion seats paired with wheelchair spaces. */
  companionSeats: string[];
  /** Seats that do not exist (structural gaps). */
  missing?: string[];
}

export interface Screen {
  id: string;
  name: string;
  format: Format;
  capacity: number;
  layout: ScreenSeatRule;
  accessibility: ScreeningAccessibility[];
}

export interface Cinema {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  /** Short name used in compact UI and by Max. */
  shortName: string;
  city: string;
  area: string;
  addressLines: string[];
  /** Free-text used to build an external map search URL. No map API. */
  mapQuery: string;
  phone: string;
  email: string;
  openingHours: string;
  boxOfficeHours: string;
  screens: Screen[];
  amenities: Amenity[];
  accessibility: VenueAccessibility[];
  transportNote: string;
  parkingNote: string;
  /** Local sample policy text used by Max's late-arrival guidance. */
  lateArrivalPolicy: string;
  /** Minutes of trailers/adverts before the feature starts at this venue. */
  trailerMinutes: number;
  lostAndFound: {
    email: string;
    phone: string;
    hours: string;
    holdingPeriodDays: number;
  };
  /** Editorial description of the venue, written for this programme. */
  description: string;
  /** What makes this venue distinct — surfaced on the cinema page. */
  signature: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late';

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  screenId: string;
  /** ISO date, local to the venue: yyyy-MM-dd */
  date: string;
  /** 24h local start time: HH:mm */
  time: string;
  format: Format;
  language: Language;
  subtitles: Language[];
  accessibility: ScreeningAccessibility[];
  /** Matinee pricing applies to screenings starting before 15:00. */
  matinee: boolean;
}

export type SeatClass = 'regular' | 'premium' | 'recliner' | 'wheelchair' | 'companion';

export type SeatStatus = 'available' | 'sold' | 'held' | 'unavailable';

export interface Seat {
  /** e.g. "F12" */
  id: string;
  row: string;
  number: number;
  seatClass: SeatClass;
  status: SeatStatus;
  /** Column index in the rendered grid, aisles included. */
  column: number;
  /** True when an aisle runs immediately to the seat's right. */
  aisleRight: boolean;
  aisleLeft: boolean;
}

export interface SeatRow {
  row: string;
  seats: Seat[];
  /** Distance band from the screen: front third, middle third, back third. */
  band: 'front' | 'middle' | 'back';
}

export type TicketCategory = 'child' | 'adult' | 'senior' | 'student';

export interface TicketCategoryRule {
  id: TicketCategory;
  label: string;
  labelBn: string;
  description: string;
  /** Multiplier applied to the seat-class base price. */
  multiplier: number;
  /** Age band this category represents. No date of birth is ever collected. */
  ageFrom: number | null;
  ageTo: number | null;
  /** Whether this category counts as an accompanying adult for certificates. */
  countsAsAdult: boolean;
}

export interface ConcessionItem {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  category: 'popcorn' | 'drinks' | 'hot-food' | 'sweets' | 'combo';
  description: string;
  /** Price in BDT paisa-free whole taka. Sample demonstration pricing. */
  price: number;
  /** Sizes, where the item is sold in more than one. */
  size?: string;
  dietary: Array<'vegetarian' | 'vegan' | 'halal' | 'contains-dairy' | 'spicy'>;
  /** Declared allergens. Incomplete by design — Max must say so. */
  allergens: Array<'milk' | 'nuts' | 'peanuts' | 'gluten' | 'soy' | 'egg'>;
  /** True when the allergen list has not been verified for this item. */
  allergenDataComplete: boolean;
  /** Serves this many people, used by Max's group maths. */
  serves: number;
  availableAt: 'all' | string[];
}

export interface Offer {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  summary: string;
  detail: string;
  /** How the discount is expressed, for Max to explain accurately. */
  mechanic: string;
  /** Days of week the offer runs, 0 = Sunday. Empty = every day. */
  days: number[];
  terms: string[];
  /** Which cinemas honour it. */
  cinemaIds: 'all' | string[];
  /** Typographic plate index — offers are set, never photographed. */
  plate: number;
}

export interface FaqEntry {
  id: string;
  topic:
    | 'tickets'
    | 'pricing'
    | 'access'
    | 'venue'
    | 'food'
    | 'refunds'
    | 'arrival'
    | 'lost-found'
    | 'demo';
  question: string;
  questionBn: string;
  answer: string;
  answerBn: string;
  /** Extra matching terms for Max's retrieval. */
  keywords: string[];
}

/** Sample ticket-insurance product attached to some local bookings. */
export interface InsurancePolicy {
  id: string;
  name: string;
  /** Flat fee per booking, in BDT. */
  fee: number;
  coverageSummary: string;
  coveredReasons: Array<{ id: string; label: string; note: string }>;
  exclusions: string[];
  claimWindowDays: number;
  contactEmail: string;
  contactPhone: string;
}
