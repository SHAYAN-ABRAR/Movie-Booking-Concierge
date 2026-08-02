import type { Cinema, Screen, ScreenSeatRule } from './types';

/**
 * Venue seed data for the Nokshi Cinemas demonstration.
 *
 * These are original venues written for this build. They are not the branches,
 * addresses, phone numbers or policies of any real cinema operator.
 */

const alphabet = 'ABCDEFGHIJKLMNOP'.split('');

function layout(opts: {
  rowCount: number;
  seatsPerRow: number;
  aislesAfter: number[];
  premiumFrom?: number;
  reclinerFrom?: number;
  wheelchairRow?: string;
  missing?: string[];
}): ScreenSeatRule {
  const rows = alphabet.slice(0, opts.rowCount);
  const premiumRows = opts.premiumFrom === undefined ? [] : rows.slice(opts.premiumFrom);
  const reclinerRows = opts.reclinerFrom === undefined ? [] : rows.slice(opts.reclinerFrom);
  const wcRow = opts.wheelchairRow ?? rows[Math.floor(rows.length / 2)]!;
  return {
    rows,
    seatsPerRow: opts.seatsPerRow,
    aislesAfter: opts.aislesAfter,
    premiumRows: premiumRows.filter((r) => !reclinerRows.includes(r)),
    reclinerRows,
    // Wheelchair spaces sit at the head of a mid-house row, beside an aisle.
    wheelchairSpaces: [`${wcRow}1`, `${wcRow}2`],
    companionSeats: [`${wcRow}3`, `${wcRow}4`],
    ...(opts.missing ? { missing: opts.missing } : {}),
  };
}

function screen(
  id: string,
  name: string,
  format: Screen['format'],
  rule: ScreenSeatRule,
  accessibility: Screen['accessibility'],
): Screen {
  const missing = rule.missing?.length ?? 0;
  return {
    id,
    name,
    format,
    capacity: rule.rows.length * rule.seatsPerRow - missing,
    layout: rule,
    accessibility,
  };
}

