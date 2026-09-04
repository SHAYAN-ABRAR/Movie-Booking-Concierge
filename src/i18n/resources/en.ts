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
      optional: 'Optional',
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
      'Seventeen screens across five houses in Dhaka, Chattogram and Sylhet. The programme changes every Thursday.',
    columns: {
      contact: 'Contact',
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
    aiDisclosure:
      'Venue images are AI-generated illustrations. GrandPlex is a demonstration — these rooms do not exist.',
    eyebrow: 'Five houses',
    title: 'Our cinemas',
    lede:
      'Three cities, seventeen screens. Each house runs its own programme — the strands below are what makes each one different.',
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
    screen: 'Screen',
    legend: 'Legend',
    chosenOf: '{{chosen}} of {{limit}} chosen',
    listbox:
      'Seat map for {{screen}}. Use the arrow keys to move between seats and Enter or Space to choose one. {{limit}} to choose.',
    thisScreen: 'this screen',
    rowLabel: 'Row {{row}}',
    seatLabel: 'Row {{row}}, seat {{number}}',
    besideAisle: 'beside an aisle',
    suggestedByMax: 'suggested by Max',
    band: {
      front: 'front of the house',
      middle: 'middle of the house',
      back: 'back of the house',
    },
    seatClass: {
      regular: 'Regular',
      premium: 'Premium',
      recliner: 'Recliner',
      wheelchair: 'Wheelchair space',
      companion: 'Companion seat',
      companionShort: 'Companion',
    },
    status: {
      available: 'available',
      sold: 'sold',
      held: 'being booked by someone else',
      notASeat: 'not a seat',
    },
    state: {
      chosen: 'Chosen',
      held: 'Being booked',
      sold: 'Sold',
    },
    seatsToChoose_one: '{{count, number}} seat',
    seatsToChoose_other: '{{count, number}} seats',
    released: 'Seat {{seat}} released. {{chosen}} of {{limit}} chosen.',
    taken: 'Seat {{seat}}, {{seatClass}}, {{price}}. {{chosen}} of {{limit}} chosen.',
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
    /**
     * The figure printed on each offer poster, and the line under it.
     *
     * These live here rather than only in `offerArt.ts` because they are the
     * one thing on a promotion a reader actually has to understand, and a
     * number set in Latin digits is not readable copy in Bangla. The artwork
     * is generated with an empty region precisely so this can be real,
     * translatable text.
     *
     * `figure` must stay identical to the same offer's `figure` in
     * `offerArt.ts` — that file is checked against the offer's own mechanic,
     * and `stationery.test.tsx` fails if the two ever drift apart.
     */
    figures: {
      matinee: { figure: '৳60', note: 'off each seat' },
      familyFour: { figure: '৳200', note: 'off the Family box' },
      lateRepertory: { figure: '10 pm', note: 'Thursdays, Dhanmondi' },
      sensory: { figure: '1st', note: 'Saturday of the month' },
      studentWeeknight: { figure: '15%', note: 'off the seat price' },
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
    dietary: {
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      halal: 'Halal',
      'contains-dairy': 'Contains dairy',
      spicy: 'Spicy',
    },
    allergen: {
      milk: 'Milk',
      nuts: 'Nuts',
      peanuts: 'Peanuts',
      gluten: 'Gluten',
      soy: 'Soy',
      egg: 'Egg',
    },
    allergensLabel: 'Allergens',
    noneDeclared: 'none declared',
    serves_one: 'Serves one',
    serves_other: 'Serves {{count, number}}',
    add: 'Add',
    removeOne: 'Remove one {{item}}',
    addOne: 'Add one {{item}}',
    quantityOf: 'Quantity of {{item}}',
    allergenIncompleteTip:
      'The kitchen has not confirmed a full allergen declaration for this item. Ask at the counter before ordering if you have an allergy.',
    allergenIncomplete: 'Allergen list incomplete — check at the counter',
  },

  movieCard: {
    viewShowtimes: 'View showtimes',
    releaseDetails: 'Release details',
    notYetRated: 'Not yet rated',
  },

  featured: {
    nowShowing: 'Now showing',
    bookFilm: 'Book {{title}}',
    fullDetails: 'Full details',
    programmeNotes: "From this week's programme notes",
    showFilm: 'Show {{title}} ({{position}} of {{total}})',
    pauseSequence: 'Pause the featured film sequence',
    resumeSequence: 'Resume the featured film sequence',
    directedBy: 'Directed by',
    demoNote:
      'GrandPlex is a demonstration build — the films, schedules and prices are sample data. You can complete a booking as a guest; no payment is taken.',
  },

  bookings: {
    removeTitle: 'Remove this booking?',
    removeBody:
      'Booking {{reference}} will be deleted from this browser. You can undo it for a few seconds afterwards.',
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
    aiDisclosure:
      'Concession images are AI-generated illustrations. Actual presentation may vary.',
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

  bookingSteps: {
    session: {
      whichCinema: 'Which cinema',
      cinema: 'Cinema',
      chooseCinema: 'Choose a cinema',
      whichDay: 'Which day',
      whichScreening: 'Which screening',
      cinemaFirst: 'Choose a cinema first.',
      nothingScheduled: 'Nothing scheduled that day',
      nothingScheduledBody:
        '{{title}} is not on at {{cinema}} on the day you picked. Try another date above, or another house.',
      thisCinema: 'this cinema',
      yourScreening: 'Your screening',
      screen: 'Screen',
      format: 'Format',
      language: 'Language',
      subtitles: 'Subtitles',
      none: 'None',
      runningTime: 'Running time',
      certificate: 'Certificate',
      accessHeading: 'Access at this screening',
      noAccessListed:
        "No additional access provisions are listed for this particular screening. The house's permanent facilities still apply — see the",
      cinemaPage: 'cinema page',
    },
    tickets: {
      heading: 'How many, and who for',
      lede:
        'Pick a category for each person. We never ask for a date of birth — the category is enough to price the ticket, and the door checks ID where it needs to.',
      changeChild: 'Change the child ticket to another category to continue.',
      costHeading: 'What that costs',
      costLede:
        'Seats have not been chosen yet, so this uses the cheapest seat class still free at this screening. It will settle once you pick seats.',
      estimated_one: '{{count, number}} ticket · estimated',
      estimated_other: '{{count, number}} tickets · estimated',
      categoryDiscount: 'Age-category discount',
      beforeThree: 'Before three',
      bookingFeeLine: 'Booking fee · {{fee}} × {{count, number}}',
      samplePricing: 'Sample pricing. Nothing is charged at any point in this demonstration.',
    },
    seats: {
      heading: 'Choose your seats',
      needTickets: 'Go back a step and choose how many tickets you need first.',
      pick_one:
        'Pick {{count, number}} seat to match your tickets. Use the arrow keys to move around the map and Enter or Space to choose a seat.',
      pick_other:
        'Pick {{count, number}} seats to match your tickets. Use the arrow keys to move around the map and Enter or Space to choose a seat.',
    },
    concessions: {
      heading: 'Anything from the counter',
      lede:
        'Entirely optional — you can go straight on. Anything you add is paid for with your tickets and collected at the counter on the day.',
      familySaved: 'Family of Four saved {{amount}}',
      clear: 'Clear add-ons',
      coverTitle: '{{name}} · {{fee}} per booking',
      addCover: 'Add {{name}} to this booking',
      coverNote:
        'A sample product for this demonstration. No policy is issued, no premium is taken, and no claim can actually be made — Max can walk you through what a claim would involve.',
    },
    guest: {
      heading: 'Who is the booking for',
      lede:
        'Four fields, and only because a booking needs a name on it. There is no account to create, no password to choose, and nothing to verify by email.',
      name: 'Full name',
      email: 'Email',
      emailHint:
        'Your booking reference is shown on screen — this is only kept on the booking record in this browser.',
      phone: 'Mobile number',
      note: 'Anything the house should know',
      noteHint: 'Access needs, a wheelchair transfer, a birthday — anything useful on the night.',
      privacy:
        'Your details stay in this browser tab and are written onto the local booking record when you confirm. They are never transmitted, because there is nowhere to transmit them to.',
    },
    payment: {
      heading: 'How you would pay',
      lede:
        'Choose a method and carry on. This step records which kind of payment you would have used — nothing more happens.',
      warningTitle: 'This is a demonstration. No payment will be taken.',
      warningBody:
        'There is no payment form on this page and never will be. This site does not ask for card numbers, account details, PINs, OTPs or passwords, and it has no server to send them to even if it did.',
      method: 'Payment method',
      amountHeading: 'Amount that would be charged',
      including: 'Including the {{fee}} booking fee. No other charges.',
      includingCover: 'Including the {{fee}} booking fee and {{cover}} {{name}}. No other charges.',
    },
    review: {
      heading: 'Check it over',
      duplicateTitle: 'You may already have this booking',
      duplicateBody: 'Booking <ref>{{reference}}</ref> in this browser has {{reasons}}. Buying a second set of tickets may be exactly what you intend — more people joining, or a separate group — so this is a check, not a block.',
      duplicateScope:
        "Only this browser's history was checked. Bookings made on another device or in another browser cannot be seen from here.",
      duplicateAcknowledge: 'Continue with another booking anyway',
      duplicateReview: 'Review the existing booking',
      theScreening: 'The screening',
      seatsAndTickets: 'Seats and tickets',
      ticketsLink: 'Tickets',
      seatsLink: 'Seats',
      seats: 'Seats',
      ticketSubtotal: 'Ticket subtotal',
      addOns: 'Add-ons',
      change: 'Change',
      nothingAdded: 'Nothing added.',
      familyOfFour: 'Family of Four',
      bookedFor: 'Booked for',
      payment: 'Payment',
      notChosen: 'Not chosen',
      paymentNote:
        'Recorded as a category only. No payment is taken and no payment details were requested.',
      total: 'Total',
      totalNote: 'That is everything. No service charge, no card fee, nothing added at the end.',
    },
  },
  booking: {
    guestCheckout: 'Booking · guest checkout',
    nextStep: 'Next: {{step}}',
    continue: 'Continue',
    savingBooking: 'Saving your booking…',
    confirmTotal: 'Confirm booking · {{total}}',
    saveFailed:
      'We could not save your booking to this browser. Nothing has been charged. Please try again.',
    staleSeatsTitle_one: 'The seat you chose is no longer available',
    staleSeatsTitle_other: 'The seats you chose are no longer available',
    blockers: {
      session: 'Choose a cinema, a day and a screening to continue.',
      noTickets: 'Add at least one ticket to continue.',
      ageBlocked: 'Change the child ticket — this film is rated 18 and over.',
      ageUnconfirmed: 'Confirm that an adult will accompany the under-age tickets.',
      seatCount_one: 'Choose {{count, number}} seat to match your tickets.',
      seatCount_other: 'Choose {{count, number}} seats to match your tickets.',
      staleSeat: 'One of your seats is no longer available.',
      guest: 'Fill in your name, email and mobile number to continue.',
      payment: 'Choose how you would pay to continue.',
      detailsIncomplete: 'Your details are incomplete.',
    },
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

  receipt: {
    processing: 'Processing your booking',
    printing: 'Printing your ticket',
    complete: 'Booking complete',
    machineLabel: 'Box office printer',
    tearOff: 'Tear along the perforation',
  },

  confirmHold: {
    hold: 'Hold to confirm',
    holdToRemove: 'Hold to remove',
    holdToDelete: 'Hold to delete everything',
    confirmed: 'Done',
    undo: 'Undo',
    removed: 'Booking {{reference}} removed.',
    clearedAll_one: '{{count, number}} booking deleted.',
    clearedAll_other: '{{count, number}} bookings deleted.',
    restored: 'Restored.',
  },

  confirmation: {
    viewTicket: 'View your ticket',
    ticketDialogTitle: 'Your ticket',
    ticketDialogBody:
      'The stub is torn at the door and the rest is yours. The reference below is the same one on the receipt.',
    ticketFor: 'Ticket for {{title}}',
    admitLabel: 'Admit',
    referenceLabel: 'Reference',
    barcodeNote: 'Decorative. The scannable code is on the receipt.',
    complete: 'Booking complete',
    bookedFor: "You're booked for {{title}}.",
    referenceNote:
      'Your reference is {{reference}}. It is saved in this browser and shown on the ticket below.',
    admit_one: '{{brand}} · admit {{count, number}}',
    admit_other: '{{brand}} · admit {{count, number}}',
    field: {
      cinema: 'Cinema',
      screen: 'Screen',
      date: 'Date',
      time: 'Time',
      seats: 'Seats',
      tickets: 'Tickets',
      bookedFor: 'Booked for',
      paid: 'Paid',
    },
    endsAbout: 'ends ~{{time}}',
    coverIncluded: '{{name}} included',
    doorBy: 'Aim to be at the door by {{time}}.',
    trailersRun: 'Trailers run {{count, number}} minutes before the feature.',
    arriveBy: 'Arrive by {{time}} for tickets, the counter and finding your seat.',
    directionsTo: 'Directions to {{cinema}}',
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

  maxPanel: {
    ask: 'Ask Max',
    askUnread_one: 'Ask Max — {{count, number}} new reply',
    askUnread_other: 'Ask Max — {{count, number}} new replies',
    role: 'Booking concierge · runs on this device',
    you: 'You',
    settings: 'About Max and settings',
    close: 'Close Max',
    privacy:
      'Max reads the same local sample data the rest of this site uses. Your conversation is kept in this browser tab only and is never transmitted. It has no access to live cinema inventory, cannot contact staff, and will not complete a purchase for you.',
    rewordLabel: 'Reword replies with Ollama ({{model}})',
    ollamaOn:
      "A local Ollama daemon was detected on this machine. With this on, the reply text — and nothing else — is sent to it to be reworded. Prices, showtimes, seats and actions are always computed here and are never changed by the model. A cloud model tag makes your local daemon relay the text onward to Ollama's servers.",
    ollamaOff:
      'No local Ollama daemon detected, so Max is answering entirely from its own deterministic engine. That is the default and needs nothing installed.',
    clearConversation: 'Clear this conversation',
    conversation: 'Conversation with Max',
    conversationCleared: 'Conversation cleared.',
    intro:
      'I can find screenings, compare them, work out what a booking will cost and suggest seats. Ask in English or Bangla.',
    introNote:
      'Everything here is sample data for this demonstration — no live inventory, no payment, nothing sent anywhere.',
    thinking: 'Working that out…',
    canUndo: 'That can be undone.',
    undone: 'Undone.',
    suggestedQuestions: 'Suggested questions',
    askLabel: 'Ask Max a question',
    placeholder: 'Ask about films, times, seats or prices…',
    send: 'Send to Max',
    composerHint:
      'Enter to send, Shift + Enter for a new line. Max never asks for passwords, card numbers, PINs or OTPs.',
    rewordedNote:
      'Reworded by your local Ollama model. The figures and actions came from this device.',
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
      runtime: 'Running time',
      language: 'Language',
      genre: 'Genre',
      certificate: 'Certificate',
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
