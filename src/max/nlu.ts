import { addDays, nextDay, type Day } from 'date-fns';
import { cinemas } from '@/data/cinemas';
import { movies } from '@/data/movies';
import { allGenres } from '@/data/movies';
import { toIsoDate, todayIso } from '@/lib/datetime';
import { emptyEntities, type MaxEntities, type MaxIntent, type MaxParse } from './types';
import type { Format, Genre, Language, ScreeningAccessibility } from '@/data/types';
import type { LostItemCategory, ClaimReason } from '@/store/reports';
import type { TicketCounts } from '@/lib/bookingMath';

/**
 * Max's language pipeline.
 *
 * Deterministic and inspectable end to end: normalise → detect language →
 * score intents → extract entities → resolve relative dates against the
 * viewer's own clock → check the catalogue → score confidence. No model, no
 * network call, no `eval`, and no behaviour that changes between two identical
 * inputs.
 */

/* ── 1. Normalisation ──────────────────────────────────────────────── */

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

export function normalise(input: string): string {
  let text = input.trim().toLowerCase();

  // Bengali digits to Latin, so "৮টা" and "8 o'clock" take the same path.
  text = text.replace(/[০-৯]/g, (digit) => String(BENGALI_DIGITS.indexOf(digit)));

  return text
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/্/g, '্') // keep hasant intact
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── 2. Language detection ─────────────────────────────────────────── */

export function detectLanguage(text: string): 'en' | 'bn' {
  const bengali = (text.match(/[ঀ-৿]/g) ?? []).length;
  const latin = (text.match(/[a-z]/gi) ?? []).length;
  // Bengali script is unambiguous; a handful of Bengali characters in an
  // otherwise Latin sentence is a mixed query, which we answer in Bengali only
  // when the Bengali carries most of the meaning.
  if (bengali === 0) return 'en';
  if (latin === 0) return 'bn';
  return bengali >= latin * 0.6 ? 'bn' : 'en';
}

/* ── 3. Synonyms and keyword tables ────────────────────────────────── */

const genreSynonyms: Record<string, Genre> = {
  'sci-fi': 'sci-fi',
  scifi: 'sci-fi',
  'science fiction': 'sci-fi',
  'কল্পবিজ্ঞান': 'sci-fi',
  thriller: 'thriller',
  'থ্রিলার': 'thriller',
  suspense: 'thriller',
  action: 'action',
  'অ্যাকশন': 'action',
  comedy: 'comedy',
  funny: 'comedy',
  'কমেডি': 'comedy',
  'হাসির': 'comedy',
  drama: 'drama',
  'নাটকীয়': 'drama',
  romance: 'romance',
  romantic: 'romance',
  'রোমান্স': 'romance',
  horror: 'horror',
  scary: 'horror',
  'ভৌতিক': 'horror',
  'ভুতের': 'horror',
  documentary: 'documentary',
  docs: 'documentary',
  'প্রামাণ্যচিত্র': 'documentary',
  animation: 'animation',
  animated: 'animation',
  cartoon: 'animation',
  'অ্যানিমেশন': 'animation',
  family: 'family',
  kids: 'family',
  children: 'family',
  'পরিবার': 'family',
  'শিশুদের': 'family',
  musical: 'musical',
  music: 'musical',
  'সঙ্গীত': 'musical',
  historical: 'historical',
  history: 'historical',
  'ঐতিহাসিক': 'historical',
};

const languageSynonyms: Record<string, Language> = {
  bangla: 'bn',
  bengali: 'bn',
  'বাংলা': 'bn',
  english: 'en',
  'ইংরেজি': 'en',
  'ইংলিশ': 'en',
  hindi: 'hi',
  'হিন্দি': 'hi',
};

const formatSynonyms: Record<string, Format> = {
  '2d': 'standard',
  standard: 'standard',
  '3d': 'three-d',
  'থ্রিডি': 'three-d',
  grandscreen: 'grandscreen',
  'grand screen': 'grandscreen',
  'large format': 'grandscreen',
  'big screen': 'grandscreen',
  velvet: 'velvet',
  'velvet room': 'velvet',
  recliner: 'velvet',
  luxury: 'velvet',
};

const accessibilitySynonyms: Array<{ match: RegExp; value: ScreeningAccessibility }> = [
  { match: /\bopen[- ]?caption|\boc\b|খোলা ক্যাপশন/, value: 'open-captions' },
  { match: /\bclosed[- ]?caption|\bcc\b|ক্লোজড ক্যাপশন/, value: 'closed-captions' },
  { match: /audio[- ]?descri|\bad\b|অডিও বর্ণনা/, value: 'audio-description' },
  { match: /wheelchair|হুইলচেয়ার|wheel chair/, value: 'wheelchair-spaces' },
  { match: /hearing[- ]?loop|induction loop|hearing aid|শ্রবণ/, value: 'hearing-loop' },
  { match: /sensory[- ]?friendly|autism|সংবেদনশীল/, value: 'sensory-friendly' },
];

