import { describe, expect, it } from 'vitest';
import { detectLanguage, extractEntities, normalise, parse, resolveDate, resolveTimeWindow } from './nlu';
import { toIsoDate } from '@/lib/datetime';
import { addDays } from 'date-fns';

// A fixed clock so relative-date assertions are stable. 2026-08-05 is a Wednesday.
const NOW = new Date(2026, 7, 5, 14, 30, 0);

describe('normalisation', () => {
  it('converts Bengali digits so both scripts take the same path', () => {
    expect(normalise('আজ রাত ৮টার পর')).toContain('8');
  });

  it('collapses whitespace and smart quotes', () => {
    expect(normalise('  What’s   on  ')).toBe("what's on");
  });
});

describe('language detection', () => {
  it('detects English', () => {
    expect(detectLanguage('show me sci-fi tonight')).toBe('en');
  });

  it('detects Bangla', () => {
    expect(detectLanguage('আজ রাতে বাংলা সিনেমা দেখাও')).toBe('bn');
  });

  it('treats a mostly-Latin mixed sentence as English', () => {
    expect(detectLanguage('show me বাংলা films')).toBe('en');
  });
});

describe('relative dates, resolved against the local clock', () => {
  it('resolves today and tonight', () => {
    expect(resolveDate('what can i watch today', NOW).date).toBe(toIsoDate(NOW));
    expect(resolveDate('anything tonight', NOW).date).toBe(toIsoDate(NOW));
  });

  it('resolves tomorrow in both languages', () => {
    const tomorrow = toIsoDate(addDays(NOW, 1));
    expect(resolveDate('tomorrow afternoon', NOW).date).toBe(tomorrow);
    expect(resolveDate('আগামীকাল বিকেলে', NOW).date).toBe(tomorrow);
  });

  it('resolves the day after tomorrow', () => {
    expect(resolveDate('day after tomorrow', NOW).date).toBe(toIsoDate(addDays(NOW, 2)));
  });

  it('resolves this weekend to the coming Friday', () => {
    // Wednesday 5 Aug 2026 → Friday 7 Aug 2026.
    expect(resolveDate('this weekend', NOW).date).toBe('2026-08-07');
  });

  it('resolves a named weekday forwards', () => {
    expect(resolveDate('next friday', NOW).date).toBe('2026-08-07');
  });

  it('returns nothing when no date is expressed', () => {
    expect(resolveDate('find me a thriller', NOW).date).toBeUndefined();
  });
});

describe('time windows', () => {
  it('reads "after 8 pm"', () => {
    expect(resolveTimeWindow('anything after 8 pm')).toMatchObject({ after: '20:00' });
  });

  it('reads a bare "after 8" as the evening, which is what people mean', () => {
    expect(resolveTimeWindow('after 8')).toMatchObject({ after: '20:00' });
  });

  it('reads "before lunch"', () => {
    expect(resolveTimeWindow('something before lunch')).toMatchObject({ before: '12:00' });
  });

  it('reads "this afternoon" as a bounded range', () => {
    expect(resolveTimeWindow('this afternoon')).toMatchObject({ after: '12:00', before: '16:59' });
  });

  it('reads "after dinner" as the late evening', () => {
    expect(resolveTimeWindow('what can four of us watch after dinner')).toMatchObject({
      after: '20:00',
    });
  });

  it('reads a Bengali time expression', () => {
    expect(resolveTimeWindow(normalise('আজ রাত ৮টার পর'))).toMatchObject({ after: '20:00' });
  });
});