export const cinemas: Cinema[] = [
  {
    id: 'cin-dhanmondi',
    slug: 'dhanmondi',
    name: 'Nokshi Dhanmondi',
    nameBn: 'নকশী ধানমন্ডি',
    shortName: 'Dhanmondi',
    city: 'Dhaka',
    area: 'Dhanmondi',
    addressLines: ['Level 6, Shatabdi Centre', 'Road 27, Dhanmondi', 'Dhaka 1209'],
    mapQuery: 'Shatabdi Centre, Road 27, Dhanmondi, Dhaka 1209',
    phone: '+880 2 9110 480',
    email: 'dhanmondi@nokshicinemas.example',
    openingHours: 'Daily, 10:30 – 00:30',
    boxOfficeHours: 'Daily, 10:00 – 23:00',
    screens: [
      screen(
        'scr-dh-1',
        'House One',
        'grandscreen',
        layout({ rowCount: 12, seatsPerRow: 18, aislesAfter: [4, 14], premiumFrom: 5, wheelchairRow: 'F' }),
        ['closed-captions', 'wheelchair-spaces', 'hearing-loop', 'audio-description'],
      ),
      screen(
        'scr-dh-2',
        'House Two',
        'standard',
        layout({ rowCount: 9, seatsPerRow: 14, aislesAfter: [3, 11], premiumFrom: 5, wheelchairRow: 'E' }),
        ['closed-captions', 'wheelchair-spaces'],
      ),
      screen(
        'scr-dh-3',
        'The Velvet Room',
        'velvet',
        layout({ rowCount: 6, seatsPerRow: 10, aislesAfter: [5], reclinerFrom: 0, wheelchairRow: 'C' }),
        ['closed-captions', 'wheelchair-spaces', 'hearing-loop'],
      ),
      screen(
        'scr-dh-4',
        'House Four',
        'three-d',
        layout({ rowCount: 10, seatsPerRow: 16, aislesAfter: [4, 12], premiumFrom: 6, wheelchairRow: 'E' }),
        ['wheelchair-spaces', 'open-captions'],
      ),
    ],
    amenities: ['parking', 'cafe', 'lounge', 'atm', 'prayer-room', 'baby-change', 'gift-card'],
    accessibility: [
      'step-free-access',
      'accessible-toilet',
      'hearing-loop',
      'companion-seat',
      'assistance-dogs',
      'lift-access',
      'accessible-parking',
    ],
    transportNote:
      'Rickshaw and CNG drop-off is on Road 27 directly outside the lobby entrance. The nearest bus stops are at Dhanmondi 27 junction, a two-minute walk.',
    parkingNote:
      'Basement parking for 140 cars, with four accessible bays beside the lift lobby. Validated for three hours with a same-day ticket.',
    lateArrivalPolicy:
      'Latecomers are seated at a natural break in the film, normally within the first 20 minutes. After that, staff will seat you at the rear of the house to avoid disturbing other guests. Tickets are not refundable for late arrival.',
    trailerMinutes: 12,
    lostAndFound: {
      email: 'lostandfound.dhanmondi@nokshicinemas.example',
      phone: '+880 2 9110 484',
      hours: 'Daily, 11:00 – 20:00',
      holdingPeriodDays: 21,
    },
    description:
      'The first house we opened, and still the one that sets the programme. Six floors up, with a lobby that keeps its lights low and its ceiling high, Dhanmondi runs the widest slate — first-run features in House One, and a late repertory strand that rarely plays anywhere else in the city.',
    signature: 'Home of the late repertory strand, Thursdays at 22:45.',
  },
  {
    id: 'cin-bashundhara',
    slug: 'bashundhara',
    name: 'Nokshi Bashundhara',
    nameBn: 'নকশী বসুন্ধরা',
    shortName: 'Bashundhara',
    city: 'Dhaka',
    area: 'Bashundhara',
    addressLines: ['Level 9, Meridian Tower', 'Block C, Bashundhara R/A', 'Dhaka 1229'],
    mapQuery: 'Meridian Tower, Block C, Bashundhara R/A, Dhaka 1229',
    phone: '+880 2 8412 700',
    email: 'bashundhara@nokshicinemas.example',
    openingHours: 'Daily, 10:00 – 01:00',
    boxOfficeHours: 'Daily, 09:30 – 23:30',
    screens: [
      screen(
        'scr-bs-1',
        'The Great Hall',
        'grandscreen',
        layout({ rowCount: 14, seatsPerRow: 20, aislesAfter: [5, 15], premiumFrom: 6, wheelchairRow: 'G' }),
        ['closed-captions', 'open-captions', 'wheelchair-spaces', 'hearing-loop', 'audio-description'],
      ),
      screen(
        'scr-bs-2',
        'House Two',
        'three-d',
        layout({ rowCount: 11, seatsPerRow: 18, aislesAfter: [4, 14], premiumFrom: 6, wheelchairRow: 'F' }),
        ['closed-captions', 'wheelchair-spaces'],
      ),
      screen(
        'scr-bs-3',
        'House Three',
        'standard',
        layout({ rowCount: 10, seatsPerRow: 16, aislesAfter: [4, 12], premiumFrom: 6, wheelchairRow: 'E' }),
        ['closed-captions', 'wheelchair-spaces', 'sensory-friendly'],
      ),
      screen(
        'scr-bs-4',
        'The Velvet Room',
        'velvet',
        layout({ rowCount: 7, seatsPerRow: 12, aislesAfter: [6], reclinerFrom: 0, wheelchairRow: 'D' }),
        ['closed-captions', 'wheelchair-spaces', 'hearing-loop'],
      ),
      screen(
        'scr-bs-5',
        'House Five',
        'standard',
        layout({ rowCount: 8, seatsPerRow: 14, aislesAfter: [3, 11], premiumFrom: 5, wheelchairRow: 'D' }),
        ['wheelchair-spaces'],
      ),
    ],
    amenities: ['parking', 'cafe', 'lounge', 'atm', 'prayer-room', 'baby-change', 'cloakroom', 'gift-card'],
    accessibility: [
      'step-free-access',
      'accessible-toilet',
      'hearing-loop',
      'companion-seat',
      'assistance-dogs',
      'lift-access',
      'accessible-parking',
    ],
    transportNote:
      'Enter from the Block C service road. Ride-share pickup is on Level 2 of the car park, signed from the lobby.',
    parkingNote:
      'Multi-storey parking on Levels 2 to 5, 320 spaces, six accessible bays on Level 2 beside the lift core. Free for the first four hours with a ticket.',
    lateArrivalPolicy:
      'Our largest house holds latecomers in the corridor until the first scene change, usually inside 15 minutes. Staff will show you to your seat with a shaded torch. Tickets are not refundable for late arrival.',
    trailerMinutes: 15,
    lostAndFound: {
      email: 'lostandfound.bashundhara@nokshicinemas.example',
      phone: '+880 2 8412 706',
      hours: 'Daily, 10:30 – 21:00',
      holdingPeriodDays: 30,
    },
    description:
      'Five houses on one floor, built around a lobby wide enough to hold a queue without it feeling like one. The Great Hall seats 280 and takes the biggest openings; House Three runs a monthly sensory-friendly matinee with the house lights half up and the sound brought down.',
    signature: 'Monthly sensory-friendly matinee in House Three, first Saturday.',
  },
  {
    id: 'cin-uttara',
    slug: 'uttara',
    name: 'Nokshi Uttara',
    nameBn: 'নকশী উত্তরা',
    shortName: 'Uttara',
    city: 'Dhaka',
    area: 'Uttara',
    addressLines: ['Level 4, Sector 7 Arcade', 'Sonargaon Janapath, Uttara', 'Dhaka 1230'],
    mapQuery: 'Sector 7 Arcade, Sonargaon Janapath, Uttara, Dhaka 1230',
    phone: '+880 2 5895 220',
    email: 'uttara@nokshicinemas.example',
    openingHours: 'Daily, 11:00 – 00:00',
    boxOfficeHours: 'Daily, 10:30 – 22:30',
    screens: [
      screen(
        'scr-ut-1',
        'House One',
        'standard',
        layout({ rowCount: 11, seatsPerRow: 16, aislesAfter: [4, 12], premiumFrom: 6, wheelchairRow: 'F' }),
        ['closed-captions', 'wheelchair-spaces', 'hearing-loop'],
      ),
      screen(
        'scr-ut-2',
        'House Two',
        'three-d',
        layout({ rowCount: 9, seatsPerRow: 16, aislesAfter: [4, 12], premiumFrom: 5, wheelchairRow: 'E' }),
        ['wheelchair-spaces', 'open-captions'],
      ),
      screen(
        'scr-ut-3',
        'House Three',
        'standard',
        layout({ rowCount: 8, seatsPerRow: 12, aislesAfter: [3, 9], premiumFrom: 5, wheelchairRow: 'D' }),
        ['closed-captions', 'wheelchair-spaces'],
      ),
    ],
    amenities: ['parking', 'cafe', 'atm', 'prayer-room', 'baby-change', 'gift-card'],
    accessibility: [
      'step-free-access',
      'accessible-toilet',
      'hearing-loop',
      'companion-seat',
      'lift-access',
    ],
    transportNote:
      'Two minutes on foot from the Sector 7 roundabout. The arcade lift reaches Level 4 directly from the ground-floor entrance.',
    parkingNote:
      'Shared arcade parking, 90 spaces, two accessible bays. Charged at the arcade rate; cinema tickets do not validate parking here.',
    lateArrivalPolicy:
      'Latecomers are seated at any point during the film in our smaller houses, using the rear aisle. Tickets are not refundable for late arrival.',
    trailerMinutes: 10,
    lostAndFound: {
      email: 'lostandfound.uttara@nokshicinemas.example',
      phone: '+880 2 5895 224',
      hours: 'Daily, 12:00 – 20:00',
      holdingPeriodDays: 14,
    },
    description:
      'The neighbourhood house. Three modest screens, a short walk from the sector roundabout, and the earliest first show in the circuit at 11:15. Uttara programmes for families before three in the afternoon and for everyone else after it.',
    signature: 'Earliest first show in the circuit — 11:15 daily.',
  },
  {
    id: 'cin-agrabad',
    slug: 'agrabad',
    name: 'Nokshi Agrabad',
    nameBn: 'নকশী আগ্রাবাদ',
    shortName: 'Agrabad',
    city: 'Chattogram',
    area: 'Agrabad',
    addressLines: ['Level 5, Harbour Point', 'Agrabad Commercial Area', 'Chattogram 4100'],
    mapQuery: 'Harbour Point, Agrabad Commercial Area, Chattogram 4100',
    phone: '+880 31 2510 900',
    email: 'agrabad@nokshicinemas.example',
    openingHours: 'Daily, 11:00 – 23:45',
    boxOfficeHours: 'Daily, 10:30 – 22:30',
    screens: [
      screen(
        'scr-ag-1',
        'Harbour Hall',
        'grandscreen',
        layout({ rowCount: 12, seatsPerRow: 18, aislesAfter: [4, 14], premiumFrom: 6, wheelchairRow: 'F' }),
        ['closed-captions', 'wheelchair-spaces', 'hearing-loop', 'audio-description'],
      ),
      screen(
        'scr-ag-2',
        'House Two',
        'standard',
        layout({ rowCount: 10, seatsPerRow: 14, aislesAfter: [3, 11], premiumFrom: 5, wheelchairRow: 'E' }),
        ['closed-captions', 'wheelchair-spaces'],
      ),
      screen(
        'scr-ag-3',
        'The Velvet Room',
        'velvet',
        layout({ rowCount: 6, seatsPerRow: 10, aislesAfter: [5], reclinerFrom: 0, wheelchairRow: 'C' }),
        ['wheelchair-spaces', 'hearing-loop'],
      ),
    ],
    amenities: ['parking', 'cafe', 'lounge', 'prayer-room', 'baby-change', 'gift-card'],
    accessibility: [
      'step-free-access',
      'accessible-toilet',
      'hearing-loop',
      'companion-seat',
      'assistance-dogs',
      'lift-access',
    ],
    transportNote:
      'Ten minutes from Agrabad crossing. Taxi and ride-share drop-off is on the Harbour Point forecourt.',
    parkingNote:
      'Forecourt and basement parking, 110 spaces, three accessible bays at the forecourt entrance. Free for two hours.',
    lateArrivalPolicy:
      'Latecomers are seated at a natural break within the first 20 minutes. Tickets are not refundable for late arrival.',
    trailerMinutes: 12,
    lostAndFound: {
      email: 'lostandfound.agrabad@nokshicinemas.example',
      phone: '+880 31 2510 906',
      hours: 'Daily, 11:30 – 20:00',
      holdingPeriodDays: 21,
    },
    description:
      'Our first house outside Dhaka, and the one with the view — the Harbour Hall foyer looks north over the port. The programme leans harder on Bangla-language first runs here than anywhere else in the circuit.',
    signature: 'The strongest Bangla-language slate in the circuit.',
  },
  {
    id: 'cin-zindabazar',
    slug: 'zindabazar',
    name: 'Nokshi Zindabazar',
    nameBn: 'নকশী জিন্দাবাজার',
    shortName: 'Zindabazar',
    city: 'Sylhet',
    area: 'Zindabazar',
    addressLines: ['Level 3, Kotwali Plaza', 'Zindabazar Road', 'Sylhet 3100'],
    mapQuery: 'Kotwali Plaza, Zindabazar Road, Sylhet 3100',
    phone: '+880 821 726 340',
    email: 'zindabazar@nokshicinemas.example',
    openingHours: 'Daily, 11:30 – 23:30',
    boxOfficeHours: 'Daily, 11:00 – 22:00',
    screens: [
      screen(
        'scr-zb-1',
        'House One',
        'standard',
        layout({ rowCount: 10, seatsPerRow: 16, aislesAfter: [4, 12], premiumFrom: 5, wheelchairRow: 'E' }),
        ['closed-captions', 'wheelchair-spaces', 'hearing-loop'],
      ),
      screen(
        'scr-zb-2',
        'House Two',
        'three-d',
        layout({ rowCount: 8, seatsPerRow: 14, aislesAfter: [3, 11], premiumFrom: 5, wheelchairRow: 'D' }),
        ['wheelchair-spaces', 'open-captions'],
      ),
    ],
    amenities: ['cafe', 'atm', 'prayer-room', 'gift-card'],
    accessibility: ['step-free-access', 'accessible-toilet', 'hearing-loop', 'companion-seat', 'lift-access'],
    transportNote:
      'On the Zindabazar high street. The plaza lift serves Level 3; the stair entrance is beside the sweet shop.',
    parkingNote:
      'No dedicated cinema car park. Street parking on Kotwali Road and a paid lot 200 metres north. No accessible bays are reserved for the cinema.',
    lateArrivalPolicy:
      'Latecomers are seated throughout the film. Staff will use the rear aisle. Tickets are not refundable for late arrival.',
    trailerMinutes: 10,
    lostAndFound: {
      email: 'lostandfound.zindabazar@nokshicinemas.example',
      phone: '+880 821 726 344',
      hours: 'Daily, 12:00 – 19:30',
      holdingPeriodDays: 14,
    },
    description:
      'Two screens above the high street, with the smallest lobby and the loudest audiences in the circuit. Zindabazar keeps a matinee running every day of the week, holidays included.',
    signature: 'A matinee every single day, holidays included.',
  },
];

export const cinemaById = new Map(cinemas.map((c) => [c.id, c]));
export const cinemaBySlug = new Map(cinemas.map((c) => [c.slug, c]));

export const screenById = new Map(
  cinemas.flatMap((c) => c.screens.map((s) => [s.id, { screen: s, cinema: c }] as const)),
);

export const cities = [...new Set(cinemas.map((c) => c.city))];