const weekdayNames: Record<string, Day> = {
  sunday: 0,
  sun: 0,
  'রবিবার': 0,
  monday: 1,
  mon: 1,
  'সোমবার': 1,
  tuesday: 2,
  tue: 2,
  'মঙ্গলবার': 2,
  wednesday: 3,
  wed: 3,
  'বুধবার': 3,
  thursday: 4,
  thu: 4,
  'বৃহস্পতিবার': 4,
  friday: 5,
  fri: 5,
  'শুক্রবার': 5,
  saturday: 6,
  sat: 6,
  'শনিবার': 6,
};

/* ── 4. Date and time resolution ───────────────────────────────────── */

interface TimeWindow {
  after?: string;
  before?: string;
  expression?: string;
}

/**
 * Resolves a relative date expression against the viewer's own local clock.
 * Never against UTC, and never against a hard-coded date.
 */
/**
 * Bengali script has no `\w` characters, so JavaScript's `\b` never matches
 * beside it — every Bengali alternative has to be tested without a boundary.
 * Longer forms are tested first: আগামীকাল contains কাল, আজকে contains আজ.
 */
export function resolveDate(text: string, now: Date = new Date()): { date?: string; expression?: string } {
  const today = toIsoDate(now);

  if (/\b(day after tomorrow)\b/.test(text) || text.includes('পরশু')) {
    return { date: toIsoDate(addDays(now, 2)), expression: 'the day after tomorrow' };
  }
  if (
    /\b(tomorrow)\b/.test(text) ||
    text.includes('আগামীকাল') ||
    text.includes('আগামিকাল') ||
    text.includes('কাল')
  ) {
    return { date: toIsoDate(addDays(now, 1)), expression: 'tomorrow' };
  }
  if (/\b(tonight|today)\b/.test(text) || text.includes('আজকে') || text.includes('আজ')) {
    const isTonight = /tonight/.test(text) || text.includes('আজ রাত');
    return { date: today, expression: isTonight ? 'tonight' : 'today' };
  }
  if (
    /\b(this weekend|weekend)\b/.test(text) ||
    text.includes('সপ্তাহান্ত') ||
    text.includes('ছুটির দিন')
  ) {
    // The weekend here is Friday and Saturday. Take the coming Friday.
    const friday = now.getDay() === 5 ? now : nextDay(now, 5);
    return { date: toIsoDate(friday), expression: 'this weekend (Friday)' };
  }

  const nextMatch = /\bnext (sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/.exec(text);
  if (nextMatch) {
    const day = weekdayNames[nextMatch[1]!];
    if (day !== undefined) {
      return { date: toIsoDate(addDays(nextDay(now, day), 0)), expression: `next ${nextMatch[1]}` };
    }
  }

  for (const [name, day] of Object.entries(weekdayNames)) {
    // Only match whole words, and skip the 2–3 letter abbreviations inside
    // longer words ("sat" inside "saturday" is already covered).
    const pattern = new RegExp(`(^|\\s)${name}(\\s|$|[,.?!])`);
    if (pattern.test(text)) {
      const target = now.getDay() === day ? now : nextDay(now, day);
      return { date: toIsoDate(target), expression: name.length <= 3 ? name : name };
    }
  }

  // Explicit ISO or d/m dates.
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(text);
  if (iso) return { date: iso[1]!, expression: iso[1]! };

  const dayMonth = /\b(\d{1,2})[/ -](\d{1,2})\b/.exec(text);
  if (dayMonth) {
    const day = Number(dayMonth[1]);
    const month = Number(dayMonth[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const candidate = new Date(now.getFullYear(), month - 1, day);
      const resolved = candidate < now ? new Date(now.getFullYear() + 1, month - 1, day) : candidate;
      return { date: toIsoDate(resolved), expression: `${day}/${month}` };
    }
  }

  return {};
}

function pad(hour: number, minute = 0): string {
  return `${String(Math.max(0, Math.min(23, hour))).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Resolves "after 8pm", "before lunch", "this evening", "৮টার পর". */
export function resolveTimeWindow(text: string): TimeWindow {
  // English is prepositional ("after 8"); Bengali is postpositional
  // ("৮টার পর"), so the number sits on the other side of the marker.
  const clock =
    /\b(?:after|from|past|later than)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/.exec(text) ??
    /(\d{1,2})(?:[:.](\d{2}))?\s*(?:টা|টায়|টার)?\s*(?:পরে|পর|থেকে)/.exec(text) ??
    null;

  const before =
    /\b(?:before|by|earlier than|until)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/.exec(text) ??
    /(\d{1,2})(?:[:.](\d{2}))?\s*(?:টা|টায়|টার)?\s*আগে/.exec(text) ??
    null;

  const window: TimeWindow = {};

  function toHour(value: string, meridiem: string | undefined, contextText: string): number {
    let hour = Number(value);
    const pm =
      meridiem === 'pm' ||
      /\b(pm|evening|night)\b/.test(contextText) ||
      contextText.includes('রাত') ||
      contextText.includes('সন্ধ্যা');
    const am =
      meridiem === 'am' || /\b(am|morning)\b/.test(contextText) || contextText.includes('সকাল');
    if (pm && hour < 12) hour += 12;
    if (am && hour === 12) hour = 0;
    // A bare "after 8" in a cinema context almost always means the evening.
    if (!meridiem && !pm && !am && hour >= 1 && hour <= 11) hour += 12;
    return hour;
  }

  if (clock) {
    const hour = toHour(clock[1]!, clock[3], text);
    window.after = pad(hour, Number(clock[2] ?? 0));
    window.expression = `after ${window.after}`;
  }
  if (before) {
    const hour = toHour(before[1]!, before[3], text);
    window.before = pad(hour, Number(before[2] ?? 0));
    window.expression = window.after
      ? `between ${window.after} and ${window.before}`
      : `before ${window.before}`;
  }

  if (window.after || window.before) return window;

  // Named parts of the day.
  if (/\b(tonight|this evening|সন্ধ্যায়|আজ রাতে|রাতে)\b/.test(text)) {
    return { after: '17:00', expression: 'this evening' };
  }
  if (/\b(late night|late show|শেষ শো|গভীর রাত)\b/.test(text)) {
    return { after: '21:00', expression: 'late night' };
  }
  if (/\b(this afternoon|afternoon|দুপুরে|বিকেলে|বিকাল)\b/.test(text)) {
    return { after: '12:00', before: '16:59', expression: 'this afternoon' };
  }
  if (/\b(this morning|morning|matinee|সকালে)\b/.test(text)) {
    return { after: '00:00', before: '11:59', expression: 'the morning' };
  }
  if (/\b(before lunch|দুপুরের আগে)\b/.test(text)) {
    return { before: '12:00', expression: 'before lunch' };
  }
  if (/\b(after lunch|after dinner|রাতের খাবারের পর|ডিনারের পর)\b/.test(text)) {
    const dinner = /dinner|রাতের খাবার|ডিনার/.test(text);
    return dinner
      ? { after: '20:00', expression: 'after dinner' }
      : { after: '13:00', expression: 'after lunch' };
  }
  if (/\b(before three|before 3|matinee|তিনটার আগে)\b/.test(text)) {
    return { before: '14:59', expression: 'before three' };
  }

  return {};
}

/* ── 5. Entity extraction ──────────────────────────────────────────── */

function extractRuntime(text: string): number | undefined {
  const hours = /\bunder (?:an? )?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/.exec(text);
  if (hours) return Math.round(Number(hours[1]) * 60);
  if (/\bunder two hours?|two hours or less|২ ঘণ্টার কম|দুই ঘণ্টার কম\b/.test(text)) return 120;
  if (/\bunder three hours?|৩ ঘণ্টার কম\b/.test(text)) return 180;
  const minutes = /\bunder (\d{2,3})\s*(?:minutes?|mins?|মিনিট)\b/.exec(text);
  if (minutes) return Number(minutes[1]);
  if (/\bshort film|something short|ছোট ছবি\b/.test(text)) return 100;
  return undefined;
}

function extractPartySize(text: string): number | undefined {
  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    'একজন': 1,
    'দুইজন': 2,
    'দুজন': 2,
    'তিনজন': 3,
    'চারজন': 4,
    'পাঁচজন': 5,
    'ছয়জন': 6,
  };

  const numeric = /\b(\d{1,2})\s*(?:seats?|tickets?|people|persons?|of us|সিট|আসন|টিকিট|জন)\b/.exec(text);
  if (numeric) {
    const size = Number(numeric[1]);
    if (size >= 1 && size <= 12) return size;
  }

  for (const [word, size] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\b`).test(text) && /(seats?|tickets?|people|of us|সিট|টিকিট|জন)/.test(text)) {
      return size;
    }
    if (new RegExp(`${word}(জন)`).test(text)) return size;
  }

  return undefined;
}

