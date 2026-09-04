import type { Offer } from './types';

/**
 * Sample promotional offers.
 *
 * Every offer below is a demonstration mechanic authored for this build.
 * There are no partner relationships here, real or implied, and no offer
 * artwork was supplied with the project — each is set typographically.
 */
export const offers: Offer[] = [
  {
    id: 'off-matinee',
    slug: 'before-three',
    title: 'Before Three',
    titleBn: 'তিনটার আগে',
    summary: 'Every screening that starts before 3:00 pm is ৳60 cheaper per seat.',
    detail:
      'This is not a coupon and there is nothing to enter. Any screening starting before three in the afternoon is priced down automatically, on every seat class and in every house. It applies seven days a week, including holidays.',
    mechanic: '৳60 off each seat, applied automatically to screenings starting before 3:00 pm.',
    days: [],
    terms: [
      'Applies to the seat price before the ticket-category discount.',
      'Stacks with child, student and senior category pricing.',
      'The ৳20 per-ticket booking fee still applies.',
    ],
    cinemaIds: 'all',
    plate: 0,
  },
  {
    id: 'off-family-four',
    slug: 'family-of-four',
    title: 'Family of Four',
    titleBn: 'চারজনের পরিবার',
    summary: 'Book two adult and two child tickets together and the Family box drops to ৳950.',
    detail:
      'Add the Family box to a booking that already contains at least two adult and two child tickets, and it is priced at ৳950 instead of ৳1,150. The discount appears on the concessions step as soon as the ticket mix qualifies.',
    mechanic: '৳200 off the Family box when the booking holds 2+ adult and 2+ child tickets.',
    days: [],
    terms: [
      'One discounted Family box per booking.',
      'The ticket mix is read from the booking itself — there is no code to enter.',
      'Available at every house that stocks the Family box.',
    ],
    cinemaIds: 'all',
    plate: 1,
  },
  {
    id: 'off-late-repertory',
    slug: 'late-repertory',
    title: 'The Late Repertory',
    titleBn: 'নৈশ রেপার্টরি',
    summary: 'Thursday nights at Dhanmondi, every seat at the regular rate whatever the house.',
    detail:
      'The 10:45 pm Thursday strand at GrandPlex Dhanmondi is priced flat: premium and recliner seats are charged at the regular seat rate. Format uplifts still apply, so a 3D screening is still a 3D screening.',
    mechanic: 'Premium and recliner seats charged at the regular seat base for Thursday screenings from 10 pm at Dhanmondi.',
    days: [4],
    terms: [
      'GrandPlex Dhanmondi only.',
      'Screenings starting at or after 10 pm on Thursdays.',
      'Format uplifts and the booking fee are unchanged.',
    ],
    cinemaIds: ['cin-dhanmondi'],
    plate: 2,
  },
  {
    id: 'off-sensory',
    slug: 'sensory-friendly-matinee',
    title: 'Sensory-Friendly Matinee',
    titleBn: 'সংবেদনশীল ম্যাটিনি',
    summary: 'First Saturday of the month at Bashundhara. House lights half up, sound brought down.',
    detail:
      'A monthly screening in House Three at GrandPlex Bashundhara with the house lights kept partly up, the volume reduced, no trailers before the feature, and freedom to move around or leave and return during the film. Companion tickets are free — ask the box office rather than booking them online.',
    mechanic: 'Reduced-sensory presentation; companion entry free at the box office.',
    days: [6],
    terms: [
      'GrandPlex Bashundhara, House Three.',
      'Companion tickets are issued at the box office, not through this site.',
      'Standard seat pricing otherwise applies.',
    ],
    cinemaIds: ['cin-bashundhara'],
    plate: 3,
  },
  {
    id: 'off-student-weeknight',
    slug: 'student-weeknights',
    title: 'Student Weeknights',
    titleBn: 'শিক্ষার্থী সন্ধ্যা',
    summary: 'Sunday to Wednesday, the student rate is 15% off the adult seat price.',
    detail:
      'The student ticket category is available every day, and on Sunday through Wednesday it is the best value on the site. Bring a valid student ID — the door checks it, and this site does not.',
    mechanic: 'Student category charged at 0.85× the seat price, every day.',
    days: [0, 1, 2, 3],
    terms: [
      'Valid student photo ID required at the door.',
      'This site does not verify student status.',
      'One student ticket per ID.',
    ],
    cinemaIds: 'all',
    plate: 4,
  },
];

export const offerById = new Map(offers.map((o) => [o.id, o]));
export const offerBySlug = new Map(offers.map((o) => [o.slug, o]));

export function offersForCinema(cinemaId: string | null): Offer[] {
  if (!cinemaId) return offers;
  return offers.filter((o) => o.cinemaIds === 'all' || o.cinemaIds.includes(cinemaId));
}
