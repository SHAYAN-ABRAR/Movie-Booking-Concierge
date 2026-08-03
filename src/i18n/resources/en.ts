/**
 * English interface copy.
 *
 * The source of truth for key structure. `bn.ts` must mirror it exactly —
 * `npm run check:i18n` fails on any missing key, extra key, empty value, or
 * mismatched interpolation variable.
 *
 * Keys are structured by surface, never by sentence. `common.actions.continue`,
 * not `"Continue"` used as its own key: English copy as a key makes every
 * wording tweak a breaking change across both languages.
 */
export const en = {
  common: {
    actions: {
      continue: 'Continue',
      back: 'Back',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      clear: 'Clear',
      apply: 'Apply',
      retry: 'Try again',
      startOver: 'Start over',
      seeAll: 'See all',
      book: 'Book',
    },
    labels: {
      loading: 'Loading',
      demonstration: 'Demonstration',
      today: 'Today',
      tomorrow: 'Tomorrow',
    },
  },

  preferences: {
    language: {
      label: 'Language',
      /** Shown in the mobile sheet, where both languages are named. */
      heading: 'Language',
      changed: 'Language changed to English.',
    },
    appearance: {
      label: 'Appearance',
      heading: 'Appearance',
      light: 'Light',
      dark: 'Dark',
      changedLight: 'Switched to the light theme.',
      changedDark: 'Switched to the dark theme.',
    },
  },

  nav: {
    primary: 'Primary',
    mobile: 'Mobile',
    menu: 'Menu',
    openMenu: 'Open menu',
    programme: 'Programme',
    showtimes: 'Showtimes',
    cinemas: 'Cinemas',
    counter: 'Counter',
    offers: 'Offers',
    skipToContent: 'Skip to content',
    home: 'GrandPlex — home',
    ticketPrices: 'Ticket prices',
    myBookings: 'My bookings',
    about: 'About',
    contact: 'Contact',
    yourCinema: 'Your cinema',
    book: 'Book',
  },

  a11y: {
    /** Announced politely after a route change. `{{title}}` is the new `h1`. */
    pageLoaded: '{{title}}. Page loaded.',
    pageLoadedFallback: 'Page loaded.',
  },

  footer: {
    blurb:
      'Nine screens across five houses in Dhaka, Chattogram and Sylhet. The programme changes every Thursday.',
    columns: {
      programme: 'Programme',
      visiting: 'Visiting',
      yourVisit: 'Your visit',
    },
    links: {
      nowShowing: 'Now showing',
      comingSoon: 'Coming soon',
      showtimes: 'Showtimes',
      offers: 'Offers',
      allCinemas: 'All cinemas',
      theCounter: 'The counter',
      ticketPrices: 'Ticket prices',
      contactSupport: 'Contact & support',
      myBookings: 'My bookings',
      aboutGrandPlex: 'About GrandPlex',
      accessibility: 'Accessibility',
      lostProperty: 'Lost property',
    },
    houses: 'Our houses',
    demonstrationTitle: 'A demonstration build.',
    demonstrationBody:
      "GrandPlex is not a real cinema chain. Every film, venue, schedule, seat, price, offer and policy on this site is sample data written for this project. No payment is taken and no information leaves your browser — bookings are stored in this browser's local storage only.",
    copyright: '© {{year}} GrandPlex',
  },

  location: {
    label: 'Choose your cinema',
    all: 'All cinemas',
  },

  alerts: {
    title: 'Alerts',
    labelUnread: 'Alerts — {{count, number}} unread',
    labelNone: 'Alerts — none yet',
    clearAll: 'Clear all',
    empty: 'No alerts. Max can save a demo alert for a screening you are watching.',
    emptyWithWatches_one: 'You have {{count, number}} demo alert saved. Nothing has fired yet.',
    emptyWithWatches_other: 'You have {{count, number}} demo alerts saved. Nothing has fired yet.',
    view: 'View {{title}}',
    dismiss: 'Dismiss alert: {{title}}',
    savedWatches: 'Saved watches',
    screening: 'Screening',
    browserPitch:
      'Alerts always appear here. You can also have them pop up as browser notifications.',
    allowBrowser: 'Allow browser notifications',
    demoNote:
      'Demo alerts only. Nothing here monitors live cinema inventory, and nothing is emailed or sent to another device. Watches live in this browser and disappear if you clear its data.',
    kinds: {
      priceDrop: 'Price drop',
      premiumSeat: 'Premium seat opening',
      adjacentSeats: 'Seats together',
      accessibleSeat: 'Accessible seat opening',
    },
    blurbs: {
      priceDrop: 'Tells you if the sample price for this screening goes down.',
      premiumSeat: 'Tells you if a premium or recliner seat frees up.',
      adjacentSeats: 'Tells you if enough seats together come back into the map.',
      accessibleSeat: 'Tells you if a wheelchair space or companion seat frees up.',
    },
  },

  errors: {
    eyebrow: 'Something went wrong on this page',
    title: 'This page could not be displayed.',
    reassurance:
      'The rest of the site is still working, and nothing you have saved in this browser has been lost — any completed bookings are still on the My bookings page.',
    noReporting:
      'This is a demonstration build with no error-reporting service behind it, so the details below are only in your browser console.',
    home: 'Home',
    bookAMovie: 'Book a movie',
  },

  loading: {
    page: 'Loading page',
    ellipsis: 'Loading…',
  },

  home: {
    programmeEyebrow: 'The Programme',
    onTonight: 'On tonight',
    allShowtimes: 'All showtimes',
    tonightEmpty:
      "Tonight's screenings at {{cinema}} have all started. The programme picks up again tomorrow morning — <tomorrow>see tomorrow's times</tomorrow>.",
    filmCount_one: '{{count, number}} film',
    filmCount_other: '{{count, number}} films',
    nowShowing: 'Now showing',
    fullProgramme: 'Full programme',
    howWeShowFilms: 'How we show films',
    fourWaysToWatch: 'Four ways to watch',
    whatItCosts: 'What it costs',
    advanceNotice: 'Advance notice',
    comingSoon: 'Coming soon',
    allUpcoming: 'All upcoming',
    runningNow: 'Running now',
    offers: 'Offers',
    allOffers: 'All offers',
    readTheTerms: 'Read the terms',
    fiveHouses: 'Five houses',
    whereWeAre: 'Where we are',
    allCinemas: 'All cinemas',
    screenCount_one: '{{count, number}} screen',
    screenCount_other: '{{count, number}} screens',
    featuredLabel: "This week's featured films",
    dateRange: '{{from}} – {{to}}',
  },

  cinemas: {
    eyebrow: 'Five houses',
    title: 'Our cinemas',
    lede:
      'Three cities, nineteen screens. Each house runs its own programme — the strands below are what makes each one different.',
    nothingToday: 'Nothing scheduled here today.',
  },

  cinemaDetails: {
    breadcrumb: 'Breadcrumb',
    backToCinemas: '← All cinemas',
    showtimes: 'Showtimes',
    nothingScheduledTitle: 'Nothing scheduled',
    nothingScheduledBody:
      '{{cinema}} has no screenings listed for this date in the sample programme. Try another day on the strip above.',
    sampleSchedule: 'Sample schedule generated locally. Not a real listing for any cinema.',
    access: 'Access',
    accessNote:
      'Wheelchair spaces appear on the seat map with their own marker and are always charged at the regular seat rate. If you need something that is not listed here, call the house on <phone>{{phone}}</phone> — this site cannot arrange it for you.',
    gettingHere: 'Getting here',
    transport: 'Transport',
    parking: 'Parking',
    housePolicies: 'House policies',
    arrivingLate: 'Arriving late',
    lostProperty: 'Lost property',
    lostPropertyBody:
      'Items found in this house are kept for {{days, number}} days. The lost property desk is open {{hours}}.',
    lostPropertyMax:
      'Max can assemble a lost-item report with your booking, screen and seat already filled in — you then send it yourself using the details above.',
    theHouses: 'The houses',
    amenities: 'Amenities',
  },

  seatMap: {
    screenEnd: 'The screen is at this end of the house',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    priceNote:
      'Prices are per seat before your ticket category is applied, and exclude the {{fee}} per-ticket booking fee. Wheelchair spaces and companion seats are always charged at the regular rate.',
    clearSeats: 'Clear seats',
    allReleased: 'All seats released.',
  },

  dateStrip: {
    label: 'Choose a date',
    back: 'Scroll dates backwards',
    forward: 'Scroll dates forwards',
  },

  offers: {
    eyebrow: 'Running now',
    title: 'Offers',
    lede:
      'Five standing offers. None of them needs a code, and none of them is a partnership — every one is applied by the booking flow from what is already in your basket.',
    everyDay: 'Every day',
    allCinemas: 'All cinemas',
    howApplied: 'How it is applied',
    terms: 'Terms',
    findScreening: 'Find a screening',
    howPricingWorks: 'How pricing works',
    demoNote:
      'Sample promotional data written for this demonstration. These offers are not available at any real cinema, there are no partner relationships behind them, and the discounts described are illustrative only.',
    days: {
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
    },
  },

  max: {
    nudgeTitle: 'Finding it hard to book? Ask me — I can help.',
    nudgeBody: 'I can find movies, compare showtimes and help you choose seats.',
    dismissNudge: 'Dismiss this message',
    spoilerNote:
      'This describes what is on screen at those moments. Reveal only if you do not mind a light spoiler.',
    reveal: 'Reveal',
    removeAlert: 'Remove this alert',
  },

  quickBook: {
    heading: 'Book in four steps',
    noAccount: 'No account needed · guest checkout',
    chooseSeats: 'Choose seats',
  },

  concessionCard: {
    allergenIncompleteTip:
      'The kitchen has not confirmed a full allergen declaration for this item. Ask at the counter before ordering if you have an allergy.',
    allergenIncomplete: 'Allergen list incomplete — check at the counter',
  },

  movieCard: {
    notYetRated: 'Not yet rated',
  },

  featured: {
    demoNote:
      'GrandPlex is a demonstration build — the films, schedules and prices are sample data. You can complete a booking as a guest; no payment is taken.',
  },

  bookings: {
    eyebrow: 'On this device',
    title: 'My bookings',
    lede:
      'Every booking you have made in this browser. They are stored on this device only — not on a server, and not on any other device you use.',
    viewTicket: 'View ticket',
    addToCalendar: 'Add to calendar',
    clearHistory: 'Clear history',
    emptyTitle: 'No bookings on this device yet',
    emptyBody:
      'When you complete a booking it will appear here, with its reference and a printable ticket. Nothing is stored anywhere else, so this list starts empty on a new browser.',
    findScreening: 'Find a screening',
    demoNote:
      'Demonstration bookings. No payment was taken, no ticket is valid for entry anywhere, and nothing here has been sent to a cinema. Clearing your browser data deletes all of it.',
    clearTitle: 'Clear all booking history?',
    clearBody_one:
      'This deletes the {{count, number}} booking stored in this browser. It cannot be undone, and there is no copy anywhere else.',
    clearBody_other:
      'This deletes all {{count, number}} bookings stored in this browser. It cannot be undone, and there is no copy anywhere else.',
    keepThem: 'Keep them',
    deleteEverything: 'Delete everything',
  },

  concessions: {
    eyebrow: 'The counter',
    title: 'Food and drink',
    ledeCinema:
      'What the counter is serving at {{cinema}}. Add anything here and it carries into your booking.',
    fullAllergenOnly: 'Full allergen data only',
    itemCount_one: '{{count, number}} item',
    itemCount_other: '{{count, number}} items',
    onTheCounter: '<strong>{{items}}</strong> on the counter',
    emptyTitle: 'Nothing matches that',
    emptyBody:
      'No item on the counter fits every filter. Clearing the dietary filters usually brings the list back.',
    clearFilters: 'Clear filters',
    demoNote:
      'Sample menu and sample prices in Bangladeshi taka, written for this demonstration. Allergen information is illustrative and must not be relied on — several items are deliberately marked as having an incomplete declaration.',
    orderHeading: 'Your counter order',
    orderEmpty:
      'Nothing added yet. Anything you pick here waits for you at the add-ons step of your booking — you do not have to decide now.',
    subtotal: 'Subtotal · {{items}}',
    backToBooking: 'Back to your booking',
    pickAFilm: 'Pick a film and book',
    clearOrder: 'Clear the order',
    orderNote:
      "Add-ons are paid for with your tickets at the booking's payment step, and collected from the counter on the day.",
  },

  booking: {
    startOver: 'Start over',
    steps: 'Booking steps',
    stepOf: '{{step}} · step {{index, number}} of {{total, number}}',
    staleSeats:
      '{{seats}} went while you were elsewhere in the flow. Go back to the seat map and pick again.',
    backToSeats: 'Back to seats',
    summary: 'Your booking',
    noScreening: 'No screening chosen yet.',
    tickets_one: '{{count, number}} ticket',
    tickets_other: '{{count, number}} tickets',
    seats: 'Seats',
    addOns: 'Add-ons',
    ticketCover: 'Ticket Cover',
    bookingFee: 'Booking fee',
    payment: 'Payment',
    total: 'Total',
    priceNote: 'Sample prices. Nothing is charged and no payment details are ever requested.',
    backAStep: 'Back a step',
    saving: 'Saving…',
    resetTitle: 'Start this booking again?',
    resetBody:
      'Your screening, tickets, seats and add-ons for {{title}} will be cleared. Bookings you have already completed are not affected.',
    keepGoing: 'Keep going',
    cleared: 'Booking cleared. Back to the first step.',
    demoNote:
      'A demonstration booking flow. Seat availability is generated locally and is not live, no payment is taken, and your completed booking is written only to this browser. See <about>about this build</about>.',
  },

  confirmation: {
    notFoundEyebrow: 'Not found on this device',
    seeBookings: 'See bookings on this device',
    bookAScreening: 'Book a screening',
    reference: 'Booking reference {{reference}}',
    tickets_one: '{{count, number}} ticket',
    tickets_other: '{{count, number}} tickets',
    bookAnother: 'Book another film',
    notFoundTitle: 'We have no booking with that reference.',
    notFoundBody:
      'Bookings in this demonstration are stored in the browser that made them. If you booked in a different browser, on another device, or cleared this browser’s data, there is nothing here to show.',
    qrNote:
      'The code contains this reference and nothing else — no name, contact details or payment information.',
    demoTicket: 'Demonstration ticket',
    notValid: 'Not valid for entry',
    print: 'Print or save as PDF',
    addToCalendar: 'Add to calendar',
    askMax: 'Ask Max about this booking',
    onTheDay: 'On the day',
    whatYouPaid: 'What you paid',
    addOns: 'Add-ons',
    bookingFee: 'Booking fee',
    total: 'Total',
    noPaymentNote:
      'No payment was actually taken. This is a record of what the booking would have cost.',
    demoNote:
      'This ticket is part of a demonstration build. No payment was taken, no cinema has been notified, and this reference is not recognised anywhere.',
  },

  ticketPrices: {
    title: 'Ticket prices',
  },

  about: {
    title: 'About',
  },

  contact: {
    title: 'Contact',
  },

  showtime: {
    availability: {
      available: 'Available',
      fillingFast: 'Filling fast',
      almostFull: 'Almost full',
      soldOut: 'Sold out',
    },
    endsAbout: 'ends ~{{time}}',
    fromPrice: 'from {{price}}',
    seatsLeft_one: '{{count, number}} seat left',
    seatsLeft_other: '{{count, number}} seats left',
    startingNow: 'starting now',
    startsIn_one: 'starts in {{count, number}} minute',
    startsIn_other: 'starts in {{count, number}} minutes',
    /** The full spoken label. Assembled from the parts above. */
    endsAboutSpoken: 'ends about {{time}}',
    seatsAndPrice: '{{seats}}, from {{price}}',
    bookLabel: 'Book {{time}}, {{format}}, {{seats}}',
  },

  trailer: {
    watch: 'Watch trailer',
    watchOfficial: 'Watch official trailer',
    watchFor: 'Watch the trailer for {{movie}}',
    playerTitle: '{{movie}} — official trailer',
    loading: 'Loading the player…',
    watchOnYouTube: 'Watch on YouTube',
    officialTrailerBy: 'Official trailer · {{channel}}',
    officialTeaserBy: 'Official teaser · {{channel}}',
    notReleasedTitle: 'Trailer not released yet',
    notReleasedBody:
      'The studio has not published a trailer or teaser for this film. Rather than link you to an unofficial upload, there is nothing here yet.',
  },

  story: {
    heading: 'Story',
    fullSynopsis: 'Full synopsis',
    readMore: 'Read more',
    showLess: 'Show less',
    viewDetails: 'View details',
    selected: 'Selected: {{title}}.',
  },

  filters: {
    heading: 'Filters',
    search: 'Search',
    searchPlaceholder: 'Title, director, cast…',
    genre: 'Genre',
    language: 'Language',
    format: 'Format',
    cinema: 'Cinema',
    certificate: 'Certificate',
    runningTime: 'Running time',
    accessibility: 'Accessibility',
    accessibilityNote:
      'Filters screenings, not films. Open captions are on the print; closed captions come on a device from the box office.',
    /** `{{duration}}` arrives already formatted — "1h 40m" · "১ঘ ৪০মি". */
    under: 'Under {{duration}}',
    after: 'After {{time}}',
    before: 'Before {{time}}',
    underPrice: 'Under {{price}}',
    quotedQuery: '“{{query}}”',
    filteringBy: 'Filtering by',
    removeFilter: 'Remove filter',
    clearAll: 'Clear all',
    showCount: 'Show {{count, number}}',
  },

  markers: {
    heading: 'Screening markers',
  },

  movies: {
    eyebrow: 'The Programme',
    nowShowing: 'Now showing',
    comingSoon: 'Coming soon',
    ledeNowShowing:
      'Everything on across the five houses this week. Filter by what you can get to, when you are free, and what you need on screen.',
    ledeComingSoon:
      'Films we have booked but not yet opened. Advance booking opens four weeks before release.',
    screeningOn: 'Screening on',
    showEveryDay: 'Show every day',
    /** `<n>` is the animated counter, not a plain number. */
    films_one: '<n></n> film',
    films_other: '<n></n> films',
    matchingFilters_one: 'matching {{count, number}} filter',
    matchingFilters_other: 'matching {{count, number}} filters',
    emptyTitle: 'Nothing matches all of that',
    emptyBody:
      'No film in the programme fits every filter you have applied. Removing the narrowest one usually helps — accessibility and running time cut the list hardest.',
    emptyAlternative: 'You can also <showtimes>browse by showtime</showtimes> instead.',
    clearAllFilters: 'Clear all filters',
  },

  movieDetails: {
    breadcrumb: 'Breadcrumb',
    backToProgramme: '← The Programme',
    notYetRated: 'Not yet rated',
    subtitles: '{{languages}} subtitles',
    interval: '{{count, number}}-minute interval',
    chooseShowtime: 'Choose a showtime',
    opens: 'Opens {{date}}',
    share: 'Share',
    linkCopied: 'Link copied',
    copyPrompt: 'Copy this link',
    shareTitle: '{{title}} — GrandPlex',
    restrictionNote:
      'The booking flow will check the ticket categories you choose against this. This site does not verify anyone’s age — the door does.',
    credits: {
      director: 'Director',
      cast: 'Cast',
      released: 'Released',
      availableIn: 'Available in',
      adultTicket: 'Adult ticket',
      plusBookingFee: '+ {{fee}} booking fee',
    },
    theFilm: 'The film',
    programmeNotes: 'Programme notes',
    trailer: 'Trailer',
    noTrailerTitle: 'No trailer available',
    noTrailerBody:
      'We do not hold a trailer for {{title}} in this build. Rather than link you to something for a different film, there is nothing here. The synopsis and programme notes above are the fullest description we have.',
    showtimes: 'Showtimes',
    notOnSaleTitle: 'Not yet on sale',
    notOnSaleBody:
      '{{title}} opens on {{date}}. Advance booking opens four weeks before release, and this page will show times as soon as it does.',
    seeWhatIsOn: 'See what is on now',
    allCinemas: 'All cinemas',
    anyHouse: 'any house',
    noScreeningsTitle: 'No screenings that day',
    noScreeningsBody:
      '{{title}} is not scheduled at {{cinema}} on the date you picked. Try another day, or clear the cinema filter.',
    showAllCinemas: 'Show all cinemas',
    notRealListings: 'These are not real GrandPlex listings and nothing here reflects live inventory.',
    pricingHeading: 'What a ticket costs',
    fullPrice: 'Full price',
    ageFrom: '{{from}}+',
    ageBetween: '{{from}}–{{to}}',
    feeNote:
      'Plus a {{fee}} booking fee per ticket, shown in every total. Screenings before 3pm are {{discount}} cheaper a seat.',
    howPricingWorks: 'How pricing works',
    presentedIn: 'Presented in',
    stepOutHeading: 'If you need to step out',
    hasInterval: 'This film is programmed with a {{count, number}}-minute interval.',
    noInterval: 'This film runs without an interval.',
    stepOutBody:
      'Ask Max for the listed low-action windows — they are approximate, and it will warn you before describing any scene.',
    fromPrice: 'from {{price}}',
  },

  showtimes: {
    eyebrow: 'Find a time',
    title: 'Showtimes',
    ledeAll: 'Every screening across the circuit, day by day. Showing all five houses.',
    ledeCinemas: 'Every screening across the circuit, day by day. Showing {{cinemas}}.',
    date: 'Date',
    timeOfDayHeading: 'Time of day',
    timeOfDay: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      late: 'Late night',
    },
    screenings_one: '{{count, number}} screening',
    screenings_other: '{{count, number}} screenings',
    films_one: '{{count, number}} film',
    films_other: '{{count, number}} films',
    /** Both halves arrive already pluralised and localized. */
    summary: '<strong>{{screenings}}</strong> across {{films}}',
    emptyTitle: 'Nothing scheduled for that combination',
    emptyBody:
      'No screening on this date matches your filters. Try a different day on the strip above, widen the time of day, or <clear>clear the filters</clear>.',
    demoNote:
      'Sample schedule and seat availability, generated locally in your browser. These are not real listings and no live inventory is being checked.',
  },

  /**
   * The closed vocabulary of the domain — see `@/i18n/domain`. These appear on
   * filter chips, posters, tickets and in Max's replies, so they are kept
   * together and checked against `docs/bangla-glossary.md`.
   */
  domain: {
    genres: {
      drama: 'Drama',
      thriller: 'Thriller',
      action: 'Action',
      comedy: 'Comedy',
      romance: 'Romance',
      sciFi: 'Sci-fi',
      documentary: 'Documentary',
      animation: 'Animation',
      family: 'Family',
      horror: 'Horror',
      musical: 'Musical',
      historical: 'Historical',
    },
    languages: {
      bn: 'Bangla',
      en: 'English',
      hi: 'Hindi',
    },
    formats: {
      standard: '2D',
      threeD: '3D',
      grandscreen: 'Grandscreen',
      velvet: 'Velvet Room',
    },
    formatBlurbs: {
      standard: 'Our standard presentation: 2D, digital projection, 5.1 sound.',
      threeD:
        'Stereoscopic 3D. Glasses are handed out at the door and collected on the way out.',
      grandscreen:
        'The largest screens in the circuit, with a wider frame and a 12-channel sound bed.',
      velvet:
        'Reclining seats, table service before the feature, and a house that seats under eighty.',
    },
    certificates: {
      u: {
        /** The badge form. A regulatory code — Latin in both languages. */
        short: 'U',
        label: 'U — Universal',
        guidance: 'Suitable for all ages.',
      },
      ua12: {
        short: 'U/A 12+',
        label: 'U/A 12+',
        guidance:
          'Under 12s are admitted only with an accompanying adult ticket in the same booking.',
      },
      ua16: {
        short: 'U/A 16+',
        label: 'U/A 16+',
        guidance:
          'Under 16s are admitted only with an accompanying adult ticket in the same booking. Contains material some younger viewers may find distressing.',
      },
      a18: {
        short: 'A',
        label: 'A — 18 and over',
        guidance: 'No admission under 18. Child tickets cannot be sold for this film.',
      },
    },
    amenities: {
      parking: 'Parking',
      cafe: 'Café',
      lounge: 'Lounge',
      atm: 'ATM',
      prayerRoom: 'Prayer room',
      babyChange: 'Baby change',
      cloakroom: 'Cloakroom',
      giftCard: 'Gift cards',
    },
    access: {
      stepFree: 'Step-free access',
      accessibleToilet: 'Accessible toilet',
      hearingLoop: 'Hearing loop',
      companionSeat: 'Companion seats',
      assistanceDogs: 'Assistance dogs welcome',
      liftAccess: 'Lift access',
      accessibleParking: 'Accessible parking',
    },
    accessDetail: {
      stepFree: 'Step-free access from the street',
      accessibleToilet: 'Accessible toilet on the cinema floor',
      hearingLoop: 'Induction loop in every house',
      companionSeat: 'Companion seats beside every wheelchair space',
      assistanceDogs: 'Assistance dogs welcome throughout',
      liftAccess: 'Lift access to the cinema floor',
      accessibleParking: 'Accessible parking bays',
    },
    accessibility: {
      openCaptions: {
        label: 'Open captions',
        blurb:
          'Captions are part of the picture. Everyone in the house sees them; no equipment needed.',
      },
      closedCaptions: {
        label: 'Closed captions',
        blurb:
          'Captions on a personal device collected from the box office. Only you see them.',
      },
      audioDescription: {
        label: 'Audio description',
        blurb: 'A described soundtrack through a headset collected from the box office.',
      },
      wheelchairSpaces: {
        label: 'Wheelchair spaces',
        blurb: 'Wheelchair spaces with companion seats immediately alongside.',
      },
      hearingLoop: {
        label: 'Hearing loop',
        blurb: 'An induction loop covering the whole house, for hearing aids set to T.',
      },
      sensoryFriendly: {
        label: 'Sensory friendly',
        blurb:
          'House lights partly up, sound reduced, no trailers, and freedom to move about.',
      },
    },
  },

  /**
   * Units consumed by `@/i18n/formatters`, not by `t()` directly. They live in
   * the catalogue rather than in the formatter so that every word a customer
   * reads has exactly one home.
   */
  formats: {
    runtime: {
      /** Abbreviated, as in "2h 45m" — it sits inside dense metadata rows. */
      hour: 'h',
      minute: 'm',
    },
  },

  metadata: {
    /** `{{page}} — GrandPlex` */
    titleTemplate: '{{page}} — GrandPlex',
    booking: 'Booking',
    confirmation: 'Your ticket',
    notFound: 'Page not found',
    siteName: 'GrandPlex',
    home: 'The Programme',
    description:
      'GrandPlex — browse the programme, compare showtimes and book seats. A local, frontend-only demonstration build.',
  },
} as const;

export type Resources = typeof en;