function extractBudget(text: string): number | undefined {
  const match =
    /(?:under|below|less than|within|max(?:imum)?|budget of|৳|tk|taka|টাকা)\s*৳?\s*(\d{2,5})/.exec(text) ??
    /৳\s*(\d{2,5})/.exec(text) ??
    /(\d{2,5})\s*(?:taka|tk|টাকার? (?:মধ্যে|কম))/.exec(text);
  if (!match) return undefined;
  const value = Number(match[1]);
  return value >= 50 && value <= 50_000 ? value : undefined;
}

function matchTitles(text: string): string[] {
  const found: string[] = [];
  for (const movie of movies) {
    const title = movie.title.toLowerCase();
    if (text.includes(title)) {
      found.push(movie.id);
      continue;
    }
    if (movie.titleBn && text.includes(movie.titleBn.toLowerCase())) {
      found.push(movie.id);
      continue;
    }
    // A distinctive first word is enough ("cholonto", "reckoning").
    const distinctive = title
      .split(/\s+/)
      .filter((word) => word.length >= 6 && !['the', 'and'].includes(word));
    if (distinctive.some((word) => text.includes(word))) found.push(movie.id);
  }
  return [...new Set(found)];
}

function matchCinemas(text: string): string[] {
  const found: string[] = [];
  for (const cinema of cinemas) {
    const candidates = [
      cinema.shortName.toLowerCase(),
      cinema.area.toLowerCase(),
      cinema.nameBn,
      cinema.name.toLowerCase(),
    ];
    if (candidates.some((candidate) => candidate && text.includes(candidate.toLowerCase()))) {
      found.push(cinema.id);
    }
  }
  return [...new Set(found)];
}

