import {
  accessibilityBlurbs,
  accessibilityLabels,
  cinemaById,
  cinemas,
  concessionById,
  concessionsFor,
  faq,
  filterMovies,
  filterShowtimes,
  formatLabels,
  genreLabels,
  languageLabels,
  movieById,
  movies,
  nowShowing,
} from '@/data';
import { certificates, ticketCategories, BOOKING_FEE_PER_TICKET } from '@/data/pricing';
import { COMPANY, insurancePolicy, refundPolicy } from '@/data/policies';
import { availabilityFor, getShowtime, screeningEndMinutes, showtimesForDate } from '@/data/schedule';
import { adultPriceRange, explainSeatPrice, totalTickets } from '@/lib/bookingMath';
import { findSeats, largestContiguousRun } from '@/lib/seatFinder';
import { dateWindow, dayLabel, displayTime, formatRuntime, minutesFromTime, timeFromMinutes } from '@/lib/datetime';
import { listSentence, money, pluralise, seatRanges } from '@/lib/format';
import { useBookings } from '@/store/bookings';
import { claimChecklistTemplate } from '@/store/reports';
import { useWatches, watchKindLabel } from '@/store/watches';
import type { MovieFilter } from '@/data';
import type { Movie, Showtime } from '@/data/types';
import type { MaxAction, MaxBlock, MaxContext, MaxParse, MaxReply } from './types';

/**
 * Max's skills.
 *
 * Each skill turns a parse plus the current application context into a typed
 * reply. Skills only read from the same seed data and the same pricing and
 * seat-finding functions the rest of the site uses, so Max can never quote a
 * price or an availability the interface disagrees with.
 */

type Lang = 'en' | 'bn';

/** Picks the reply language. Bangla strings exist for the core booking intents. */
function t(lang: Lang, en: string, bn?: string): string {
  return lang === 'bn' && bn ? bn : en;
}

function reply(input: Partial<MaxReply> & { text: string }): MaxReply {
  return {
    text: input.text,
    blocks: input.blocks ?? [],
    actions: input.actions ?? [],
    ...(input.clarify ? { clarify: input.clarify } : {}),
    source: 'local',
  };
}

const DEMO_NOTE_SCHEDULE =
  'Schedule and seat availability here are generated locally for this demonstration — not live cinema inventory.';

/* ── Shared helpers ────────────────────────────────────────────────── */

function entitiesToFilter(parse: MaxParse, context: MaxContext): MovieFilter {
  const { entities } = parse;
  return {
    ...(entities.genres.length ? { genres: entities.genres } : {}),
    ...(entities.languages.length ? { languages: entities.languages } : {}),
    ...(entities.formats.length ? { formats: entities.formats } : {}),
    ...(entities.accessibility.length ? { accessibility: entities.accessibility } : {}),
    ...(entities.maxRuntime !== undefined ? { maxRuntime: entities.maxRuntime } : {}),
    ...(entities.budget !== undefined ? { maxPrice: entities.budget } : {}),
    ...(entities.after ? { after: entities.after } : {}),
    ...(entities.before ? { before: entities.before } : {}),
    ...(entities.cinemaIds.length
      ? { cinemaIds: entities.cinemaIds }
      : context.cinemaId
        ? { cinemaIds: [context.cinemaId] }
        : {}),
    ...(entities.date ? { date: entities.date } : {}),
  };
}

/** The film the customer is most likely talking about right now. */
function focusMovie(parse: MaxParse, context: MaxContext): Movie | null {
  if (parse.entities.movieIds[0]) return movieById.get(parse.entities.movieIds[0]) ?? null;
  if (context.booking.movieId) return movieById.get(context.booking.movieId) ?? null;
  if (context.movieId) return movieById.get(context.movieId) ?? null;
  return null;
}

/** The screening in play: the booking's, or the one being viewed. */
function focusShowtime(context: MaxContext): Showtime | null {
  const id = context.booking.showtimeId ?? context.showtimeId;
  return id ? getShowtime(id) : null;
}

function screeningLine(showtime: Showtime): string {
  const movie = movieById.get(showtime.movieId);
  const cinema = cinemaById.get(showtime.cinemaId);
  return `${movie?.title ?? 'Screening'} · ${dayLabel(showtime.date)} ${displayTime(showtime.time)} · ${cinema?.shortName ?? ''} · ${formatLabels[showtime.format]}`;
}

/* ══════════════════════════════════════════════════════════════════════
   DISCOVERY
   ══════════════════════════════════════════════════════════════════════ */

function findMoviesSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const filter = entitiesToFilter(parse, context);
  const results = filterMovies({ ...filter, status: 'now-showing' });

  const blocks: MaxBlock[] = [];
  if (parse.readAs.length) blocks.push({ kind: 'read-as', chips: parse.readAs });

  if (results.length === 0) {
    const relaxed = filterMovies({
      ...(filter.genres ? { genres: filter.genres } : {}),
      status: 'now-showing',
    });
    blocks.push({
      kind: 'text',
      text: t(
        lang,
        relaxed.length > 0
          ? `Nothing matches all of that. Dropping the time and cinema, there ${relaxed.length === 1 ? 'is 1 film' : `are ${relaxed.length} films`} that would fit.`
          : 'Nothing in the current programme matches that.',
        relaxed.length > 0
          ? `সব শর্ত মেলে এমন কিছু নেই। সময় ও সিনেমা হল বাদ দিলে ${relaxed.length}টি ছবি মেলে।`
          : 'বর্তমান তালিকায় এর সাথে মেলে এমন কিছু নেই।',
      ),
    });
    if (relaxed.length > 0) blocks.push({ kind: 'movies', movieIds: relaxed.slice(0, 4).map((m) => m.id) });

    return reply({
      text: t(lang, 'No films match every filter.', 'সব ফিল্টারে মেলে এমন ছবি নেই।'),
      blocks,
      actions: [
        { type: 'clear_filters', label: t(lang, 'Clear filters', 'ফিল্টার মুছুন') },
        { type: 'navigate', label: t(lang, 'Browse the programme', 'পুরো তালিকা দেখুন'), to: '/movies' },
      ],
    });
  }

  const summary = t(
    lang,
    `${results.length === 1 ? '1 film' : `${results.length} films`}${parse.readAs.length ? ' match what you asked for' : ' on now'}.`,
    `${results.length}টি ছবি${parse.readAs.length ? ' আপনার শর্তে মিলেছে' : ' এখন চলছে'}।`,
  );

  blocks.push({ kind: 'text', text: summary });
  blocks.push({ kind: 'movies', movieIds: results.slice(0, 6).map((m) => m.id) });

  const actions: MaxAction[] = [
    {
      type: 'apply_filters',
      label: t(lang, 'Show these on the programme page', 'তালিকা পাতায় দেখুন'),
      filter,
      to: '/movies',
    },
  ];
  if (results[0]) {
    actions.push({
      type: 'navigate',
      label: t(lang, `Open ${results[0].title}`, `${results[0].title} খুলুন`),
      to: `/movies/${results[0].slug}`,
    });
  }

  return reply({ text: summary, blocks, actions });
}

function findShowtimesSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const filter = entitiesToFilter(parse, context);
  const date = parse.entities.date ?? context.date ?? dateWindow(1)[0]!;
  const movie = focusMovie(parse, context);

  const results = filterShowtimes(date, filter, movie?.id)
    .filter((s) => availabilityFor(s).level !== 'sold-out')
    .sort((a, b) => a.time.localeCompare(b.time));

  const blocks: MaxBlock[] = [];
  if (parse.readAs.length) blocks.push({ kind: 'read-as', chips: parse.readAs });

  if (results.length === 0) {
    // Look forward a few days before giving up — that is usually the answer.
    const window = dateWindow(6);
    const later = window
      .slice(1)
      .flatMap((day) => filterShowtimes(day, { ...filter, date: day }, movie?.id))
      .filter((s) => availabilityFor(s).level !== 'sold-out')
      .slice(0, 4);

    blocks.push({
      kind: 'text',
      text: t(
        lang,
        later.length
          ? `Nothing on ${dayLabel(date).toLowerCase()} fits that. The next screenings that do are below.`
          : `Nothing on ${dayLabel(date).toLowerCase()} fits that, and nothing in the next few days either.`,
        later.length
          ? `${dayLabel(date)} এ কিছু মেলেনি। এর পরের শোগুলো নিচে দেওয়া হলো।`
          : `${dayLabel(date)} বা আগামী কয়েক দিনেও কিছু মেলেনি।`,
      ),
    });
    if (later.length) blocks.push({ kind: 'showtimes', showtimeIds: later.map((s) => s.id), showCinema: true });

    return reply({
      text: t(lang, 'No screenings match that.', 'এই শর্তে কোনো শো নেই।'),
      blocks,
      actions: [
        { type: 'navigate', label: t(lang, 'Open showtimes', 'শোটাইম দেখুন'), to: '/showtimes' },
      ],
    });
  }

  const whenPhrase = [
    parse.entities.dateExpression ?? dayLabel(date).toLowerCase(),
    parse.entities.timeExpression,
  ]
    .filter(Boolean)
    .join(' ');

  const genrePhrase = parse.entities.genres.length
    ? `${parse.entities.genres.map((g) => genreLabels[g]).join('/')} `
    : '';

  const summary = t(
    lang,
    `I found ${results.length} ${genrePhrase}screening${results.length === 1 ? '' : 's'} ${whenPhrase}.`,
    `${whenPhrase} সময়ে ${results.length}টি শো পেয়েছি।`,
  );

  blocks.push({ kind: 'text', text: summary });
  blocks.push({
    kind: 'showtimes',
    showtimeIds: results.slice(0, 6).map((s) => s.id),
    showCinema: !filter.cinemaIds?.length,
  });
  blocks.push({ kind: 'demo-note', text: DEMO_NOTE_SCHEDULE });

  const actions: MaxAction[] = [
    {
      type: 'apply_filters',
      label: t(lang, 'See all of these', 'সবগুলো দেখুন'),
      filter: { ...filter, date },
      to: '/showtimes',
    },
  ];

  const cheapest = [...results].sort(
    (a, b) => adultPriceRange(a).min - adultPriceRange(b).min,
  )[0];
  if (cheapest && results.length > 1) {
    const cheapestMovie = movieById.get(cheapest.movieId);
    actions.push({
      type: 'start_booking',
      label: t(
        lang,
        `Book the cheapest — ${displayTime(cheapest.time)}, ${money(adultPriceRange(cheapest).min)}`,
        `সবচেয়ে সস্তা বুক করুন — ${displayTime(cheapest.time)}`,
      ),
      movieSlug: cheapestMovie?.slug ?? '',
      showtimeId: cheapest.id,
    });
  }

  return reply({ text: summary, blocks, actions });
}

function compareShowtimesSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const date = parse.entities.date ?? context.date ?? dateWindow(1)[0]!;
  const movie = focusMovie(parse, context);
  const filter = entitiesToFilter(parse, context);

  const candidates = filterShowtimes(date, filter, movie?.id)
    .filter((s) => availabilityFor(s).level !== 'sold-out')
    .slice(0, 4);

  if (candidates.length < 2) {
    return reply({
      text: t(
        lang,
        'I need at least two screenings to compare. Narrow it to a film and a day and I will lay them side by side.',
        'তুলনা করতে অন্তত দুটি শো দরকার। একটি ছবি ও দিন বেছে দিন।',
      ),
      actions: [{ type: 'navigate', label: 'Open showtimes', to: '/showtimes' }],
    });
  }

  const rows = candidates.map((showtime) => {
    const cinema = cinemaById.get(showtime.cinemaId);
    const availability = availabilityFor(showtime);
    const price = adultPriceRange(showtime);
    const ends = timeFromMinutes(screeningEndMinutes(showtime));
    return {
      label: `${displayTime(showtime.time)} · ${cinema?.shortName ?? ''}`,
      value: [
        formatLabels[showtime.format],
        `ends ~${displayTime(ends)}`,
        `from ${money(price.min)}`,
        `${availability.available} seats`,
        showtime.accessibility.length
          ? showtime.accessibility.map((a) => accessibilityLabels[a]).join(', ')
          : 'no extra access provisions listed',
      ].join(' · '),
    };
  });

  const cheapest = [...candidates].sort((a, b) => adultPriceRange(a).min - adultPriceRange(b).min)[0]!;
  const emptiest = [...candidates].sort(
    (a, b) => availabilityFor(b).available - availabilityFor(a).available,
  )[0]!;

  const text = t(
    lang,
    `${displayTime(cheapest.time)} is the cheapest at ${money(adultPriceRange(cheapest).min)}; ${displayTime(emptiest.time)} has the most seats left. Fees are the same on all of them — ${money(BOOKING_FEE_PER_TICKET)} a ticket.`,
    `${displayTime(cheapest.time)} সবচেয়ে সস্তা (${money(adultPriceRange(cheapest).min)}); ${displayTime(emptiest.time)} এ সবচেয়ে বেশি সিট খালি।`,
  );

  return reply({
    text,
    blocks: [
      { kind: 'facts', title: 'Side by side', rows },
      { kind: 'text', text },
      { kind: 'demo-note', text: DEMO_NOTE_SCHEDULE },
    ],
    actions: [
      {
        type: 'start_booking',
        label: `Book ${displayTime(cheapest.time)}`,
        movieSlug: movieById.get(cheapest.movieId)?.slug ?? '',
        showtimeId: cheapest.id,
      },
    ],
  });
}

/**
 * "What is this about?" — the short story, never the full synopsis by default.
 *
 * The synopsis is a paragraph written for browsing; someone asking Max mid-
 * booking wants three sentences. If they want more, the panel links to the
 * film page, where the full synopsis lives under its own heading.
 */
function movieStorySkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const movie = focusMovie(parse, context);

  if (!movie) {
    return reply({
      text: t(lang, 'Which film do you mean?', 'কোন ছবির কথা বলছেন?'),
      clarify: {
        question: t(lang, 'Which film?', 'কোন ছবি?'),
        options: nowShowing
          .slice(0, 4)
          .map((m) => ({ label: m.title, reply: `What is ${m.title} about?` })),
      },
    });
  }

  return reply({
    text: t(
      lang,
      `${movie.title}, without spoilers:`,
      `${movie.title} — স্পয়লার ছাড়া:`,
    ),
    blocks: [{ kind: 'movie-story', movieId: movie.id }],
    actions: [
      ...(movie.trailer
        ? [
            {
              type: 'watch_trailer' as const,
              label: t(lang, 'Watch the trailer', 'ট্রেলার দেখুন'),
              movieId: movie.id,
            },
          ]
        : []),
      {
        type: 'open_movie_details' as const,
        label: t(lang, 'Full details', 'বিস্তারিত'),
        movieId: movie.id,
      },
    ],
  });
}

/**
 * "Show me the trailer."
 *
 * Offers the action; never plays anything on its own. The action carries the
 * film id, so the player looks the trailer up from the catalogue — there is
 * nowhere here for Max to put a video it invented.
 */
function watchTrailerSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const movie = focusMovie(parse, context);

  if (!movie) {
    return reply({
      text: t(lang, 'Which film’s trailer?', 'কোন ছবির ট্রেলার?'),
      clarify: {
        question: t(lang, 'Which film?', 'কোন ছবি?'),
        options: nowShowing
          .filter((m) => m.trailer)
          .slice(0, 4)
          .map((m) => ({ label: m.title, reply: `Show me the trailer for ${m.title}` })),
      },
    });
  }

  if (!movie.trailer) {
    return reply({
      text: t(
        lang,
        `No official trailer has been released for ${movie.title} yet. I will not link you to an unofficial upload.`,
        `${movie.title}-এর কোনো অফিসিয়াল ট্রেলার এখনও আসেনি। অনানুষ্ঠানিক কোনো আপলোডে আমি পাঠাব না।`,
      ),
    });
  }

  const credit =
    movie.trailer.type === 'official-teaser'
      ? t(lang, 'Official teaser', 'অফিসিয়াল টিজার')
      : t(lang, 'Official trailer', 'অফিসিয়াল ট্রেলার');

  return reply({
    text: t(
      lang,
      `${credit} for ${movie.title}, from ${movie.trailer.officialChannel}.`,
      `${movie.title}-এর ${credit}, ${movie.trailer.officialChannel} থেকে।`,
    ),
    actions: [
      {
        type: 'watch_trailer' as const,
        label: t(lang, 'Play the trailer', 'ট্রেলার চালান'),
        movieId: movie.id,
      },
    ],
  });
}

function movieInfoSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const movie = focusMovie(parse, context);

  if (!movie) {
    return reply({
      text: t(
        lang,
        'Which film do you mean?',
        'কোন ছবির কথা বলছেন?',
      ),
      clarify: {
        question: t(lang, 'Which film?', 'কোন ছবি?'),
        options: nowShowing.slice(0, 4).map((m) => ({ label: m.title, reply: `Tell me about ${m.title}` })),
      },
    });
  }

  const certificate = certificates[movie.certificate];
  const text = t(
    lang,
    `${movie.title} — ${movie.tagline}`,
    `${movie.title} — ${movie.tagline}`,
  );

  return reply({
    text,
    blocks: [
      { kind: 'text', text: movie.synopsis },
      {
        kind: 'facts',
        title: movie.title,
        rows: [
          { label: 'Running time', value: formatRuntime(movie.runtimeMinutes) },
          { label: 'Certificate', value: certificate.label },
          { label: 'Language', value: languageLabels[movie.language] },
          {
            label: 'Subtitles',
            value: movie.subtitles.length
              ? movie.subtitles.map((s) => languageLabels[s]).join(', ')
              : 'None',
          },
          { label: 'Genre', value: movie.genres.map((g) => genreLabels[g]).join(', ') },
          { label: 'Director', value: movie.director },
          ...(movie.cast.length ? [{ label: 'Cast', value: movie.cast.join(', ') }] : []),
          {
            label: 'Interval',
            value: movie.intermissionMinutes ? `${movie.intermissionMinutes} minutes` : 'None listed',
          },
        ],
      },
      { kind: 'movies', movieIds: [movie.id] },
    ],
    actions: [
      { type: 'navigate', label: `Open ${movie.title}`, to: `/movies/${movie.slug}` },
      ...(movie.status === 'now-showing'
        ? [{ type: 'start_booking' as const, label: 'Find a showtime', movieSlug: movie.slug }]
        : []),
    ],
  });
}

/* ══════════════════════════════════════════════════════════════════════
   RUNTIME, INTERVALS AND BREAK WINDOWS
   ══════════════════════════════════════════════════════════════════════ */

function runtimeSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const movie = focusMovie(parse, context);
  const showtime = focusShowtime(context);

  if (!movie) {
    return reply({
      text: t(lang, 'Which film?', 'কোন ছবির কথা বলছেন?'),
      clarify: {
        question: t(lang, 'Which film?', 'কোন ছবি?'),
        options: nowShowing.slice(0, 4).map((m) => ({ label: m.title, reply: `How long is ${m.title}?` })),
      },
    });
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Feature', value: formatRuntime(movie.runtimeMinutes) },
  ];

  if (movie.intermissionMinutes) {
    rows.push({ label: 'Interval', value: `${movie.intermissionMinutes} minutes, listed` });
  } else {
    rows.push({ label: 'Interval', value: 'None listed' });
  }

  if (showtime && showtime.movieId === movie.id) {
    const cinema = cinemaById.get(showtime.cinemaId);
    rows.push({ label: 'Trailers first', value: `${cinema?.trailerMinutes ?? 0} minutes` });
    rows.push({ label: 'Starts', value: displayTime(showtime.time) });
    rows.push({
      label: 'Ends about',
      value: displayTime(timeFromMinutes(screeningEndMinutes(showtime))),
    });
  }

  const blocks: MaxBlock[] = [{ kind: 'facts', title: movie.title, rows }];

  const asksAboutBreak = /break|toilet|restroom|loo|step out|বিরতি|টয়লেট/.test(parse.normalised);
  if (asksAboutBreak) {
    if (movie.breakWindows?.length) {
      const windows = movie.breakWindows
        .map((w) => `${w.fromMinute}–${w.toMinute} minutes in`)
        .join(', and ');
      blocks.push({
        kind: 'text',
        text: t(
          lang,
          `An optional low-action break is listed around ${windows}. Timing is approximate and can shift a little by screening.`,
          `আনুমানিক ${windows} সময়ে কম-গুরুত্বপূর্ণ বিরতির সুযোগ আছে। সময় কিছুটা এদিক-ওদিক হতে পারে।`,
        ),
      });
      blocks.push({
        kind: 'spoiler',
        summary: t(lang, 'What happens in those minutes', 'ওই সময়ে কী ঘটে'),
        detail: movie.breakWindows.map((w) => `${w.fromMinute}–${w.toMinute}m: ${w.note}`).join('\n'),
      });
    } else {
      blocks.push({
        kind: 'text',
        text: t(
          lang,
          `I have the running time, but no reliable break-window information for ${movie.title}. I am not going to guess from the plot.`,
          `${movie.title} এর দৈর্ঘ্য জানি, কিন্তু নির্ভরযোগ্য বিরতির তথ্য নেই। অনুমান করে বলব না।`,
        ),
        tone: 'caution',
      });
    }
  }

  const text = t(
    lang,
    `${movie.title} runs ${formatRuntime(movie.runtimeMinutes)}${movie.intermissionMinutes ? ` with a ${movie.intermissionMinutes}-minute interval` : ' with no interval'}.`,
    `${movie.title} এর দৈর্ঘ্য ${formatRuntime(movie.runtimeMinutes)}${movie.intermissionMinutes ? `, ${movie.intermissionMinutes} মিনিটের বিরতিসহ` : ', বিরতি নেই'}।`,
  );

  return reply({
    text,
    blocks: [{ kind: 'text', text }, ...blocks],
    actions: [{ type: 'navigate', label: `Open ${movie.title}`, to: `/movies/${movie.slug}` }],
  });
}

/* ══════════════════════════════════════════════════════════════════════
   PRICING
   ══════════════════════════════════════════════════════════════════════ */

function priceExplainSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const showtime = focusShowtime(context);
  const category = parse.entities.ticketCategory ?? 'adult';

  if (!showtime) {
    const rows = ticketCategories.map((rule) => ({
      label: `${rule.label}${rule.ageFrom !== null ? ` (${rule.ageTo ? `${rule.ageFrom}–${rule.ageTo}` : `${rule.ageFrom}+`})` : ''}`,
      value: rule.multiplier === 1 ? 'Full price' : `×${rule.multiplier} of the seat price`,
    }));

    const text = t(
      lang,
      `A ticket is the seat class, plus the format, minus ৳60 before three, plus ৳50 on Friday and Saturday — then your age category, then ${money(BOOKING_FEE_PER_TICKET)} booking fee. That fee is the only one.`,
      `টিকিটের দাম = সিট ক্লাস + ফরম্যাট − বিকেল ৩টার আগে ৳৬০ ছাড় + শুক্র/শনি ৳৫০ — এরপর বয়সের শ্রেণি, এবং ${money(BOOKING_FEE_PER_TICKET)} বুকিং ফি। এটিই একমাত্র ফি।`,
    );

    return reply({
      text,
      blocks: [
        { kind: 'text', text },
        { kind: 'facts', title: 'Age categories', rows },
      ],
      actions: [{ type: 'navigate', label: 'See the full pricing page', to: '/ticket-prices' }],
    });
  }

  const seatClass = context.booking.seatIds.length > 0 ? 'premium' : 'regular';
  const breakdown = explainSeatPrice(showtime, seatClass, category);

  const text = t(
    lang,
    `One ${category} ticket at this screening comes to ${money(breakdown.total)}, including the booking fee.`,
    `এই শোতে একটি ${category} টিকিটের দাম ${money(breakdown.total)}, বুকিং ফি সহ।`,
  );

  return reply({
    text,
    blocks: [
      { kind: 'text', text },
      {
        kind: 'price',
        title: `${seatClass} seat · ${category}`,
        lines: breakdown.steps,
        total: breakdown.total,
        footnote: 'Per ticket. Every line is shown — there is nothing added afterwards.',
      },
    ],
    actions: [{ type: 'navigate', label: 'How pricing works', to: '/ticket-prices' }],
  });
}

function budgetSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const date = parse.entities.date ?? context.date ?? dateWindow(1)[0]!;
  const filter = entitiesToFilter(parse, context);
  const movie = focusMovie(parse, context);
  const party = parse.entities.partySize ?? Math.max(1, totalTickets(context.booking.counts) || 1);

  const candidates = filterShowtimes(date, filter, movie?.id)
    .filter((s) => availabilityFor(s).available >= party)
    .sort((a, b) => adultPriceRange(a).min - adultPriceRange(b).min);

  if (candidates.length === 0) {
    return reply({
      text: t(
        lang,
        `Nothing on ${dayLabel(date).toLowerCase()} has ${party} seats free within those limits.`,
        `${dayLabel(date)} এ ${party}টি সিট খালি এমন কিছু পাইনি।`,
      ),
      actions: [{ type: 'navigate', label: 'Open showtimes', to: '/showtimes' }],
    });
  }

  const cheapest = candidates[0]!;
  const seatOnly = adultPriceRange(cheapest).min * party;
  const fee = BOOKING_FEE_PER_TICKET * party;

  const lines = [
    { label: `${pluralise(party, 'adult ticket')}`, amount: seatOnly },
    { label: `Booking fee · ${money(BOOKING_FEE_PER_TICKET)} × ${party}`, amount: fee },
  ];

  const blocks: MaxBlock[] = [
    {
      kind: 'text',
      text: t(
        lang,
        `The cheapest option with ${party} seats free is ${screeningLine(cheapest)}.`,
        `${party}টি সিটসহ সবচেয়ে সস্তা: ${screeningLine(cheapest)}`,
      ),
    },
    {
      kind: 'price',
      title: 'Tickets only',
      lines,
      total: seatOnly + fee,
      footnote: 'The booking fee is included. Add-ons are extra and priced separately.',
    },
    { kind: 'showtimes', showtimeIds: candidates.slice(0, 4).map((s) => s.id), showCinema: true },
  ];

  if (parse.entities.budget !== undefined) {
    const within = seatOnly + fee <= parse.entities.budget;
    blocks.push({
      kind: 'text',
      text: within
        ? `That is inside your ৳${parse.entities.budget} budget, with ${money(parse.entities.budget - seatOnly - fee)} to spare.`
        : `That is ${money(seatOnly + fee - parse.entities.budget)} over your ৳${parse.entities.budget} budget. A before-three screening would be ${money(60 * party)} cheaper.`,
      tone: within ? 'default' : 'caution',
    });
  }

  blocks.push({ kind: 'demo-note', text: DEMO_NOTE_SCHEDULE });

  return reply({
    text: t(
      lang,
      `Cheapest is ${displayTime(cheapest.time)} at ${money(seatOnly + fee)} for ${pluralise(party, 'ticket')}, fee included.`,
      `সবচেয়ে সস্তা ${displayTime(cheapest.time)} — ${party}টি টিকিটে ${money(seatOnly + fee)}, ফি সহ।`,
    ),
    blocks,
    actions: [
      {
        type: 'start_booking',
        label: `Book ${displayTime(cheapest.time)}`,
        movieSlug: movieById.get(cheapest.movieId)?.slug ?? '',
        showtimeId: cheapest.id,
      },
    ],
  });
}

/* ══════════════════════════════════════════════════════════════════════
   SEATS
   ══════════════════════════════════════════════════════════════════════ */

function seatSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const showtime = focusShowtime(context);

  if (!showtime) {
    return reply({
      text: t(
        lang,
        'There is no screening chosen yet, so there is no seat map to look at. Pick a film and a time first and I will find seats in it.',
        'এখনো কোনো শো নির্বাচন করা হয়নি, তাই সিট ম্যাপ নেই। আগে ছবি ও সময় বেছে নিন।',
      ),
      actions: [{ type: 'navigate', label: t(lang, 'Find a showtime', 'শো খুঁজুন'), to: '/showtimes' }],
    });
  }

  const ticketCount = totalTickets(context.booking.counts);
  const party = parse.entities.partySize ?? (ticketCount > 0 ? ticketCount : 2);

  const result = findSeats(showtime, {
    partySize: party,
    ...(parse.entities.seatPreference ? { position: parse.entities.seatPreference } : {}),
    ...(parse.entities.wheelchairSpaces ? { wheelchairSpaces: parse.entities.wheelchairSpaces } : {}),
    ...(parse.entities.companionSeats ? { companionSeats: parse.entities.companionSeats } : {}),
    ...(parse.entities.reducedWalking ? { reducedWalking: true } : {}),
    ...(context.accessibilityPreferences.reducedWalking ? { reducedWalking: true } : {}),
    ...(parse.entities.premium ? { premium: true } : {}),
    ...(parse.entities.budget !== undefined ? { budget: parse.entities.budget } : {}),
  });

  if (!result.suggestion) {
    const largest = largestContiguousRun(showtime);
    return reply({
      text: result.problem ?? 'I could not find seats for that.',
      blocks: [
        { kind: 'text', text: result.problem ?? '', tone: 'caution' },
        {
          kind: 'text',
          text:
            largest > 0
              ? `The largest run still together at this screening is ${pluralise(largest, 'seat')}.`
              : 'No seats are left together at this screening.',
        },
      ],
      actions: [
        { type: 'navigate', label: 'Try another screening', to: '/showtimes' },
        {
          type: 'create_watch',
          label: 'Save a demo alert for seats together',
          kind: 'adjacent-seats',
          showtimeId: showtime.id,
          partySize: party,
        },
      ],
    });
  }

  const suggestion = result.suggestion;
  const mismatch = ticketCount > 0 && ticketCount !== suggestion.seatIds.length;

  const blocks: MaxBlock[] = [
    {
      kind: 'seats',
      showtimeId: showtime.id,
      seatIds: suggestion.seatIds,
      total: suggestion.total,
      split: suggestion.split,
      groups: suggestion.groups,
      reasons: suggestion.reasons,
    },
  ];

  if (mismatch) {
    blocks.push({
      kind: 'text',
      text: `Your booking currently has ${pluralise(ticketCount, 'ticket')} but this suggestion is for ${suggestion.seatIds.length}. Change the ticket count first, or ask me for ${ticketCount} instead.`,
      tone: 'caution',
    });
  }

  const text = t(
    lang,
    suggestion.split
      ? `The best I can do is ${seatRanges(suggestion.seatIds)}, split across ${suggestion.groups.length} rows.`
      : `${seatRanges(suggestion.seatIds)} — ${pluralise(suggestion.seatIds.length, 'seat')} together, ${money(suggestion.total)} before category discounts.`,
    suggestion.split
      ? `সবচেয়ে ভালো বিকল্প ${seatRanges(suggestion.seatIds)}, ${suggestion.groups.length}টি সারিতে ভাগ হয়ে।`
      : `${seatRanges(suggestion.seatIds)} — ${suggestion.seatIds.length}টি সিট একসাথে, ${money(suggestion.total)}।`,
  );

  const actions: MaxAction[] = [
    { type: 'propose_seats', label: t(lang, 'Show me on the map', 'ম্যাপে দেখান'), seatIds: suggestion.seatIds },
  ];

  if (!mismatch) {
    actions.push({
      type: 'apply_seats',
      label: t(lang, 'Choose these seats', 'এই সিটগুলো নিন'),
      seatIds: suggestion.seatIds,
      confirm: {
        title: t(lang, 'Choose these seats?', 'এই সিটগুলো নেবেন?'),
        body: t(
          lang,
          `This replaces any seats you have already picked with ${seatRanges(suggestion.seatIds)}. You can change them again on the map afterwards.`,
          `আপনার আগের নির্বাচিত সিটের বদলে ${seatRanges(suggestion.seatIds)} বসবে। পরে ম্যাপে বদলাতে পারবেন।`,
        ),
        confirmLabel: t(lang, 'Choose them', 'নিন'),
        cancelLabel: t(lang, 'Leave it', 'থাক'),
      },
    });
  }

  return reply({ text, blocks, actions });
}

/* ══════════════════════════════════════════════════════════════════════
   ACCESSIBILITY
   ══════════════════════════════════════════════════════════════════════ */

function accessibilitySkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const wanted = parse.entities.accessibility;
  const date = parse.entities.date ?? context.date ?? dateWindow(1)[0]!;

  // A question about what the provisions mean, rather than a search.
  const asksMeaning = /difference|what (?:is|are|does)|mean|explain|পার্থক্য|কী/.test(parse.normalised);
  if (asksMeaning && wanted.length > 0) {
    return reply({
      text: wanted.map((feature) => `${accessibilityLabels[feature]}: ${accessibilityBlurbs[feature]}`).join(' '),
      blocks: [
        {
          kind: 'facts',
          title: 'What these mean',
          rows: wanted.map((feature) => ({
            label: accessibilityLabels[feature],
            value: accessibilityBlurbs[feature],
          })),
        },
        {
          kind: 'text',
          text: t(
            lang,
            'Open and closed captions are not interchangeable. If you need captions guaranteed on screen, book an open-caption screening.',
            'ওপেন ও ক্লোজড ক্যাপশন এক নয়। পর্দায় নিশ্চিত ক্যাপশন চাইলে ওপেন-ক্যাপশন শো বুক করুন।',
          ),
        },
      ],
      actions: [{ type: 'navigate', label: 'Contact and access details', to: '/contact#access' }],
    });
  }

  const filter: MovieFilter = {
    ...entitiesToFilter(parse, context),
    ...(wanted.length ? { accessibility: wanted } : {}),
  };

  const results = filterShowtimes(date, filter)
    .filter((s) => availabilityFor(s).level !== 'sold-out')
    .slice(0, 6);

  if (results.length === 0) {
    const cinema = context.cinemaId ? cinemaById.get(context.cinemaId) : null;
    return reply({
      text: t(
        lang,
        `No screening on ${dayLabel(date).toLowerCase()} has ${wanted.length ? listSentence(wanted.map((w) => accessibilityLabels[w].toLowerCase())) : 'those provisions'} in the sample data. The house can tell you what is actually scheduled.`,
        `${dayLabel(date)} এ এই সুবিধাসহ কোনো শো নেই। হলের সাথে সরাসরি যোগাযোগ করলে সঠিক তথ্য পাবেন।`,
      ),
      blocks: [
        {
          kind: 'contact',
          ...(cinema ? { cinemaId: cinema.id } : { email: COMPANY.accessibilityEmail, phone: COMPANY.supportPhone }),
          note: 'Access arrangements are made by the house, not by this site.',
        },
      ],
      actions: [
        { type: 'navigate', label: 'Try another day', to: '/showtimes' },
        { type: 'navigate', label: 'Accessibility contacts', to: '/contact#access' },
      ],
    });
  }

  const text = t(
    lang,
    `${results.length} screening${results.length === 1 ? '' : 's'} on ${dayLabel(date).toLowerCase()} with ${listSentence(wanted.map((w) => accessibilityLabels[w].toLowerCase()))}.`,
    `${dayLabel(date)} এ ${results.length}টি শোতে এই সুবিধা আছে।`,
  );

  return reply({
    text,
    blocks: [
      { kind: 'text', text },
      { kind: 'showtimes', showtimeIds: results.map((s) => s.id), showCinema: true },
      ...(wanted.includes('open-captions') || wanted.includes('closed-captions')
        ? ([
            {
              kind: 'text',
              text: 'Open captions are burned into the print — everyone sees them, no equipment needed. Closed captions come on a device from the box office. They are not the same provision.',
            },
          ] as MaxBlock[])
        : []),
      { kind: 'demo-note', text: DEMO_NOTE_SCHEDULE },
    ],
    actions: [
      { type: 'apply_filters', label: 'See all of these', filter: { ...filter, date }, to: '/showtimes' },
    ],
  });
}

/* ══════════════════════════════════════════════════════════════════════
   CONCESSIONS
   ══════════════════════════════════════════════════════════════════════ */

function concessionSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const available = concessionsFor(context.cinemaId);
  const party = parse.entities.partySize ?? Math.max(1, totalTickets(context.booking.counts) || 2);
  const avoid = parse.entities.avoidAllergens ?? [];
  const dietary = parse.entities.dietary ?? [];

  let pool = available;
  if (dietary.length) pool = pool.filter((item) => dietary.every((tag) => item.dietary.includes(tag)));
  if (avoid.length) pool = pool.filter((item) => !avoid.some((a) => item.allergens.includes(a)));
  if (parse.entities.budget !== undefined) {
    pool = pool.filter((item) => item.price <= parse.entities.budget!);
  }

  if (pool.length === 0) {
    return reply({
      text: t(
        lang,
        'Nothing on the counter fits all of that. Staff can tell you what is safe on the day.',
        'কাউন্টারে এমন কিছু নেই যা সব শর্ত মেলে। কর্মীরা সেদিন জানাতে পারবেন।',
      ),
      blocks: [
        {
          kind: 'text',
          text: 'Allergen data here is incomplete on several items by design — please check at the counter before ordering if you have an allergy.',
          tone: 'caution',
        },
      ],
      actions: [{ type: 'navigate', label: 'See the counter', to: '/concessions' }],
    });
  }

  // Pick a shareable combination that covers the party.
  const shareable = pool
    .filter((item) => item.serves >= Math.min(party, 3))
    .sort((a, b) => a.price / a.serves - b.price / b.serves);
  const drinks = pool.filter((item) => item.category === 'drinks').sort((a, b) => a.price - b.price);

  const picks = [shareable[0], drinks[0]].filter((item) => Boolean(item));
  const items = picks.map((item) => ({
    itemId: item!.id,
    quantity: item!.category === 'drinks' ? party : 1,
  }));
  const total = items.reduce(
    (sum, line) => sum + (concessionById.get(line.itemId)?.price ?? 0) * line.quantity,
    0,
  );

  const incomplete = picks.filter((item) => !item!.allergenDataComplete);

  const blocks: MaxBlock[] = [
    {
      kind: 'concessions',
      itemIds: pool.slice(0, 5).map((item) => item.id),
      note: `For ${pluralise(party, 'person', 'people')}${dietary.length ? `, ${dietary.join(' and ')}` : ''}${avoid.length ? `, no ${avoid.join(' or ')}` : ''}.`,
    },
    {
      kind: 'price',
      title: 'A shareable combination',
      lines: items.map((line) => {
        const item = concessionById.get(line.itemId)!;
        return { label: `${item.name} × ${line.quantity}`, amount: item.price * line.quantity };
      }),
      total,
    },
  ];

  if (incomplete.length > 0) {
    blocks.push({
      kind: 'text',
      text: `${listSentence(incomplete.map((item) => item!.name))} ${incomplete.length === 1 ? 'has' : 'have'} an incomplete allergen declaration in this data. I cannot tell you ${incomplete.length === 1 ? 'it is' : 'they are'} safe — please check at the counter.`,
      tone: 'caution',
    });
  }
  if (avoid.length > 0) {
    blocks.push({
      kind: 'text',
      text: 'Allergen information here is sample data and is not a medical guarantee. Always confirm with staff before ordering.',
      tone: 'caution',
    });
  }

  const text = t(
    lang,
    `${picks.map((item) => item!.name).join(' and ')} would cover ${pluralise(party, 'person', 'people')} for ${money(total)}.`,
    `${picks.map((item) => item!.name).join(' ও ')} — ${party} জনের জন্য ${money(total)}।`,
  );

  return reply({
    text,
    blocks,
    actions: [
      {
        type: 'add_concessions',
        label: t(lang, 'Add these to my booking', 'বুকিংয়ে যোগ করুন'),
        items,
        confirm: {
          title: t(lang, 'Add these to your booking?', 'বুকিংয়ে যোগ করবেন?'),
          body: `${items.map((line) => `${concessionById.get(line.itemId)?.name} × ${line.quantity}`).join(', ')} — ${money(total)}. You can change quantities on the add-ons step.`,
          confirmLabel: t(lang, 'Add them', 'যোগ করুন'),
          cancelLabel: t(lang, 'Not now', 'এখন না'),
        },
      },
      { type: 'navigate', label: t(lang, 'Browse the counter', 'কাউন্টার দেখুন'), to: '/concessions' },
    ],
  });
}

/* ══════════════════════════════════════════════════════════════════════
   VENUE, POLICY AND CONTACT
   ══════════════════════════════════════════════════════════════════════ */

function cinemaSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const cinemaId = parse.entities.cinemaIds[0] ?? context.cinemaId;
  const cinema = cinemaId ? cinemaById.get(cinemaId) : null;

  if (!cinema) {
    return reply({
      text: t(lang, 'Which house do you mean?', 'কোন হলের কথা বলছেন?'),
      clarify: {
        question: t(lang, 'Which cinema?', 'কোন সিনেমা হল?'),
        options: cinemas.slice(0, 4).map((c) => ({ label: c.shortName, reply: `Tell me about ${c.shortName}` })),
      },
    });
  }

  const asksParking = /parking|park|পার্কিং/.test(parse.normalised);
  const asksDirections = /direction|get to|address|how do i|কীভাবে|ঠিকানা/.test(parse.normalised);

  const rows = [
    { label: 'Address', value: cinema.addressLines.join(', ') },
    { label: 'Open', value: cinema.openingHours },
    { label: 'Box office', value: cinema.boxOfficeHours },
    { label: 'Screens', value: `${cinema.screens.length}` },
    { label: 'Trailers before the feature', value: `${cinema.trailerMinutes} minutes` },
  ];
  if (asksParking) rows.push({ label: 'Parking', value: cinema.parkingNote });
  if (asksDirections) rows.push({ label: 'Getting there', value: cinema.transportNote });

  const text = asksParking
    ? cinema.parkingNote
    : asksDirections
      ? cinema.transportNote
      : `${cinema.name}, ${cinema.addressLines.join(', ')}. ${cinema.signature}`;

  return reply({
    text,
    blocks: [
      { kind: 'text', text },
      { kind: 'facts', title: cinema.name, rows },
      { kind: 'contact', cinemaId: cinema.id },
    ],
    actions: [
      { type: 'navigate', label: `Open ${cinema.shortName}`, to: `/cinemas/${cinema.slug}` },
      { type: 'select_cinema', label: `Make ${cinema.shortName} my cinema`, cinemaId: cinema.id },
    ],
  });
}

function policySkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const text = parse.normalised;

  // Score the knowledge base by keyword overlap.
  const scored = faq
    .map((entry) => {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (text.includes(keyword.toLowerCase())) score += 2;
      }
      for (const word of entry.question.toLowerCase().split(/\W+/)) {
        if (word.length > 4 && text.includes(word)) score += 1;
      }
      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (!best) {
    const cinema = context.cinemaId ? cinemaById.get(context.cinemaId) : null;
    return reply({
      text: t(
        lang,
        "I don't have verified information for that in this local demo.",
        'এই ডেমোতে এ বিষয়ে যাচাই করা তথ্য আমার কাছে নেই।',
      ),
      blocks: [
        {
          kind: 'text',
          text: t(
            lang,
            "I'd rather say that than guess. The house or the support line can answer it properly.",
            'অনুমান করার চেয়ে এটাই বলা ভালো। হল বা সাপোর্ট লাইন সঠিক উত্তর দিতে পারবে।',
          ),
        },
        {
          kind: 'contact',
          ...(cinema ? { cinemaId: cinema.id } : { email: COMPANY.supportEmail, phone: COMPANY.supportPhone }),
        },
      ],
      actions: [{ type: 'navigate', label: t(lang, 'Contact and FAQ', 'যোগাযোগ ও প্রশ্নোত্তর'), to: '/contact' }],
    });
  }

  const answer = lang === 'bn' ? best.entry.answerBn : best.entry.answer;

  return reply({
    text: answer,
    blocks: [
      { kind: 'text', text: answer },
      ...(best.entry.topic === 'refunds'
        ? ([{ kind: 'demo-note', text: refundPolicy.demoNote } as MaxBlock])
        : []),
    ],
    actions: [
      { type: 'navigate', label: t(lang, 'More questions', 'আরও প্রশ্ন'), to: '/contact' },
      ...(best.entry.topic === 'pricing'
        ? [{ type: 'navigate' as const, label: 'Full pricing', to: '/ticket-prices' }]
        : []),
    ],
  });
}

function contactSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const cinemaId = parse.entities.cinemaIds[0] ?? context.cinemaId;
  const cinema = cinemaId ? cinemaById.get(cinemaId) : null;

  return reply({
    text: cinema
      ? `${cinema.name} answers on ${cinema.phone}, or ${cinema.email}.`
      : `Head office is ${COMPANY.supportPhone}, ${COMPANY.supportEmail}, ${COMPANY.supportHours}.`,
    blocks: [
      {
        kind: 'contact',
        ...(cinema
          ? { cinemaId: cinema.id }
          : { email: COMPANY.supportEmail, phone: COMPANY.supportPhone, note: COMPANY.supportHours }),
      },
      {
        kind: 'demo-note',
        text: 'These are fictional contact details for a demonstration build — nothing sent to them reaches anyone.',
      },
    ],
    actions: [{ type: 'navigate', label: 'Contact page', to: '/contact' }],
  });
}

/* ══════════════════════════════════════════════════════════════════════
   LOCAL BOOKINGS, LATE ARRIVAL, LOST PROPERTY, COVER, WATCHES
   ══════════════════════════════════════════════════════════════════════ */

function bookingLookupSkill(parse: MaxParse): MaxReply {
  const bookings = useBookings.getState().bookings;

  if (bookings.length === 0) {
    return reply({
      text: t(
        parse.language,
        'There are no bookings saved in this browser yet.',
        'এই ব্রাউজারে এখনো কোনো বুকিং সংরক্ষিত নেই।',
      ),
      actions: [{ type: 'navigate', label: 'Find a screening', to: '/showtimes' }],
    });
  }

  const target = parse.entities.bookingReference
    ? bookings.find((b) => b.reference === parse.entities.bookingReference)
    : bookings[0];

  if (!target) {
    return reply({
      text: `No booking with reference ${parse.entities.bookingReference} is stored in this browser. Bookings made elsewhere cannot be seen from here.`,
      actions: [{ type: 'navigate', label: 'All bookings on this device', to: '/bookings' }],
    });
  }

  return reply({
    text: `${target.movieTitle}, ${dayLabel(target.date)} at ${displayTime(target.time)}, ${target.cinemaName}. Reference ${target.reference}.`,
    blocks: [
      { kind: 'booking', reference: target.reference },
      {
        kind: 'demo-note',
        text: 'Stored in this browser only. Nothing was sent to a cinema and no payment was taken.',
      },
    ],
    actions: [
      { type: 'open_booking', label: 'Open the ticket', reference: target.reference },
      { type: 'download_ics', label: 'Add to calendar', reference: target.reference },
    ],
  });
}

function lateArrivalSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const bookings = useBookings.getState().bookings;
  const now = context.now;

  const upcoming = bookings
    .map((booking) => ({
      booking,
      start: new Date(`${booking.date}T${booking.time}`),
    }))
    .filter((row) => row.start.getTime() > now.getTime() - 3 * 3600_000)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  if (!upcoming) {
    return reply({
      text: t(
        lang,
        'I cannot see an upcoming booking in this browser to check against. Each cinema page carries its own late-arrival policy.',
        'এই ব্রাউজারে আসন্ন কোনো বুকিং দেখতে পাচ্ছি না। প্রতিটি সিনেমার পাতায় দেরিতে আসার নীতি আছে।',
      ),
      actions: [{ type: 'navigate', label: 'Cinema policies', to: '/cinemas' }],
    });
  }

  const { booking, start } = upcoming;
  const cinema = cinemaById.get(booking.cinemaId);
  const minutesLate = Math.round((now.getTime() - start.getTime()) / 60_000);
  const trailerMinutes = cinema?.trailerMinutes ?? 12;

  const rows = [
    { label: 'Your screening', value: `${booking.movieTitle}, ${displayTime(booking.time)}` },
    { label: 'Cinema', value: booking.cinemaName },
    { label: 'Seats', value: seatRanges(booking.seats.map((s) => s.seatId)) },
    { label: 'Trailers run for', value: `${trailerMinutes} minutes` },
    {
      label: 'The feature starts about',
      value: displayTime(timeFromMinutes(minutesFromTime(booking.time) + trailerMinutes)),
    },
  ];

  let situation: string;
  if (minutesLate < 0) {
    situation = t(
      lang,
      `You are not late — there are ${Math.abs(minutesLate)} minutes until the printed start, and ${Math.abs(minutesLate) + trailerMinutes} until the feature itself.`,
      `আপনি দেরি করেননি — শুরু হতে ${Math.abs(minutesLate)} মিনিট বাকি।`,
    );
  } else if (minutesLate < trailerMinutes) {
    situation = t(
      lang,
      `The trailers are still running — you have about ${trailerMinutes - minutesLate} minutes before the feature starts. Go straight in.`,
      `এখনো ট্রেলার চলছে — মূল ছবি শুরু হতে প্রায় ${trailerMinutes - minutesLate} মিনিট বাকি।`,
    );
  } else {
    situation = t(
      lang,
      `The feature started about ${minutesLate - trailerMinutes} minutes ago. ${cinema?.lateArrivalPolicy ?? ''}`,
      `মূল ছবি প্রায় ${minutesLate - trailerMinutes} মিনিট আগে শুরু হয়েছে।`,
    );
  }

  // Later screenings of the same film, in case they want to swap.
  const later = showtimesForDate(booking.date)
    .filter(
      (s) =>
        s.movieId === booking.movieId &&
        s.cinemaId === booking.cinemaId &&
        minutesFromTime(s.time) > minutesFromTime(booking.time) &&
        availabilityFor(s).available >= booking.seats.length,
    )
    .slice(0, 3);

  const blocks: MaxBlock[] = [
    { kind: 'text', text: situation },
    { kind: 'facts', title: 'Where to go', rows },
    {
      kind: 'text',
      text: cinema?.lateArrivalPolicy ?? '',
    },
  ];

  if (later.length > 0) {
    blocks.push({
      kind: 'text',
      text: t(
        lang,
        `There ${later.length === 1 ? 'is a later screening' : `are ${later.length} later screenings`} of the same film at this house today with enough seats.`,
        `আজ একই ছবির পরের শোতে যথেষ্ট সিট আছে।`,
      ),
    });
    blocks.push({ kind: 'showtimes', showtimeIds: later.map((s) => s.id) });
  }

  blocks.push({
    kind: 'demo-note',
    text: 'I have not contacted the cinema — there is no way for this build to do that. If you need to tell them, call the house directly.',
  });

  return reply({
    text: situation,
    blocks,
    actions: [
      ...(cinema ? [{ type: 'call' as const, label: `Call ${cinema.shortName}`, phone: cinema.phone }] : []),
      { type: 'open_booking', label: 'Open my ticket', reference: booking.reference },
    ],
  });
}

function lostItemSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const bookings = useBookings.getState().bookings;
  const booking = parse.entities.bookingReference
    ? bookings.find((b) => b.reference === parse.entities.bookingReference)
    : bookings[0];

  const cinema = booking
    ? cinemaById.get(booking.cinemaId)
    : context.cinemaId
      ? cinemaById.get(context.cinemaId)
      : null;

  if (!cinema) {
    return reply({
      text: t(
        lang,
        'Which house was it? Each one keeps its own found items.',
        'কোন হলে? প্রতিটি হল আলাদা করে হারানো জিনিস রাখে।',
      ),
      clarify: {
        question: t(lang, 'Which cinema?', 'কোন সিনেমা হল?'),
        options: cinemas.slice(0, 4).map((c) => ({ label: c.shortName, reply: `I lost something at ${c.shortName}` })),
      },
    });
  }

  const checklist = [
    'Which house, and the date and time of the screening',
    'Your screen and seat, if you remember them',
    'What the item is, and anything that identifies it',
    'Where you last had it',
    'A phone number or email they can reach you on',
  ];

  const blocks: MaxBlock[] = [
    {
      kind: 'text',
      text: t(
        lang,
        booking
          ? `I can put a report together for ${cinema.name}. Your booking gives me the screening, screen and seats already.`
          : `I can put a report together for ${cinema.name}. I will need a few details from you.`,
        booking
          ? `${cinema.name} এর জন্য রিপোর্ট তৈরি করে দিতে পারি। আপনার বুকিং থেকে শো, স্ক্রিন ও আসনের তথ্য পেয়ে যাচ্ছি।`
          : `${cinema.name} এর জন্য রিপোর্ট তৈরি করে দিতে পারি।`,
      ),
    },
    { kind: 'checklist', title: 'What the desk will want', items: checklist },
    {
      kind: 'facts',
      title: `${cinema.shortName} lost property`,
      rows: [
        { label: 'Held for', value: `${cinema.lostAndFound.holdingPeriodDays} days` },
        { label: 'Desk open', value: cinema.lostAndFound.hours },
        { label: 'Email', value: cinema.lostAndFound.email },
        { label: 'Phone', value: cinema.lostAndFound.phone },
      ],
    },
    {
      kind: 'demo-note',
      text: 'Nothing has been sent and no staff member has been told. This build has no backend, so you have to send the report yourself — I will prepare it for you.',
    },
  ];

  const actions: MaxAction[] = [
    {
      type: 'save_lost_report',
      label: t(lang, 'Prepare a report', 'রিপোর্ট তৈরি করুন'),
      draft: {
        bookingReference: booking?.reference ?? null,
        cinemaId: cinema.id,
        date: booking?.date ?? (context.date ?? dateWindow(1)[0]!),
        time: booking?.time ?? '',
        screenName: booking?.screenName ?? '',
        seatIds: booking?.seats.map((s) => s.seatId) ?? [],
        category: parse.entities.lostItemCategory ?? 'other',
        description: '',
        lastSeen: '',
        contactName: booking?.guestName ?? '',
        contactEmail: booking?.guestEmail ?? '',
        contactPhone: booking?.guestPhone ?? '',
      },
      confirm: {
        title: t(lang, 'Save this report in your browser?', 'রিপোর্ট ব্রাউজারে রাখবেন?'),
        body: t(
          lang,
          'It is stored on this device only, so you can copy it into an email or read it down the phone. You can delete it at any time.',
          'এটি শুধু এই ডিভাইসে থাকবে, যাতে ইমেইলে কপি করতে বা ফোনে পড়ে শোনাতে পারেন।',
        ),
        confirmLabel: t(lang, 'Save it', 'সংরক্ষণ করুন'),
        cancelLabel: t(lang, 'Not yet', 'এখন না'),
      },
    },
    { type: 'call', label: `Call ${cinema.shortName}`, phone: cinema.lostAndFound.phone },
  ];

  return reply({
    text: t(
      lang,
      `${cinema.name} keeps found items for ${cinema.lostAndFound.holdingPeriodDays} days. I can prepare a report for you to send.`,
      `${cinema.name} ${cinema.lostAndFound.holdingPeriodDays} দিন পর্যন্ত জিনিস রাখে।`,
    ),
    blocks,
    actions,
  });
}

function insuranceSkill(parse: MaxParse): MaxReply {
  const lang = parse.language;
  const bookings = useBookings.getState().bookings;
  const insured = bookings.filter((b) => b.insurance);
  const target = parse.entities.bookingReference
    ? bookings.find((b) => b.reference === parse.entities.bookingReference)
    : insured[0];

  if (!target) {
    return reply({
      text: t(
        lang,
        bookings.length === 0
          ? 'There are no bookings in this browser to check.'
          : 'None of your bookings in this browser includes Ticket Cover, so there is nothing to claim against.',
        bookings.length === 0
          ? 'এই ব্রাউজারে কোনো বুকিং নেই।'
          : 'আপনার কোনো বুকিংয়ে টিকিট কভার নেই, তাই দাবি করার কিছু নেই।',
      ),
      blocks: [
        {
          kind: 'facts',
          title: `${insurancePolicy.name} — what it covers`,
          rows: insurancePolicy.coveredReasons.map((reason) => ({
            label: reason.label,
            value: reason.note,
          })),
        },
      ],
      actions: [{ type: 'navigate', label: 'How Ticket Cover works', to: '/ticket-prices' }],
    });
  }

  if (!target.insurance) {
    return reply({
      text: `Booking ${target.reference} does not include ${insurancePolicy.name}, so a claim cannot be made against it.`,
      blocks: [{ kind: 'booking', reference: target.reference }],
      actions: [{ type: 'navigate', label: 'What Ticket Cover covers', to: '/ticket-prices' }],
    });
  }

  const reason = parse.entities.claimReason;
  const matched = insurancePolicy.coveredReasons.find((r) => r.id === reason);

  return reply({
    text: t(
      lang,
      `Booking ${target.reference} includes ${insurancePolicy.name}. I can prepare a claim draft — it will not be submitted, because there is nowhere to submit it to.`,
      `${target.reference} বুকিংয়ে টিকিট কভার আছে। আমি একটি খসড়া তৈরি করতে পারি — এটি জমা দেওয়া হবে না।`,
    ),
    blocks: [
      { kind: 'booking', reference: target.reference },
      ...(matched
        ? ([
            {
              kind: 'text',
              text: `"${matched.label}" is one of the covered reasons: ${matched.note}`,
            },
          ] as MaxBlock[])
        : []),
      {
        kind: 'checklist',
        title: 'Before you contact them',
        items: claimChecklistTemplate.map((item) => item.label),
        note: `Claims must be made within ${insurancePolicy.claimWindowDays} days of the screening.`,
      },
      {
        kind: 'facts',
        title: 'Not covered',
        rows: insurancePolicy.exclusions.map((exclusion, i) => ({
          label: `${i + 1}`,
          value: exclusion,
        })),
      },
      {
        kind: 'contact',
        email: insurancePolicy.contactEmail,
        phone: insurancePolicy.contactPhone,
        note: 'You contact them — this build cannot.',
      },
      {
        kind: 'demo-note',
        text: 'No claim has been submitted, nothing has been assessed, and no outcome is implied. I cannot tell you whether a claim would succeed.',
      },
    ],
    actions: reason
      ? [
          {
            type: 'save_claim_draft',
            label: 'Save a claim draft',
            bookingReference: target.reference,
            reason,
          },
        ]
      : [],
  });
}

function watchSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const showtime = focusShowtime(context);

  if (!showtime) {
    return reply({
      text: t(
        lang,
        'Pick a screening first and I will save a demo alert against it.',
        'আগে একটি শো বেছে নিন, তারপর ডেমো অ্যালার্ট সংরক্ষণ করব।',
      ),
      actions: [{ type: 'navigate', label: 'Find a screening', to: '/showtimes' }],
    });
  }

  const kind = parse.entities.watchKind ?? 'price-drop';
  const existing = useWatches.getState().watches.filter((w) => w.showtimeId === showtime.id);

  return reply({
    text: t(
      lang,
      `I can save a local demo alert for ${screeningLine(showtime)}. It only works in this browser and does not monitor live cinema inventory.`,
      `${screeningLine(showtime)} এর জন্য একটি লোকাল ডেমো অ্যালার্ট রাখতে পারি। এটি শুধু এই ব্রাউজারে কাজ করে এবং লাইভ তথ্য দেখে না।`,
    ),
    blocks: [
      {
        kind: 'text',
        text: `${watchKindLabel(kind)} — ${screeningLine(showtime)}`,
      },
      {
        kind: 'demo-note',
        text: 'Demonstration only. Nothing is monitored in real time, nothing is emailed or texted, no other device will be told, and clearing this browser\'s data deletes the alert.',
      },
      ...(existing.length ? ([{ kind: 'watches', watchIds: existing.map((w) => w.id) }] as MaxBlock[]) : []),
    ],
    actions: [
      {
        type: 'create_watch',
        label: `Save a ${watchKindLabel(kind).toLowerCase()} alert`,
        kind,
        showtimeId: showtime.id,
        ...(parse.entities.partySize ? { partySize: parse.entities.partySize } : {}),
      },
      { type: 'navigate', label: 'See this screening', to: `/movies/${movieById.get(showtime.movieId)?.slug ?? ''}` },
    ],
  });
}