describe('entity extraction', () => {
  it('pulls genre, language and time out of one sentence', () => {
    const entities = extractEntities(normalise('Show me sci-fi movies playing after 8 PM tonight'), NOW);
    expect(entities.genres).toContain('sci-fi');
    expect(entities.after).toBe('20:00');
    expect(entities.date).toBe(toIsoDate(NOW));
  });

  it('recognises a cinema by its area name', () => {
    const entities = extractEntities(normalise('what can four people watch at Bashundhara'), NOW);
    expect(entities.cinemaIds).toContain('cin-bashundhara');
    expect(entities.partySize).toBe(4);
  });

  it('reads a runtime ceiling', () => {
    expect(extractEntities(normalise('find a movie under two hours'), NOW).maxRuntime).toBe(120);
    expect(extractEntities(normalise('something under 90 minutes'), NOW).maxRuntime).toBe(90);
  });

  it('reads a budget in taka', () => {
    expect(extractEntities(normalise('keep it under ৳1200'), NOW).budget).toBe(1200);
    expect(extractEntities(normalise('budget of 800 taka'), NOW).budget).toBe(800);
  });

  it('distinguishes open captions from closed captions', () => {
    const open = extractEntities(normalise('show open-captioned screenings'), NOW);
    const closed = extractEntities(normalise('which have closed captions'), NOW);
    expect(open.accessibility).toContain('open-captions');
    expect(open.accessibility).not.toContain('closed-captions');
    expect(closed.accessibility).toContain('closed-captions');
    expect(closed.accessibility).not.toContain('open-captions');
  });

  it('reads wheelchair and companion requirements', () => {
    const entities = extractEntities(
      normalise('I need wheelchair and companion seats'),
      NOW,
    );
    expect(entities.accessibility).toContain('wheelchair-spaces');
    expect(entities.wheelchairSpaces).toBe(1);
    expect(entities.companionSeats).toBe(1);
  });

  it('reads a Bangla accessibility request', () => {
    const entities = extractEntities(
      normalise('হুইলচেয়ার ব্যবহারকারীদের জন্য কোন শো আছে?'),
      NOW,
    );
    expect(entities.accessibility).toContain('wheelchair-spaces');
  });

  it('reads a seating preference', () => {
    expect(extractEntities(normalise('two seats near the aisle'), NOW).seatPreference).toBe('aisle');
    expect(extractEntities(normalise('three seats near the centre'), NOW).seatPreference).toBe('centre');
  });

  it('reads allergen exclusions', () => {
    const entities = extractEntities(normalise('something without nuts please'), NOW);
    expect(entities.avoidAllergens).toContain('nuts');
  });

  it('recognises a booking reference', () => {
    expect(extractEntities(normalise('what about NK-7F2K9Q'), NOW).bookingReference).toBe('NK-7F2K9Q');
  });

  it('recognises a film by a distinctive word in its title', () => {
    expect(extractEntities(normalise('how long is the odyssey'), NOW).movieIds).toContain(
      'mov-the-odyssey',
    );
  });
});

describe('intent detection', () => {
  const cases: Array<[string, string]> = [
    ['Show me sci-fi movies playing after 8 PM tonight', 'find_showtimes'],
    ['What can I watch tonight?', 'find_showtimes'],
    ['Find me three seats together', 'seat_recommend'],
    ['I want two seats near the aisle', 'seat_recommend'],
    ['How long is Supergirl?', 'runtime_info'],
    ['When does it end?', 'runtime_info'],
    ['How is a ticket price worked out?', 'price_explain'],
    ['What is the cheapest showtime?', 'budget_optimise'],
    ['I left my phone in the cinema', 'lost_item'],
    ["I'm running late", 'late_arrival'],
    ['Is there parking at Uttara?', 'cinema_info'],
    ['Can I bring my own food?', 'policy_question'],
    ['Tell me about Ticket Cover', 'insurance_claim'],
    ['Let me know if the price drops', 'create_watch'],
    ['Add this to my calendar', 'calendar'],
    ['Clear the filters', 'clear_filters'],
    ['What can you do?', 'capabilities'],
    ['hello', 'greeting'],
  ];

  for (const [input, expected] of cases) {
    it(`reads "${input}" as ${expected}`, () => {
      expect(parse(input, NOW).intent).toBe(expected);
    });
  }

  it('handles a Bangla booking request', () => {
    const result = parse('আজ রাত ৮টার পর বাংলা সিনেমা দেখাও', NOW);
    expect(result.language).toBe('bn');
    expect(result.entities.languages).toContain('bn');
    expect(result.entities.after).toBe('20:00');
    expect(['find_showtimes', 'find_movies']).toContain(result.intent);
  });

  it('handles a Bangla seat request', () => {
    const result = parse('আগামীকাল বিকেলে তিনটি সিট একসাথে খুঁজে দাও', NOW);
    expect(result.language).toBe('bn');
    expect(result.entities.date).toBe(toIsoDate(addDays(NOW, 1)));
  });

  it('is low-confidence on a message with no signal', () => {
    const result = parse('hmm ok', NOW);
    expect(result.confidence).toBeLessThan(0.45);
  });

  it('surfaces what it understood as removable chips', () => {
    const result = parse('Bangla films tomorrow after 7pm at Agrabad', NOW);
    const labels = result.readAs.map((chip) => chip.label).join(' | ');
    expect(labels).toMatch(/Language/);
    expect(labels).toMatch(/Date/);
    expect(labels).toMatch(/Starts after/);
    expect(labels).toMatch(/Cinema/);
  });
});