const lostItemPatterns: Array<{ match: RegExp; value: LostItemCategory }> = [
  { match: /\bphone|mobile|মোবাইল|ফোন/, value: 'phone' },
  { match: /\bwallet|purse|মানিব্যাগ|পার্স/, value: 'wallet-or-purse' },
  { match: /\bkeys?\b|চাবি/, value: 'keys' },
  { match: /\bbag|backpack|rucksack|ব্যাগ/, value: 'bag' },
  { match: /\bjacket|coat|scarf|clothing|জামা|কাপড়/, value: 'clothing' },
  { match: /\bglasses|spectacles|চশমা/, value: 'glasses' },
  { match: /\bring|necklace|jewell?ery|গয়না/, value: 'jewellery' },
  { match: /\bpassport|licence|license|documents?|কাগজ/, value: 'documents' },
  { match: /\btoy|pram|bottle|খেলনা/, value: 'child-item' },
];

const claimReasonPatterns: Array<{ match: RegExp; value: ClaimReason }> = [
  { match: /\bill|sick|unwell|fever|hospital|অসুস্থ/, value: 'illness' },
  { match: /\btrain|bus|traffic|transport|flight|delayed|যানজট|বাস|ট্রেন/, value: 'transport' },
  { match: /\bdeath|died|funeral|bereave|মৃত্যু|শোক/, value: 'bereavement' },
  { match: /\bwork|shift|office|callout|কাজ|অফিস/, value: 'work' },
  { match: /\bstorm|rain|flood|cyclone|weather|ঝড়|বৃষ্টি|বন্যা/, value: 'weather' },
];