/* ══════════════════════════════════════════════════════════════════════
   MISC
   ══════════════════════════════════════════════════════════════════════ */

function capabilitiesSkill(parse: MaxParse): MaxReply {
  const lang = parse.language;
  return reply({
    text: t(
      lang,
      'I work with the programme, the showtimes, the seat maps and your local bookings.',
      'আমি তালিকা, শোটাইম, সিট ম্যাপ ও আপনার লোকাল বুকিং নিয়ে কাজ করি।',
    ),
    blocks: [
      {
        kind: 'checklist',
        title: t(lang, 'Things I can do', 'যা করতে পারি'),
        items: [
          'Find films and screenings by genre, language, time, runtime or price',
          'Compare screenings side by side and work out the cheapest option',
          'Suggest seats — together, near an aisle, wheelchair spaces with companions',
          'Explain how a price was reached, line by line',
          'Filter for open captions, closed captions, audio description and more',
          'Recommend food within a budget, avoiding declared allergens',
          'Look up bookings saved in this browser, and prepare a lost-item report',
          'Answer policy questions from the site’s own knowledge base',
        ],
      },
      {
        kind: 'text',
        text: t(
          lang,
          'I will never change your seats, tickets or basket without asking, and I will never finish a purchase for you — that stays on the review page.',
          'আপনার অনুমতি ছাড়া সিট, টিকিট বা কার্ট বদলাব না, এবং কখনো নিজে কেনাকাটা শেষ করব না।',
        ),
      },
      {
        kind: 'demo-note',
        text: 'I run entirely on this device, using the same sample data the rest of the site uses. Nothing you type here is sent anywhere.',
      },
    ],
  });
}

function greetingSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const movie = focusMovie(parse, context);

  return reply({
    text: movie
      ? t(lang, `Hello. You're looking at ${movie.title} — what would help?`, `হ্যালো। আপনি ${movie.title} দেখছেন — কীভাবে সাহায্য করতে পারি?`)
      : t(lang, 'Hello. What are you trying to book?', 'হ্যালো। কী বুক করতে চাইছেন?'),
  });
}

function startBookingSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;
  const movie = focusMovie(parse, context);
  const showtime = focusShowtime(context);

  if (!movie) {
    return reply({
      text: t(lang, 'Which film would you like to book?', 'কোন ছবি বুক করতে চান?'),
      clarify: {
        question: t(lang, 'Which film?', 'কোন ছবি?'),
        options: nowShowing.slice(0, 4).map((m) => ({ label: m.title, reply: `Book ${m.title}` })),
      },
    });
  }

  return reply({
    text: t(
      lang,
      showtime
        ? `Taking you to the booking for ${movie.title} at ${displayTime(showtime.time)}.`
        : `Let's find a time for ${movie.title}.`,
      showtime
        ? `${movie.title} — ${displayTime(showtime.time)} এর বুকিংয়ে নিয়ে যাচ্ছি।`
        : `${movie.title} এর জন্য সময় খুঁজি।`,
    ),
    actions: [
      {
        type: 'start_booking',
        label: t(lang, `Book ${movie.title}`, `${movie.title} বুক করুন`),
        movieSlug: movie.slug,
        ...(showtime && showtime.movieId === movie.id ? { showtimeId: showtime.id } : {}),
      },
    ],
  });
}

function calendarSkill(parse: MaxParse): MaxReply {
  const bookings = useBookings.getState().bookings;
  const target = parse.entities.bookingReference
    ? bookings.find((b) => b.reference === parse.entities.bookingReference)
    : bookings[0];

  if (!target) {
    return reply({
      text: 'There is no booking in this browser to add to a calendar yet.',
      actions: [{ type: 'navigate', label: 'Find a screening', to: '/showtimes' }],
    });
  }

  return reply({
    text: `I can generate a calendar file for ${target.movieTitle} on ${dayLabel(target.date)} at ${displayTime(target.time)}. It is built here in the browser.`,
    blocks: [{ kind: 'booking', reference: target.reference }],
    actions: [
      { type: 'download_ics', label: 'Download the calendar file', reference: target.reference },
      { type: 'open_booking', label: 'Open the ticket', reference: target.reference },
    ],
  });
}

function unknownSkill(parse: MaxParse, context: MaxContext): MaxReply {
  const lang = parse.language;

  return reply({
    text: t(
      lang,
      "I'm not sure what you're after.",
      'ঠিক বুঝতে পারিনি।',
    ),
    clarify: {
      question: t(lang, 'Which of these is closest?', 'এর মধ্যে কোনটি সবচেয়ে কাছাকাছি?'),
      options: [
        { label: t(lang, 'Find something to watch', 'কিছু দেখার খুঁজুন'), reply: 'What can I watch tonight?' },
        { label: t(lang, 'Find a showtime', 'শোটাইম খুঁজুন'), reply: 'Show me screenings after 8pm' },
        ...(context.booking.showtimeId
          ? [{ label: t(lang, 'Help me pick seats', 'সিট বেছে দিন'), reply: 'Find me two seats together' }]
          : []),
        { label: t(lang, 'A question about prices', 'দাম সম্পর্কে প্রশ্ন'), reply: 'How is a ticket price worked out?' },
      ],
    },
  });
}

/* ══════════════════════════════════════════════════════════════════════
   DISPATCH
   ══════════════════════════════════════════════════════════════════════ */

export function runSkill(parse: MaxParse, context: MaxContext): MaxReply {
  switch (parse.intent) {
    case 'greeting':
      return greetingSkill(parse, context);
    case 'capabilities':
      return capabilitiesSkill(parse);
    case 'find_movies':
      return findMoviesSkill(parse, context);
    case 'find_showtimes':
    case 'apply_filters':
      return findShowtimesSkill(parse, context);
    case 'compare_showtimes':
      return compareShowtimesSkill(parse, context);
    case 'movie_info':
      return movieInfoSkill(parse, context);
    case 'movie_story':
      return movieStorySkill(parse, context);
    case 'watch_trailer':
      return watchTrailerSkill(parse, context);
    case 'runtime_info':
      return runtimeSkill(parse, context);
    case 'price_explain':
      return priceExplainSkill(parse, context);
    case 'budget_optimise':
      return budgetSkill(parse, context);
    case 'seat_recommend':
    case 'group_booking':
      return seatSkill(parse, context);
    case 'seat_clear':
      return reply({
        text: 'I can clear the seats you have chosen. Nothing else in the booking changes.',
        actions: [
          {
            type: 'clear_seats',
            label: 'Clear my seats',
            confirm: {
              title: 'Clear your seats?',
              body: 'Your ticket count, add-ons and details stay as they are — only the seats are released.',
              confirmLabel: 'Clear them',
              cancelLabel: 'Keep them',
            },
          },
        ],
      });
    case 'accessibility_query':
      return accessibilitySkill(parse, context);
    case 'concession_recommend':
      return concessionSkill(parse, context);
    case 'cinema_info':
      return cinemaSkill(parse, context);
    case 'policy_question':
      return policySkill(parse, context);
    case 'contact':
      return contactSkill(parse, context);
    case 'booking_lookup':
      return bookingLookupSkill(parse);
    case 'late_arrival':
      return lateArrivalSkill(parse, context);
    case 'lost_item':
      return lostItemSkill(parse, context);
    case 'insurance_claim':
      return insuranceSkill(parse);
    case 'create_watch':
      return watchSkill(parse, context);
    case 'calendar':
      return calendarSkill(parse);
    case 'start_booking':
      return startBookingSkill(parse, context);
    case 'clear_filters':
      return reply({
        text: 'Clearing the filters.',
        actions: [{ type: 'clear_filters', label: 'Clear all filters' }],
      });
    case 'clear_conversation':
      return reply({
        text: 'I can clear this conversation. Your booking and filters are untouched.',
        actions: [{ type: 'clear_conversation', label: 'Clear the conversation' }],
      });
    default:
      return unknownSkill(parse, context);
  }
}

export { movies as allMovies };