export function extractEntities(text: string, now: Date = new Date()): MaxEntities {
  const entities = emptyEntities();

  entities.movieIds = matchTitles(text);
  entities.cinemaIds = matchCinemas(text);

  for (const [word, genre] of Object.entries(genreSynonyms)) {
    if (text.includes(word)) entities.genres.push(genre);
  }
  entities.genres = [...new Set(entities.genres)].filter((g) => allGenres.includes(g));

  for (const [word, language] of Object.entries(languageSynonyms)) {
    if (new RegExp(`(^|\\W)${word}(\\W|$)`).test(text)) entities.languages.push(language);
  }
  entities.languages = [...new Set(entities.languages)];

  for (const [word, format] of Object.entries(formatSynonyms)) {
    if (text.includes(word)) entities.formats.push(format);
  }
  entities.formats = [...new Set(entities.formats)];

  for (const { match, value } of accessibilitySynonyms) {
    if (match.test(text)) entities.accessibility.push(value);
  }
  entities.accessibility = [...new Set(entities.accessibility)];

  const date = resolveDate(text, now);
  if (date.date) {
    entities.date = date.date;
    entities.dateExpression = date.expression;
  }

  const window = resolveTimeWindow(text);
  if (window.after) entities.after = window.after;
  if (window.before) entities.before = window.before;
  if (window.expression) entities.timeExpression = window.expression;

  const runtime = extractRuntime(text);
  if (runtime) entities.maxRuntime = runtime;

  const party = extractPartySize(text);
  if (party) entities.partySize = party;

  const budget = extractBudget(text);
  if (budget) entities.budget = budget;

  if (/\baisle|আইল|পাশের সিট\b/.test(text)) entities.seatPreference = 'aisle';
  else if (/\bcentre|center|middle of the (?:house|row)|মাঝখানে|কেন্দ্রে\b/.test(text)) {
    entities.seatPreference = 'centre';
  } else if (/\bback row|at the back|rear|পেছনে\b/.test(text)) entities.seatPreference = 'back';
  else if (/\bfront row|at the front|সামনে\b/.test(text)) entities.seatPreference = 'front';
  else if (/\bmiddle|মাঝামাঝি\b/.test(text)) entities.seatPreference = 'middle';

  if (entities.accessibility.includes('wheelchair-spaces')) {
    const count = /(\d)\s*wheelchair/.exec(text);
    entities.wheelchairSpaces = count ? Number(count[1]) : 1;
    if (/companion|carer|সঙ্গী/.test(text)) {
      const companions = /(\d)\s*companion/.exec(text);
      entities.companionSeats = companions ? Number(companions[1]) : 1;
    }
  }

  if (/\bless walking|reduced walking|near the (?:door|entrance)|short walk|হাঁটা কম\b/.test(text)) {
    entities.reducedWalking = true;
  }
  if (/\bpremium|recliner|luxury|best seats?|ভালো সিট\b/.test(text)) entities.premium = true;
  if (/\bcheapest|cheap|lowest price|best price|সস্তা|কম দামে\b/.test(text)) entities.cheapest = true;

  const reference = /\b(nk-[23456789abcdefghjklmnpqrstuvwxyz]{6})\b/i.exec(text);
  if (reference) entities.bookingReference = reference[1]!.toUpperCase();

  for (const { match, value } of lostItemPatterns) {
    if (match.test(text)) {
      entities.lostItemCategory = value;
      break;
    }
  }
  for (const { match, value } of claimReasonPatterns) {
    if (match.test(text)) {
      entities.claimReason = value;
      break;
    }
  }

  if (/\bprice drop|cheaper|price alert|দাম কমলে/.test(text)) entities.watchKind = 'price-drop';
  else if (/\bpremium seat|recliner.*(free|open)/.test(text)) entities.watchKind = 'premium-seat';
  else if (/\bseats? together|adjacent/.test(text)) entities.watchKind = 'adjacent-seats';
  else if (/\baccessible seat|wheelchair.*(free|open)/.test(text)) {
    entities.watchKind = 'accessible-seat';
  }

  const dietary: MaxEntities['dietary'] = [];
  if (/\bvegan|ভেগান\b/.test(text)) dietary.push('vegan');
  if (/\bvegetarian|নিরামিষ\b/.test(text)) dietary.push('vegetarian');
  if (/\bhalal|হালাল\b/.test(text)) dietary.push('halal');
  if (dietary.length) entities.dietary = dietary;

  const avoid: MaxEntities['avoidAllergens'] = [];
  if (/\b(no|without|avoid|allergic to)[^.]*\b(milk|dairy|দুধ)\b/.test(text)) avoid.push('milk');
  if (/\b(no|without|avoid|allergic to)[^.]*\b(nuts?|বাদাম)\b/.test(text)) avoid.push('nuts');
  if (/\b(no|without|avoid|allergic to)[^.]*\b(peanuts?)\b/.test(text)) avoid.push('peanuts');
  if (/\b(no|without|avoid|allergic to)[^.]*\b(gluten|wheat|গম)\b/.test(text)) avoid.push('gluten');
  if (/\b(no|without|avoid|allergic to)[^.]*\b(soy|সয়া)\b/.test(text)) avoid.push('soy');
  if (/\b(no|without|avoid|allergic to)[^.]*\b(eggs?|ডিম)\b/.test(text)) avoid.push('egg');
  if (avoid.length) entities.avoidAllergens = avoid;

  const counts: Partial<TicketCounts> = {};
  const child = /(\d+)\s*(?:child|children|kids?|শিশু)/.exec(text);
  if (child) counts.child = Number(child[1]);
  const adult = /(\d+)\s*(?:adults?|প্রাপ্তবয়স্ক)/.exec(text);
  if (adult) counts.adult = Number(adult[1]);
  const senior = /(\d+)\s*(?:seniors?|elderly|প্রবীণ)/.exec(text);
  if (senior) counts.senior = Number(senior[1]);
  const student = /(\d+)\s*(?:students?|শিক্ষার্থী)/.exec(text);
  if (student) counts.student = Number(student[1]);
  if (Object.keys(counts).length > 0) entities.ticketCounts = counts;

  if (/\bchild ticket|শিশু টিকিট\b/.test(text)) entities.ticketCategory = 'child';
  else if (/\bsenior ticket|প্রবীণ টিকিট\b/.test(text)) entities.ticketCategory = 'senior';
  else if (/\bstudent ticket|শিক্ষার্থী টিকিট\b/.test(text)) entities.ticketCategory = 'student';

  return entities;
}

/* ── 6. Intent scoring ─────────────────────────────────────────────── */

interface IntentRule {
  intent: MaxIntent;
  patterns: RegExp[];
  /** Added to the score when any pattern matches. */
  weight?: number;
  /** Extra score when these entities are present. */
  boostOn?: Array<keyof MaxEntities>;
}

const intentRules: IntentRule[] = [
  {
    intent: 'greeting',
    patterns: [/^(hi|hello|hey|salaam|assalamu|আসসালামু|হ্যালো|নমস্কার)\b/],
    weight: 0.9,
  },
  {
    intent: 'capabilities',
    patterns: [/what can you do|how can you help|help me|what do you do|তুমি কী করতে পারো|সাহায্য/],
    weight: 0.8,
  },
  {
    intent: 'clear_conversation',
    patterns: [/clear (?:the )?(?:chat|conversation)|start over|reset (?:the )?chat|কথোপকথন মুছে/],
    weight: 0.95,
  },
  {
    intent: 'seat_recommend',
    patterns: [
      /\b(find|pick|choose|suggest|recommend|get|want|need)\b[^.]*\bseats?\b/,
      /\bseats? (together|near|by|next to|at the)/,
      /\bwhere should (?:i|we) sit/,
      /সিট (খুঁজে|দাও|চাই)/,
      /আসন (খুঁজে|দাও|চাই)/,
    ],
    weight: 0.85,
    boostOn: ['partySize', 'seatPreference', 'wheelchairSpaces'],
  },
  {
    intent: 'seat_clear',
    patterns: [/\b(clear|remove|deselect|undo)\b[^.]*\bseats?\b/, /সিট (বাতিল|মুছে)/],
    weight: 0.9,
  },
  {
    intent: 'group_booking',
    patterns: [/\b(group|party) of \d+|\bwe are \d+|\ball sit together|একসাথে বসতে/],
    weight: 0.8,
    boostOn: ['partySize'],
  },
  {
    intent: 'budget_optimise',
    patterns: [
      /\bcheapest\b/,
      /\bkeep (?:it|the tickets?) (?:under|within|below)/,
      /\bbest value|\bwithin my budget|\bsave money/,
      /সবচেয়ে সস্তা|কম খরচে/,
    ],
    weight: 0.85,
    boostOn: ['budget', 'cheapest'],
  },
  {
    intent: 'price_explain',
    patterns: [
      /how much|what does it cost|what.s the price|price of|pricing work/,
      /\bhow (?:is|are|do)\b[^.?]*\bprices?\b|\bprices?\b[^.?]*\bworked out\b/,
      /\bdiscount|child price|senior price|student price|booking fee/,
      /দাম কত|কত টাকা|মূল্য কত|ছাড়/,
    ],
    weight: 0.8,
  },
  {
    // Bringing your own food is a house rule, not a request for a recommendation.
    intent: 'policy_question',
    patterns: [
      /\b(can|may) i bring\b|\boutside food\b|\bown food\b|\bbring (?:my|our) own\b/,
      /বাইরের খাবার|নিজের খাবার/,
    ],
    weight: 0.92,
  },
  {
    intent: 'runtime_info',
    patterns: [
      /how long is|running time|runtime|when does it (?:end|finish)|what time.*(?:end|finish)/,
      /\bintermission|\binterval|\bbreak|\btoilet|\brestroom|\bloo\b/,
      /কতক্ষণ|দৈর্ঘ্য|বিরতি/,
    ],
    weight: 0.85,
  },
  {
    intent: 'late_arrival',
    patterns: [
      /\b(i'?m|we'?re|running|arriving|going to be) (?:going to be )?late\b/,
      /\bmiss(?:ed|ing)? the start|\bwhat if i(?:'m| am) late|\blate arrival/,
      /দেরি হয়ে|দেরিতে/,
    ],
    weight: 0.9,
  },
  {
    intent: 'lost_item',
    patterns: [
      /\b(lost|left|forgot|misplaced)\b[^.]*\b(my|a|the|it)\b/,
      /\blost (?:property|and found)|\bfound my/,
      /হারিয়ে|ফেলে এসেছি/,
    ],
    weight: 0.85,
    boostOn: ['lostItemCategory'],
  },
  {
    intent: 'insurance_claim',
    patterns: [/\bticket cover|\binsurance|\bclaim\b|\brefund because|বীমা|ক্ষতিপূরণ/],
    weight: 0.85,
    boostOn: ['claimReason'],
  },
  {
    intent: 'create_watch',
    patterns: [
      /\b(alert|notify|tell|let me know|watch|track)\b[^.]*\b(price|seats?|drop|opens?|available)/,
      /\bprice alert|\bwatch this|\bkeep an eye/,
      /দাম কমলে জানাও|জানিয়ে দিও/,
    ],
    weight: 0.85,
    boostOn: ['watchKind'],
  },
  {
    intent: 'calendar',
    patterns: [/\badd (?:this|it) to (?:my )?calendar|\bcalendar (?:file|invite)|\bics\b|ক্যালেন্ডারে/],
    weight: 0.9,
  },
  {
    intent: 'booking_lookup',
    patterns: [
      /\bmy booking|\bmy tickets?|\bbooking reference|\bwhat did i book|\bshow my/,
      /আমার বুকিং|আমার টিকিট/,
    ],
    weight: 0.85,
    boostOn: ['bookingReference'],
  },
  {
    intent: 'accessibility_query',
    patterns: [
      /\baccessib|\bwheelchair|\bcaption|\bsubtitle|\bhearing|\bdescri(?:bed|ption)|\bsensory/,
      /হুইলচেয়ার|ক্যাপশন|সাবটাইটেল/,
    ],
    weight: 0.8,
    boostOn: ['accessibility'],
  },
  {
    intent: 'concession_recommend',
    patterns: [
      /\bpopcorn|\bsnack|\bfood|\bdrink|\beat|\bcombo|\bcounter\b|\bnachos|\bhungry/,
      /খাবার|পপকর্ন|পানীয়|নাস্তা/,
    ],
    weight: 0.8,
    boostOn: ['dietary', 'avoidAllergens'],
  },
  {
    intent: 'cinema_info',
    patterns: [
      /\bparking|\bdirections|\bhow do i get to|\baddress|\bopening hours|\bamenit/,
      /পার্কিং|ঠিকানা|কীভাবে যাব/,
    ],
    weight: 0.8,
  },
  {
    intent: 'compare_showtimes',
    patterns: [/\bcompare\b|\bwhich (?:one|screening|showtime) (?:is|should)|\bdifference between/],
    weight: 0.8,
  },
  {
    intent: 'find_showtimes',
    patterns: [
      /\bshowtimes?\b|\bwhat times?\b|\bwhen is\b|\bwhen can i (?:see|watch)|\bscreenings?\b/,
      /\bshows? (?:for|of|at|after|tonight)/,
      /কখন|শো টাইম|সময়সূচি/,
    ],
    weight: 0.8,
    boostOn: ['date', 'after', 'before'],
  },
  {
    intent: 'find_movies',
    patterns: [
      /\bwhat can i (?:watch|see)|\bwhat.s on\b|\bshow me\b|\bfind (?:me )?(?:a |an |some )?(?:movie|film)/,
      /\bany good (?:movies?|films?)|\brecommend (?:a )?(?:movie|film)|\bsomething to watch/,
      /কী দেখতে পারি|সিনেমা দেখাও|ছবি দেখাও|কোন সিনেমা/,
    ],
    weight: 0.8,
    boostOn: ['genres', 'languages', 'maxRuntime'],
  },
  {
    intent: 'apply_filters',
    patterns: [
      /\b(only|just) show\b|\bfilter (?:by|to)\b|\bnarrow (?:it |this )?down/,
      /শুধু দেখাও|ফিল্টার/,
    ],
    weight: 0.75,
  },
  {
    intent: 'clear_filters',
    patterns: [/\bclear (?:the )?filters?|\breset (?:the )?filters?|\bshow everything|ফিল্টার মুছে/],
    weight: 0.9,
  },
  {
    intent: 'start_booking',
    patterns: [/\bbook (?:it|this|tickets?|me)|\bbuy tickets?|\blet.s book|বুক করো|টিকিট কাটো/],
    weight: 0.85,
  },
  {
    intent: 'movie_info',
    patterns: [
      /\bwhat is it about|\btell me about|\bwho (?:directed|stars|is in)|\bsynopsis|\bcast\b|\bplot\b/,
      /কী নিয়ে|পরিচালক|অভিনয়/,
    ],
    weight: 0.75,
    boostOn: ['movieIds'],
  },
  {
    intent: 'contact',
    patterns: [/\bcontact|\bphone number|\bcall (?:the|them)|\bemail (?:the|them)|যোগাযোগ|ফোন নম্বর/],
    weight: 0.8,
  },
  {
    intent: 'policy_question',
    patterns: [
      /\bcan i bring|\boutside food|\brefund|\bexchange|\bcancel|\barrive|\bage (?:limit|restriction)/,
      /\bdo i need an account|\blogin|\bsign ?up|\bprint (?:my )?ticket/,
      /বাইরের খাবার|ফেরত|নিয়ম/,
    ],
    weight: 0.75,
  },
];

export function scoreIntents(
  text: string,
  entities: MaxEntities,
): Array<{ intent: MaxIntent; score: number }> {
  const scores = new Map<MaxIntent, number>();

  for (const rule of intentRules) {
    const matched = rule.patterns.some((pattern) => pattern.test(text));
    if (!matched) continue;
    let score = rule.weight ?? 0.7;
    for (const key of rule.boostOn ?? []) {
      const value = entities[key];
      const present = Array.isArray(value) ? value.length > 0 : value !== undefined;
      if (present) score += 0.08;
    }
    scores.set(rule.intent, Math.max(scores.get(rule.intent) ?? 0, Math.min(1, score)));
  }

  // Entity-only queries: "sci-fi tonight" is a search even with no verb.
  if (scores.size === 0) {
    const hasSearchEntities =
      entities.genres.length > 0 ||
      entities.languages.length > 0 ||
      entities.formats.length > 0 ||
      entities.maxRuntime !== undefined;
    const hasWhen = entities.date !== undefined || entities.after !== undefined;

    if (hasSearchEntities && hasWhen) scores.set('find_showtimes', 0.6);
    else if (hasSearchEntities) scores.set('find_movies', 0.55);
    else if (hasWhen) scores.set('find_showtimes', 0.5);
    else if (entities.movieIds.length > 0) scores.set('movie_info', 0.55);
    else if (entities.cinemaIds.length > 0) scores.set('cinema_info', 0.5);
  }

  return [...scores.entries()]
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score);
}

/* ── 7. The pipeline ───────────────────────────────────────────────── */

const chipLabels: Partial<Record<keyof MaxEntities, string>> = {
  genres: 'Genre',
  languages: 'Language',
  formats: 'Format',
  cinemaIds: 'Cinema',
  accessibility: 'Access',
  date: 'Date',
  after: 'Starts after',
  before: 'Starts before',
  maxRuntime: 'Runtime',
  partySize: 'Party',
  budget: 'Budget',
  seatPreference: 'Seating',
};

function buildReadAs(entities: MaxEntities): MaxParse['readAs'] {
  const chips: MaxParse['readAs'] = [];

  if (entities.genres.length) {
    chips.push({
      id: 'genres',
      label: `${chipLabels.genres}: ${entities.genres.join(', ')}`,
      clears: 'genres',
    });
  }
  if (entities.languages.length) {
    const names = { bn: 'Bangla', en: 'English', hi: 'Hindi' };
    chips.push({
      id: 'languages',
      label: `${chipLabels.languages}: ${entities.languages.map((l) => names[l]).join(', ')}`,
      clears: 'languages',
    });
  }
  if (entities.formats.length) {
    chips.push({
      id: 'formats',
      label: `${chipLabels.formats}: ${entities.formats.join(', ')}`,
      clears: 'formats',
    });
  }
  if (entities.cinemaIds.length) {
    const names = entities.cinemaIds
      .map((id) => cinemas.find((c) => c.id === id)?.shortName)
      .filter(Boolean);
    chips.push({ id: 'cinemas', label: `${chipLabels.cinemaIds}: ${names.join(', ')}`, clears: 'cinemaIds' });
  }
  if (entities.date) {
    chips.push({
      id: 'date',
      label: `${chipLabels.date}: ${entities.dateExpression ?? entities.date}`,
      clears: 'date',
    });
  }
  if (entities.after) {
    chips.push({ id: 'after', label: `${chipLabels.after} ${entities.after}`, clears: 'after' });
  }
  if (entities.before) {
    chips.push({ id: 'before', label: `${chipLabels.before} ${entities.before}`, clears: 'before' });
  }
  if (entities.maxRuntime) {
    chips.push({
      id: 'runtime',
      label: `Under ${Math.floor(entities.maxRuntime / 60)}h ${entities.maxRuntime % 60}m`,
      clears: 'maxRuntime',
    });
  }
  if (entities.accessibility.length) {
    chips.push({
      id: 'access',
      label: `${chipLabels.accessibility}: ${entities.accessibility.join(', ')}`,
      clears: 'accessibility',
    });
  }
  if (entities.partySize) {
    chips.push({ id: 'party', label: `${chipLabels.partySize}: ${entities.partySize}`, clears: 'partySize' });
  }
  if (entities.budget) {
    chips.push({ id: 'budget', label: `${chipLabels.budget}: ৳${entities.budget}`, clears: 'budget' });
  }
  if (entities.seatPreference) {
    chips.push({
      id: 'seatPreference',
      label: `${chipLabels.seatPreference}: ${entities.seatPreference}`,
      clears: 'seatPreference',
    });
  }

  return chips;
}

export function parse(raw: string, now: Date = new Date()): MaxParse {
  const normalised = normalise(raw);
  const language = detectLanguage(raw);
  const entities = extractEntities(normalised, now);
  const ranked = scoreIntents(normalised, entities);

  let top = ranked[0];
  const runnerUp = ranked[1];

  // A film search that names a day or a time wants screenings, not a catalogue:
  // "what can I watch tonight" is answered by times, not by a list of titles.
  if (
    top?.intent === 'find_movies' &&
    (entities.date !== undefined || entities.after !== undefined || entities.before !== undefined)
  ) {
    top = { intent: 'find_showtimes', score: top.score };
  }

  let confidence = top?.score ?? 0;
  // Two intents scoring almost the same means the sentence is ambiguous.
  if (top && runnerUp && top.score - runnerUp.score < 0.08) confidence *= 0.72;
  // A very short message with no entities carries little signal.
  if (normalised.split(/\s+/).length <= 2 && buildReadAs(entities).length === 0) {
    confidence *= 0.8;
  }

  return {
    raw,
    normalised,
    language,
    intent: top?.intent ?? 'unknown',
    confidence: Number(Math.min(1, confidence).toFixed(2)),
    entities,
    readAs: buildReadAs(entities),
  };
}

/** Today's date, for skills that need it without importing the clock helpers. */
export function contextToday(now: Date = new Date()): string {
  return todayIso(now);
}
