import type { LocaleResource } from '../types';

/**
 * Bangla interface copy.
 *
 * Written as a Bangladeshi cinema would write it, not translated word by word.
 * Transactional controls stay short and plain — "চালিয়ে যান", not a literary
 * construction. Terminology follows `docs/bangla-glossary.md`; where an English
 * loanword is what people actually say at a box office ("টিকিট", "বুকিং"), the
 * loanword is used rather than a stiff coinage.
 *
 * Typed against `Resources`, so a missing key is a compile error before
 * `check:i18n` ever runs.
 */
export const bn: LocaleResource = {
  common: {
    actions: {
      continue: 'চালিয়ে যান',
      back: 'পেছনে',
      cancel: 'বাতিল',
      confirm: 'নিশ্চিত করুন',
      close: 'বন্ধ করুন',
      clear: 'মুছে ফেলুন',
      apply: 'প্রয়োগ করুন',
      retry: 'আবার চেষ্টা করুন',
      startOver: 'নতুন করে শুরু',
      seeAll: 'সব দেখুন',
      book: 'বুক করুন',
    },
    labels: {
      loading: 'লোড হচ্ছে',
      demonstration: 'ডেমো',
      today: 'আজ',
      tomorrow: 'আগামীকাল',
    },
  },

  preferences: {
    language: {
      label: 'ভাষা',
      heading: 'ভাষা',
      changed: 'ভাষা বাংলায় পরিবর্তন করা হয়েছে।',
    },
    appearance: {
      label: 'প্রদর্শন',
      heading: 'প্রদর্শন',
      light: 'উজ্জ্বল',
      dark: 'অন্ধকার',
      changedLight: 'উজ্জ্বল থিমে পরিবর্তন করা হয়েছে।',
      changedDark: 'অন্ধকার থিমে পরিবর্তন করা হয়েছে।',
    },
  },

  nav: {
    primary: 'প্রধান',
    mobile: 'মোবাইল',
    menu: 'মেনু',
    openMenu: 'মেনু খুলুন',
    programme: 'প্রোগ্রাম',
    showtimes: 'শোটাইম',
    cinemas: 'সিনেমা হল',
    counter: 'কাউন্টার',
    offers: 'অফার',
    skipToContent: 'মূল বিষয়বস্তুতে যান',
    home: 'গ্র্যান্ডপ্লেক্স — হোম',
    ticketPrices: 'টিকিটের দাম',
    myBookings: 'আমার বুকিং',
    about: 'পরিচিতি',
    contact: 'যোগাযোগ',
    yourCinema: 'আপনার হল',
    book: 'বুক করুন',
  },

  a11y: {
    pageLoaded: '{{title}}। পাতা এসেছে।',
    pageLoadedFallback: 'পাতা এসেছে।',
  },

  footer: {
    blurb:
      'ঢাকা, চট্টগ্রাম ও সিলেটে পাঁচটি হলে নয়টি পর্দা। প্রতি বৃহস্পতিবার প্রোগ্রাম বদলায়।',
    columns: {
      programme: 'প্রোগ্রাম',
      visiting: 'আসা-যাওয়া',
      yourVisit: 'আপনার আসা',
    },
    links: {
      nowShowing: 'এখন চলছে',
      comingSoon: 'আসছে',
      showtimes: 'শোটাইম',
      offers: 'অফার',
      allCinemas: 'সব হল',
      theCounter: 'কাউন্টার',
      ticketPrices: 'টিকিটের দাম',
      contactSupport: 'যোগাযোগ ও সহায়তা',
      myBookings: 'আমার বুকিং',
      aboutGrandPlex: 'গ্র্যান্ডপ্লেক্স সম্পর্কে',
      accessibility: 'প্রবেশগম্যতা',
      lostProperty: 'হারানো জিনিস',
    },
    houses: 'আমাদের হলগুলো',
    demonstrationTitle: 'এটি একটি ডেমো বিল্ড।',
    demonstrationBody:
      'গ্র্যান্ডপ্লেক্স কোনো সত্যিকারের সিনেমা চেইন নয়। এই সাইটের প্রতিটি ছবি, হল, সময়সূচি, আসন, দাম, অফার ও নীতিমালা এই প্রকল্পের জন্য লেখা নমুনা তথ্য। কোনো টাকা নেওয়া হয় না এবং কোনো তথ্য আপনার ব্রাউজারের বাইরে যায় না — বুকিং কেবল এই ব্রাউজারের লোকাল স্টোরেজে জমা থাকে।',
    copyright: '© {{year}} গ্র্যান্ডপ্লেক্স',
  },

  location: {
    label: 'আপনার হল বেছে নিন',
    all: 'সব হল',
  },

  alerts: {
    title: 'অ্যালার্ট',
    labelUnread: 'অ্যালার্ট — {{count, number}}টি অপঠিত',
    labelNone: 'অ্যালার্ট — এখনও কিছু নেই',
    clearAll: 'সব মুছুন',
    empty: 'কোনো অ্যালার্ট নেই। আপনি যে শো-এর দিকে নজর রাখছেন, ম্যাক্স তার জন্য একটি ডেমো অ্যালার্ট রাখতে পারে।',
    // Bangla does not inflect the noun for number, so both forms read the same.
    // They are still both present: i18next selects on the plural rule, and a
    // missing `_other` would fall through to the raw key.
    emptyWithWatches_one: 'আপনার {{count, number}}টি ডেমো অ্যালার্ট জমা আছে। এখনও কোনোটি আসেনি।',
    emptyWithWatches_other: 'আপনার {{count, number}}টি ডেমো অ্যালার্ট জমা আছে। এখনও কোনোটি আসেনি।',
    view: '{{title}} দেখুন',
    dismiss: 'অ্যালার্ট সরান: {{title}}',
    savedWatches: 'জমা রাখা নজর',
    screening: 'শো',
    browserPitch:
      'অ্যালার্ট সব সময় এখানে আসে। চাইলে ব্রাউজার নোটিফিকেশন হিসেবেও দেখাতে পারেন।',
    allowBrowser: 'ব্রাউজার নোটিফিকেশন চালু করুন',
    demoNote:
      'শুধু ডেমো অ্যালার্ট। এখানে কিছুই সত্যিকারের হলের আসন-তথ্য দেখে না, এবং কিছুই ইমেইল বা অন্য ডিভাইসে পাঠানো হয় না। নজরগুলো এই ব্রাউজারেই থাকে এবং ডেটা মুছলে হারিয়ে যায়।',
    kinds: {
      priceDrop: 'দাম কমা',
      premiumSeat: 'প্রিমিয়াম আসন খালি',
      adjacentSeats: 'পাশাপাশি আসন',
      accessibleSeat: 'প্রবেশগম্য আসন খালি',
    },
    blurbs: {
      priceDrop: 'এই শো-এর নমুনা দাম কমলে জানাবে।',
      premiumSeat: 'কোনো প্রিমিয়াম বা রিক্লাইনার আসন খালি হলে জানাবে।',
      adjacentSeats: 'পাশাপাশি যথেষ্ট আসন আবার খালি হলে জানাবে।',
      accessibleSeat: 'হুইলচেয়ারের জায়গা বা সঙ্গীর আসন খালি হলে জানাবে।',
    },
  },

  errors: {
    eyebrow: 'এই পাতায় কিছু একটা গোলমাল হয়েছে',
    title: 'এই পাতাটি দেখানো গেল না।',
    reassurance:
      'সাইটের বাকি অংশ ঠিকঠাক চলছে, আর এই ব্রাউজারে আপনার জমা রাখা কিছুই হারায়নি — সম্পন্ন বুকিংগুলো এখনও “আমার বুকিং” পাতায় আছে।',
    noReporting:
      'এটি একটি ডেমো বিল্ড, এর পেছনে কোনো ত্রুটি-রিপোর্টিং সেবা নেই, তাই নিচের বিবরণ কেবল আপনার ব্রাউজার কনসোলেই থাকে।',
    home: 'হোম',
    bookAMovie: 'টিকিট কাটুন',
  },

  loading: {
    page: 'পাতা আসছে',
    ellipsis: 'আসছে…',
  },

  home: {
    programmeEyebrow: 'প্রোগ্রাম',
    onTonight: 'আজ রাতে',
    allShowtimes: 'সব শোটাইম',
    tonightEmpty:
      '{{cinema}}-এ আজ রাতের সব শো শুরু হয়ে গেছে। প্রোগ্রাম আবার শুরু হবে কাল সকালে — <tomorrow>কালকের সময় দেখুন</tomorrow>।',
    filmCount_one: '{{count, number}}টি ছবি',
    filmCount_other: '{{count, number}}টি ছবি',
    nowShowing: 'এখন চলছে',
    fullProgramme: 'পুরো প্রোগ্রাম',
    howWeShowFilms: 'আমরা যেভাবে ছবি দেখাই',
    fourWaysToWatch: 'দেখার চার রকম',
    whatItCosts: 'কত পড়ে',
    advanceNotice: 'আগাম খবর',
    comingSoon: 'আসছে',
    allUpcoming: 'সব আসন্ন ছবি',
    runningNow: 'এখন চলছে',
    offers: 'অফার',
    allOffers: 'সব অফার',
    readTheTerms: 'শর্তগুলো পড়ুন',
    fiveHouses: 'পাঁচটি হল',
    whereWeAre: 'আমরা কোথায়',
    allCinemas: 'সব হল',
    screenCount_one: '{{count, number}}টি পর্দা',
    screenCount_other: '{{count, number}}টি পর্দা',
    featuredLabel: 'এই সপ্তাহের নির্বাচিত ছবি',
    dateRange: '{{from}} – {{to}}',
  },

  cinemas: {
    eyebrow: 'পাঁচটি হল',
    title: 'আমাদের হলগুলো',
    lede:
      'তিন শহর, উনিশটি পর্দা। প্রতিটি হল নিজের মতো প্রোগ্রাম চালায় — নিচের ধারাগুলোই এক-একটিকে আলাদা করে।',
    nothingToday: 'আজ এখানে কোনো শো নেই।',
  },

  cinemaDetails: {
    breadcrumb: 'পথনির্দেশ',
    backToCinemas: '← সব হল',
    showtimes: 'শোটাইম',
    nothingScheduledTitle: 'কোনো শো নেই',
    nothingScheduledBody:
      'নমুনা প্রোগ্রামে এই তারিখে {{cinema}}-এ কোনো শো নেই। উপরের তালিকা থেকে অন্য দিন দেখুন।',
    sampleSchedule: 'নমুনা সময়সূচি, এখানেই তৈরি। কোনো হলের সত্যিকারের তালিকা নয়।',
    access: 'প্রবেশগম্যতা',
    accessNote:
      'হুইলচেয়ারের জায়গাগুলো আসনের নকশায় নিজস্ব চিহ্ন নিয়ে থাকে এবং সব সময় সাধারণ আসনের দামেই দেওয়া হয়। এখানে নেই এমন কিছু দরকার হলে হলে ফোন করুন <phone>{{phone}}</phone> নম্বরে — এই সাইট আপনার হয়ে তা ব্যবস্থা করতে পারে না।',
    gettingHere: 'যেভাবে আসবেন',
    transport: 'যাতায়াত',
    parking: 'পার্কিং',
    housePolicies: 'হলের নিয়ম',
    arrivingLate: 'দেরিতে পৌঁছালে',
    lostProperty: 'হারানো জিনিস',
    lostPropertyBody:
      'এই হলে পাওয়া জিনিস {{days, number}} দিন রাখা হয়। হারানো জিনিসের কাউন্টার খোলা থাকে {{hours}}।',
    lostPropertyMax:
      'ম্যাক্স আপনার বুকিং, পর্দা ও আসন বসিয়ে একটি হারানো-জিনিসের বিবরণ তৈরি করে দিতে পারে — তারপর উপরের ঠিকানায় আপনি নিজে সেটি পাঠাবেন।',
    theHouses: 'হলগুলো',
    amenities: 'সুবিধা',
  },

  seatMap: {
    screenEnd: 'পর্দা হলের এই দিকে',
    zoomIn: 'বড় করুন',
    zoomOut: 'ছোট করুন',
    priceNote:
      'দাম প্রতি আসনের, আপনার টিকিটের ধরন প্রয়োগের আগের, এবং এতে প্রতি টিকিটের {{fee}} বুকিং ফি ধরা নেই। হুইলচেয়ারের জায়গা ও সঙ্গীর আসন সব সময় সাধারণ দামেই।',
    clearSeats: 'আসন ছেড়ে দিন',
    allReleased: 'সব আসন ছেড়ে দেওয়া হয়েছে।',
  },

  dateStrip: {
    label: 'তারিখ বেছে নিন',
    back: 'আগের তারিখগুলো দেখুন',
    forward: 'পরের তারিখগুলো দেখুন',
  },

  offers: {
    eyebrow: 'এখন চলছে',
    title: 'অফার',
    lede:
      'পাঁচটি চলমান অফার। কোনোটিতেই কোড লাগে না, কোনোটিই কারও সঙ্গে যৌথ ব্যবস্থা নয় — আপনার ঝুড়িতে যা আছে তা দেখেই বুকিংয়ের সময় প্রতিটি আপনাআপনি বসে যায়।',
    everyDay: 'প্রতিদিন',
    allCinemas: 'সব হল',
    howApplied: 'যেভাবে প্রয়োগ হয়',
    terms: 'শর্তাবলি',
    findScreening: 'একটি শো খুঁজুন',
    howPricingWorks: 'দাম কীভাবে ঠিক হয়',
    demoNote:
      'এই ডেমোর জন্য লেখা নমুনা প্রচারমূলক তথ্য। এই অফারগুলো সত্যিকারের কোনো হলে পাওয়া যায় না, এর পেছনে কোনো অংশীদারি নেই, এবং বর্ণিত ছাড়গুলো কেবল উদাহরণ।',
    days: {
      sunday: 'রবিবার',
      monday: 'সোমবার',
      tuesday: 'মঙ্গলবার',
      wednesday: 'বুধবার',
      thursday: 'বৃহস্পতিবার',
      friday: 'শুক্রবার',
      saturday: 'শনিবার',
    },
  },

  max: {
    nudgeTitle: 'বুক করতে অসুবিধা হচ্ছে? আমাকে জিজ্ঞেস করুন — আমি সাহায্য করতে পারি।',
    nudgeBody: 'আমি ছবি খুঁজে দিতে পারি, শোটাইম মিলিয়ে দিতে পারি, আসন বাছতেও সাহায্য করতে পারি।',
    dismissNudge: 'এই বার্তাটি সরান',
    spoilerNote:
      'ওই মুহূর্তগুলোতে পর্দায় কী থাকে তা এখানে বলা আছে। সামান্য স্পয়লারে আপত্তি না থাকলেই খুলুন।',
    reveal: 'দেখান',
    removeAlert: 'এই অ্যালার্টটি সরান',
  },

  quickBook: {
    heading: 'চার ধাপে বুক করুন',
    noAccount: 'অ্যাকাউন্ট লাগে না · গেস্ট চেকআউট',
    chooseSeats: 'আসন বাছুন',
  },

  concessionCard: {
    allergenIncompleteTip:
      'এই খাবারটির পূর্ণ অ্যালার্জেন তালিকা রান্নাঘর এখনও নিশ্চিত করেনি। অ্যালার্জি থাকলে অর্ডারের আগে কাউন্টারে জিজ্ঞেস করে নিন।',
    allergenIncomplete: 'অ্যালার্জেন তালিকা অসম্পূর্ণ — কাউন্টারে জেনে নিন',
  },

  movieCard: {
    notYetRated: 'সনদ এখনও হয়নি',
  },

  featured: {
    demoNote:
      'গ্র্যান্ডপ্লেক্স একটি ডেমো বিল্ড — ছবি, সময়সূচি ও দাম সবই নমুনা তথ্য। গেস্ট হিসেবেই বুকিং শেষ করতে পারবেন; কোনো টাকা নেওয়া হয় না।',
  },

  bookings: {
    eyebrow: 'এই ডিভাইসে',
    title: 'আমার বুকিং',
    lede:
      'এই ব্রাউজারে আপনি যত বুকিং করেছেন, সব। এগুলো কেবল এই ডিভাইসেই জমা আছে — কোনো সার্ভারে নয়, আপনার অন্য কোনো ডিভাইসেও নয়।',
    viewTicket: 'টিকিট দেখুন',
    addToCalendar: 'ক্যালেন্ডারে যোগ করুন',
    clearHistory: 'ইতিহাস মুছুন',
    emptyTitle: 'এই ডিভাইসে এখনও কোনো বুকিং নেই',
    emptyBody:
      'কোনো বুকিং শেষ করলে সেটি এখানে আসবে, সঙ্গে রেফারেন্স ও ছাপার উপযোগী টিকিট। আর কোথাও কিছু জমা থাকে না, তাই নতুন ব্রাউজারে এই তালিকা খালি দিয়েই শুরু হয়।',
    findScreening: 'একটি শো খুঁজুন',
    demoNote:
      'ডেমো বুকিং। কোনো টাকা নেওয়া হয়নি, কোনো টিকিট কোথাও ঢোকার জন্য বৈধ নয়, এবং এখান থেকে কিছুই কোনো হলে পাঠানো হয়নি। ব্রাউজারের তথ্য মুছলে সবই মুছে যাবে।',
    clearTitle: 'সব বুকিংয়ের ইতিহাস মুছে দেবেন?',
    clearBody_one:
      'এতে এই ব্রাউজারে জমা {{count, number}}টি বুকিং মুছে যাবে। এটি আর ফেরানো যাবে না, এবং আর কোথাও কোনো কপি নেই।',
    clearBody_other:
      'এতে এই ব্রাউজারে জমা {{count, number}}টি বুকিংই মুছে যাবে। এটি আর ফেরানো যাবে না, এবং আর কোথাও কোনো কপি নেই।',
    keepThem: 'থাক',
    deleteEverything: 'সব মুছে দিন',
  },

  concessions: {
    eyebrow: 'কাউন্টার',
    title: 'খাবার ও পানীয়',
    ledeCinema:
      '{{cinema}}-এর কাউন্টারে যা যা পাওয়া যাচ্ছে। এখান থেকে যা নেবেন তা আপনার বুকিংয়ের সঙ্গে চলে যাবে।',
    fullAllergenOnly: 'শুধু পূর্ণ অ্যালার্জেন তথ্যসহ',
    itemCount_one: '{{count, number}}টি খাবার',
    itemCount_other: '{{count, number}}টি খাবার',
    onTheCounter: 'কাউন্টারে <strong>{{items}}</strong>',
    emptyTitle: 'এর সঙ্গে কিছু মিলছে না',
    emptyBody:
      'কাউন্টারের কোনো খাবার আপনার সব শর্তে মিলছে না। খাদ্যাভ্যাসের ফিল্টারগুলো মুছলে সাধারণত তালিকা ফিরে আসে।',
    clearFilters: 'ফিল্টার মুছুন',
    demoNote:
      'এই ডেমোর জন্য লেখা নমুনা মেনু ও নমুনা দাম, বাংলাদেশি টাকায়। অ্যালার্জেনের তথ্য কেবল উদাহরণ, এর ওপর ভরসা করা যাবে না — কয়েকটি খাবারে ইচ্ছে করেই অসম্পূর্ণ ঘোষণা দেখানো হয়েছে।',
    aiDisclosure:
      'কনসেশন পণ্যের ছবিগুলো এআই দিয়ে তৈরি নমুনা চিত্র। পরিবেশন ভিন্ন হতে পারে।',
    orderHeading: 'আপনার কাউন্টার অর্ডার',
    orderEmpty:
      'এখনও কিছু যোগ করা হয়নি। এখানে যা বাছবেন তা আপনার বুকিংয়ের অ্যাড-অন ধাপে অপেক্ষা করবে — এখনই ঠিক করতে হবে না।',
    subtotal: 'উপমোট · {{items}}',
    backToBooking: 'আপনার বুকিংয়ে ফিরুন',
    pickAFilm: 'ছবি বেছে বুক করুন',
    clearOrder: 'অর্ডার মুছুন',
    orderNote:
      'অ্যাড-অনের টাকা টিকিটের সঙ্গে বুকিংয়ের পেমেন্ট ধাপেই নেওয়া হয়, আর জিনিস সেদিন কাউন্টার থেকে নিতে হয়।',
  },

  booking: {
    startOver: 'নতুন করে শুরু',
    steps: 'বুকিংয়ের ধাপ',
    stepOf: '{{step}} · ধাপ {{index, number}}/{{total, number}}',
    staleSeats:
      'আপনি অন্য ধাপে থাকতে থাকতে {{seats}} চলে গেছে। আসনের নকশায় ফিরে আবার বেছে নিন।',
    backToSeats: 'আসনে ফিরুন',
    summary: 'আপনার বুকিং',
    noScreening: 'এখনও কোনো শো বাছা হয়নি।',
    tickets_one: '{{count, number}}টি টিকিট',
    tickets_other: '{{count, number}}টি টিকিট',
    seats: 'আসন',
    addOns: 'অ্যাড-অন',
    ticketCover: 'টিকিট কভার',
    bookingFee: 'বুকিং ফি',
    payment: 'পেমেন্ট',
    total: 'মোট',
    priceNote: 'নমুনা দাম। কোনো টাকা কাটা হয় না এবং পেমেন্টের তথ্য কখনও চাওয়া হয় না।',
    backAStep: 'এক ধাপ পেছনে',
    saving: 'জমা হচ্ছে…',
    resetTitle: 'বুকিংটি আবার শুরু করবেন?',
    resetBody:
      '{{title}}-এর জন্য বাছা শো, টিকিট, আসন ও অ্যাড-অন সব মুছে যাবে। আগে সম্পন্ন করা বুকিংগুলোতে কিছু হবে না।',
    keepGoing: 'চালিয়ে যাই',
    cleared: 'বুকিং মুছে ফেলা হয়েছে। প্রথম ধাপে ফেরা হলো।',
    demoNote:
      'এটি একটি ডেমো বুকিং প্রক্রিয়া। আসনের হিসাব এখানেই তৈরি, সত্যিকারের নয়; কোনো টাকা নেওয়া হয় না; আর আপনার সম্পন্ন বুকিং কেবল এই ব্রাউজারেই লেখা হয়। দেখুন <about>এই বিল্ড সম্পর্কে</about>।',
  },

  confirmation: {
    notFoundEyebrow: 'এই ডিভাইসে পাওয়া যায়নি',
    seeBookings: 'এই ডিভাইসের বুকিংগুলো দেখুন',
    bookAScreening: 'একটি শো বুক করুন',
    reference: 'বুকিং রেফারেন্স {{reference}}',
    tickets_one: '{{count, number}}টি টিকিট',
    tickets_other: '{{count, number}}টি টিকিট',
    bookAnother: 'আরেকটি ছবি বুক করুন',
    notFoundTitle: 'ওই রেফারেন্সে আমাদের কাছে কোনো বুকিং নেই।',
    notFoundBody:
      'এই ডেমোতে বুকিং যে ব্রাউজারে করা হয়েছে সেখানেই জমা থাকে। আপনি যদি অন্য ব্রাউজারে বা অন্য ডিভাইসে বুক করে থাকেন, কিংবা এই ব্রাউজারের তথ্য মুছে থাকেন, তাহলে দেখানোর মতো কিছু নেই।',
    qrNote:
      'কোডটিতে কেবল এই রেফারেন্সই আছে, আর কিছু নয় — নাম, যোগাযোগের তথ্য বা পেমেন্টের কোনো তথ্য নেই।',
    demoTicket: 'ডেমো টিকিট',
    notValid: 'প্রবেশের জন্য বৈধ নয়',
    print: 'ছাপুন বা পিডিএফ করে রাখুন',
    addToCalendar: 'ক্যালেন্ডারে যোগ করুন',
    askMax: 'এই বুকিং নিয়ে ম্যাক্সকে জিজ্ঞেস করুন',
    onTheDay: 'সেদিন',
    whatYouPaid: 'কত পড়ল',
    addOns: 'অ্যাড-অন',
    bookingFee: 'বুকিং ফি',
    total: 'মোট',
    noPaymentNote:
      'আসলে কোনো টাকা নেওয়া হয়নি। বুকিংটিতে কত পড়ত, এটি তারই হিসাব।',
    demoNote:
      'এই টিকিটটি একটি ডেমো বিল্ডের অংশ। কোনো টাকা নেওয়া হয়নি, কোনো হলকে জানানো হয়নি, এবং এই রেফারেন্স কোথাও গ্রাহ্য নয়।',
  },

  ticketPrices: {
    title: 'টিকিটের দাম',
  },

  about: {
    title: 'পরিচিতি',
  },

  contact: {
    title: 'যোগাযোগ',
  },

  showtime: {
    availability: {
      available: 'আসন আছে',
      fillingFast: 'দ্রুত ভরছে',
      almostFull: 'প্রায় ভরে গেছে',
      soldOut: 'টিকিট শেষ',
    },
    endsAbout: 'শেষ ~{{time}}',
    fromPrice: '{{price}} থেকে',
    seatsLeft_one: '{{count, number}}টি আসন বাকি',
    seatsLeft_other: '{{count, number}}টি আসন বাকি',
    startingNow: 'এখনই শুরু হচ্ছে',
    startsIn_one: '{{count, number}} মিনিট পরে শুরু',
    startsIn_other: '{{count, number}} মিনিট পরে শুরু',
    endsAboutSpoken: 'শেষ হবে প্রায় {{time}}',
    seatsAndPrice: '{{seats}}, {{price}} থেকে',
    bookLabel: '{{time}}, {{format}}, {{seats}} — বুক করুন',
  },

  trailer: {
    watch: 'ট্রেলার দেখুন',
    watchOfficial: 'অফিসিয়াল ট্রেলার দেখুন',
    watchFor: '{{movie}}-এর ট্রেলার দেখুন',
    playerTitle: '{{movie}} — অফিসিয়াল ট্রেলার',
    loading: 'প্লেয়ার আসছে…',
    watchOnYouTube: 'ইউটিউবে দেখুন',
    officialTrailerBy: 'অফিসিয়াল ট্রেলার · {{channel}}',
    officialTeaserBy: 'অফিসিয়াল টিজার · {{channel}}',
    notReleasedTitle: 'ট্রেলার এখনও আসেনি',
    notReleasedBody:
      'এই ছবির কোনো ট্রেলার বা টিজার স্টুডিও এখনও প্রকাশ করেনি। অনানুষ্ঠানিক কোনো আপলোডে পাঠানোর চেয়ে এখানে কিছু না রাখাই ভালো মনে হয়েছে।',
  },

  story: {
    heading: 'কাহিনি সংক্ষেপ',
    fullSynopsis: 'পূর্ণ কাহিনি',
    readMore: 'আরও পড়ুন',
    showLess: 'সংক্ষেপে দেখুন',
    viewDetails: 'বিস্তারিত দেখুন',
    selected: 'বেছে নেওয়া হয়েছে: {{title}}।',
  },

  maxPanel: {
    role: 'বুকিং সহায়ক · এই ডিভাইসেই চলে',
    you: 'আপনি',
    settings: 'ম্যাক্স ও সেটিংস সম্পর্কে',
    close: 'ম্যাক্স বন্ধ করুন',
    privacy:
      'সাইটের বাকি অংশ যে স্থানীয় নমুনা তথ্য ব্যবহার করে, ম্যাক্সও তা-ই পড়ে। আপনার কথোপকথন কেবল এই ব্রাউজার ট্যাবেই থাকে, কোথাও পাঠানো হয় না। এর সত্যিকারের হলের আসন-তথ্যে কোনো প্রবেশ নেই, কর্মীদের সঙ্গে যোগাযোগ করতে পারে না, এবং আপনার হয়ে কেনাকাটা শেষ করবে না।',
    rewordLabel: 'Ollama ({{model}}) দিয়ে উত্তর নতুন করে লেখান',
    ollamaOn:
      'এই মেশিনে একটি লোকাল Ollama ডেমন পাওয়া গেছে। এটি চালু থাকলে কেবল উত্তরের লেখাটুকু — আর কিছু নয় — নতুন করে লেখানোর জন্য তাতে পাঠানো হয়। দাম, শোটাইম, আসন ও কাজ সব সময় এখানেই হিসাব হয় এবং মডেল সেগুলো বদলায় না। কোনো ক্লাউড মডেল ট্যাগ দিলে আপনার লোকাল ডেমন লেখাটি Ollama-র সার্ভারে পাঠিয়ে দেয়।',
    ollamaOff:
      'কোনো লোকাল Ollama ডেমন পাওয়া যায়নি, তাই ম্যাক্স পুরোপুরি নিজের নির্দিষ্ট ইঞ্জিন থেকেই উত্তর দিচ্ছে। এটাই ডিফল্ট এবং এতে কিছু ইনস্টল করার দরকার নেই।',
    clearConversation: 'এই কথোপকথন মুছুন',
    conversation: 'ম্যাক্সের সঙ্গে কথোপকথন',
    conversationCleared: 'কথোপকথন মুছে ফেলা হয়েছে।',
    intro:
      'আমি শো খুঁজে দিতে পারি, তুলনা করতে পারি, বুকিংয়ে কত পড়বে তা বের করতে পারি আর আসন সাজেস্ট করতে পারি। বাংলায় বা ইংরেজিতে জিজ্ঞেস করুন।',
    introNote:
      'এখানকার সবই এই ডেমোর নমুনা তথ্য — সত্যিকারের আসন-তথ্য নেই, পেমেন্ট নেই, কোথাও কিছু পাঠানো হয় না।',
    thinking: 'বের করছি…',
    canUndo: 'এটি ফেরানো যাবে।',
    undone: 'ফেরানো হয়েছে।',
    suggestedQuestions: 'প্রস্তাবিত প্রশ্ন',
    askLabel: 'ম্যাক্সকে একটি প্রশ্ন করুন',
    placeholder: 'ছবি, সময়, আসন বা দাম নিয়ে জিজ্ঞেস করুন…',
    send: 'ম্যাক্সে পাঠান',
    composerHint:
      'পাঠাতে Enter, নতুন লাইনে Shift + Enter। ম্যাক্স কখনও পাসওয়ার্ড, কার্ড নম্বর, পিন বা ওটিপি চায় না।',
    rewordedNote:
      'আপনার লোকাল Ollama মডেল নতুন করে লিখেছে। হিসাব ও কাজ এই ডিভাইস থেকেই এসেছে।',
  },

  filters: {
    heading: 'ফিল্টার',
    search: 'খুঁজুন',
    searchPlaceholder: 'নাম, পরিচালক, অভিনয়শিল্পী…',
    genre: 'ধরন',
    language: 'ভাষা',
    format: 'ফরম্যাট',
    cinema: 'হল',
    certificate: 'সেন্সর সনদ',
    runningTime: 'দৈর্ঘ্য',
    accessibility: 'প্রবেশগম্যতা',
    accessibilityNote:
      'এটি শো ফিল্টার করে, ছবি নয়। ওপেন ক্যাপশন প্রিন্টেই থাকে; ক্লোজড ক্যাপশনের যন্ত্র বক্স অফিস থেকে নিতে হয়।',
    under: '{{duration}}-এর কম',
    after: '{{time}}-এর পরে',
    before: '{{time}}-এর আগে',
    underPrice: '{{price}}-এর কম',
    quotedQuery: '“{{query}}”',
    filteringBy: 'যা দিয়ে ছাঁকা হচ্ছে',
    removeFilter: 'ফিল্টার সরান',
    clearAll: 'সব মুছুন',
    showCount: '{{count, number}}টি দেখুন',
  },

  markers: {
    heading: 'শো-এর চিহ্ন',
  },

  movies: {
    eyebrow: 'প্রোগ্রাম',
    nowShowing: 'এখন চলছে',
    comingSoon: 'আসছে',
    ledeNowShowing:
      'এই সপ্তাহে পাঁচটি হলে যা যা চলছে। কোথায় যেতে পারবেন, কখন সময় আছে আর পর্দায় কী দরকার — সেই অনুযায়ী ছেঁকে নিন।',
    ledeComingSoon:
      'যেসব ছবি আমরা নিয়েছি কিন্তু এখনও চালু হয়নি। মুক্তির চার সপ্তাহ আগে আগাম বুকিং খোলে।',
    screeningOn: 'যেদিনের শো',
    showEveryDay: 'সব দিন দেখান',
    films_one: '<n></n>টি ছবি',
    films_other: '<n></n>টি ছবি',
    matchingFilters_one: '{{count, number}}টি ফিল্টারের সঙ্গে মিলছে',
    matchingFilters_other: '{{count, number}}টি ফিল্টারের সঙ্গে মিলছে',
    emptyTitle: 'এতগুলো শর্তে কিছুই মিলছে না',
    emptyBody:
      'আপনার দেওয়া সব ফিল্টারের সঙ্গে প্রোগ্রামের কোনো ছবি মিলছে না। সবচেয়ে সরু শর্তটি সরালে সাধারণত কাজ হয় — প্রবেশগম্যতা আর দৈর্ঘ্যের শর্ত তালিকা সবচেয়ে বেশি ছোট করে।',
    emptyAlternative: 'চাইলে <showtimes>শোটাইম ধরে দেখতে</showtimes> পারেন।',
    clearAllFilters: 'সব ফিল্টার মুছুন',
  },

  movieDetails: {
    breadcrumb: 'পথনির্দেশ',
    backToProgramme: '← প্রোগ্রাম',
    notYetRated: 'সনদ এখনও হয়নি',
    subtitles: '{{languages}} সাবটাইটেল',
    interval: '{{count, number}} মিনিটের বিরতি',
    chooseShowtime: 'শো বেছে নিন',
    opens: '{{date}} থেকে',
    share: 'শেয়ার',
    linkCopied: 'লিঙ্ক কপি হয়েছে',
    copyPrompt: 'এই লিঙ্কটি কপি করুন',
    shareTitle: '{{title}} — গ্র্যান্ডপ্লেক্স',
    restrictionNote:
      'আপনি যে টিকিটের ধরন বাছবেন, বুকিংয়ের সময় তা এর সঙ্গে মিলিয়ে দেখা হবে। এই সাইট কারও বয়স যাচাই করে না — সেটি হলের দরজায় হয়।',
    credits: {
      director: 'পরিচালক',
      cast: 'অভিনয়ে',
      released: 'মুক্তি',
      availableIn: 'যেভাবে দেখা যাবে',
      adultTicket: 'প্রাপ্তবয়স্কের টিকিট',
      plusBookingFee: '+ {{fee}} বুকিং ফি',
    },
    theFilm: 'ছবিটি',
    programmeNotes: 'প্রোগ্রাম নোট',
    trailer: 'ট্রেলার',
    noTrailerTitle: 'কোনো ট্রেলার নেই',
    noTrailerBody:
      'এই বিল্ডে {{title}}-এর ট্রেলার আমাদের কাছে নেই। অন্য ছবির কিছু দেখিয়ে দেওয়ার চেয়ে এখানে কিছু না রাখাই ভালো মনে হয়েছে। উপরের সারসংক্ষেপ ও প্রোগ্রাম নোটই আমাদের সবচেয়ে পূর্ণ বর্ণনা।',
    showtimes: 'শোটাইম',
    notOnSaleTitle: 'এখনও বিক্রি শুরু হয়নি',
    notOnSaleBody:
      '{{title}} মুক্তি পাবে {{date}}। মুক্তির চার সপ্তাহ আগে আগাম বুকিং খোলে, আর তখনই এই পাতায় সময় দেখা যাবে।',
    seeWhatIsOn: 'এখন কী চলছে দেখুন',
    allCinemas: 'সব হল',
    anyHouse: 'কোনো হলে',
    noScreeningsTitle: 'সেদিন কোনো শো নেই',
    noScreeningsBody:
      'আপনার বাছা তারিখে {{cinema}} {{title}}-এর কোনো শো নেই। অন্য দিন দেখুন, বা হলের ফিল্টার তুলে দিন।',
    showAllCinemas: 'সব হল দেখান',
    notRealListings: 'এগুলো গ্র্যান্ডপ্লেক্সের সত্যিকারের তালিকা নয় এবং এখানে কিছুই সত্যিকারের আসন-তথ্য দেখায় না।',
    pricingHeading: 'টিকিটে কত পড়ে',
    fullPrice: 'পুরো দাম',
    ageFrom: '{{from}}+',
    ageBetween: '{{from}}–{{to}}',
    feeNote:
      'প্রতি টিকিটে আরও {{fee}} বুকিং ফি, যা প্রতিটি মোটে দেখানো থাকে। বিকেল ৩টার আগের শোতে আসনপ্রতি {{discount}} কম পড়ে।',
    howPricingWorks: 'দাম কীভাবে ঠিক হয়',
    presentedIn: 'যেভাবে দেখানো হয়',
    stepOutHeading: 'একটু বাইরে যেতে হলে',
    hasInterval: 'এই ছবিতে {{count, number}} মিনিটের বিরতি রাখা আছে।',
    noInterval: 'এই ছবিটি বিরতি ছাড়াই চলে।',
    stepOutBody:
      'কম-অ্যাকশনের সময়গুলো ম্যাক্সের কাছে জেনে নিন — সেগুলো আনুমানিক, আর কোনো দৃশ্যের বর্ণনা দেওয়ার আগে সে আপনাকে সতর্ক করবে।',
    fromPrice: '{{price}} থেকে',
  },

  showtimes: {
    eyebrow: 'সময় বেছে নিন',
    title: 'শোটাইম',
    ledeAll: 'সব হলের প্রতিটি শো, দিন ধরে ধরে। পাঁচটি হলই দেখানো হচ্ছে।',
    ledeCinemas: 'সব হলের প্রতিটি শো, দিন ধরে ধরে। দেখানো হচ্ছে {{cinemas}}।',
    date: 'তারিখ',
    timeOfDayHeading: 'দিনের সময়',
    timeOfDay: {
      morning: 'সকাল',
      afternoon: 'দুপুর',
      evening: 'সন্ধ্যা',
      late: 'রাত',
    },
    screenings_one: '{{count, number}}টি শো',
    screenings_other: '{{count, number}}টি শো',
    films_one: '{{count, number}}টি ছবি',
    films_other: '{{count, number}}টি ছবি',
    // Bangla puts the scope before the count: "৫টি ছবি জুড়ে ২৩টি শো".
    summary: '{{films}} জুড়ে <strong>{{screenings}}</strong>',
    emptyTitle: 'এই বাছাইয়ে কোনো শো নেই',
    emptyBody:
      'এই তারিখে আপনার ফিল্টারের সঙ্গে কোনো শো মিলছে না। উপরের তালিকা থেকে অন্য দিন দেখুন, দিনের সময়ের বাছাই বাড়ান, অথবা <clear>ফিল্টারগুলো মুছে দিন</clear>।',
    demoNote:
      'নমুনা সময়সূচি ও আসনের হিসাব, আপনার ব্রাউজারেই তৈরি। এগুলো সত্যিকারের তালিকা নয় এবং কোনো সত্যিকারের আসন-তথ্য দেখা হচ্ছে না।',
  },

  domain: {
    genres: {
      // Bangla film listings use the English loanwords for most genres and a
      // Bangla word only where one is genuinely in use (প্রামাণ্যচিত্র,
      // ঐতিহাসিক). Coining a Bangla term nobody says would be worse.
      drama: 'ড্রামা',
      thriller: 'থ্রিলার',
      action: 'অ্যাকশন',
      comedy: 'কমেডি',
      romance: 'রোমান্স',
      sciFi: 'সায়েন্স ফিকশন',
      documentary: 'প্রামাণ্যচিত্র',
      animation: 'অ্যানিমেশন',
      family: 'পারিবারিক',
      horror: 'হরর',
      musical: 'মিউজিক্যাল',
      historical: 'ঐতিহাসিক',
    },
    languages: {
      bn: 'বাংলা',
      en: 'ইংরেজি',
      hi: 'হিন্দি',
    },
    formats: {
      standard: '২ডি',
      threeD: '৩ডি',
      grandscreen: 'গ্র্যান্ডস্ক্রিন',
      velvet: 'ভেলভেট রুম',
    },
    formatBlurbs: {
      standard: 'আমাদের সাধারণ প্রদর্শন: ২ডি, ডিজিটাল প্রজেকশন, ৫.১ সাউন্ড।',
      threeD: 'স্টেরিওস্কোপিক ৩ডি। দরজায় চশমা দেওয়া হয় এবং বেরোনোর সময় ফেরত নেওয়া হয়।',
      grandscreen: 'সার্কিটের সবচেয়ে বড় পর্দা, চওড়া ফ্রেম আর ১২-চ্যানেলের সাউন্ড।',
      velvet: 'হেলান-দেওয়া আসন, ছবির আগে টেবিলে পরিবেশন, আর আশির কম আসনের ছোট হল।',
    },
    certificates: {
      u: {
        // The codes themselves stay Latin: they are the regulator's, and they
        // are printed that way on every poster and trailer card.
        short: 'U',
        label: 'U — সবার জন্য',
        guidance: 'সব বয়সের দর্শকের জন্য উপযুক্ত।',
      },
      ua12: {
        short: 'U/A 12+',
        label: 'U/A ১২+',
        guidance: 'একই বুকিংয়ে সঙ্গে প্রাপ্তবয়স্কের টিকিট থাকলেই কেবল ১২ বছরের কমরা ঢুকতে পারবে।',
      },
      ua16: {
        short: 'U/A 16+',
        label: 'U/A ১৬+',
        guidance:
          'একই বুকিংয়ে সঙ্গে প্রাপ্তবয়স্কের টিকিট থাকলেই কেবল ১৬ বছরের কমরা ঢুকতে পারবে। এতে এমন দৃশ্য আছে যা কম বয়সীদের অস্বস্তিকর লাগতে পারে।',
      },
      a18: {
        short: 'A',
        label: 'A — ১৮ ও তার বেশি',
        guidance: '১৮ বছরের কম বয়সীদের প্রবেশ নিষেধ। এই ছবির জন্য শিশু টিকিট বিক্রি করা যায় না।',
      },
    },
    amenities: {
      parking: 'পার্কিং',
      cafe: 'ক্যাফে',
      lounge: 'লাউঞ্জ',
      atm: 'এটিএম',
      prayerRoom: 'নামাজঘর',
      babyChange: 'শিশুর কাপড় বদলানোর জায়গা',
      cloakroom: 'ক্লোকরুম',
      giftCard: 'গিফট কার্ড',
    },
    access: {
      stepFree: 'সিঁড়িহীন প্রবেশ',
      accessibleToilet: 'প্রবেশগম্য শৌচাগার',
      hearingLoop: 'হিয়ারিং লুপ',
      companionSeat: 'সঙ্গীর আসন',
      assistanceDogs: 'সহায়ক কুকুর সঙ্গে আনা যাবে',
      liftAccess: 'লিফট আছে',
      accessibleParking: 'প্রবেশগম্য পার্কিং',
    },
    accessDetail: {
      stepFree: 'রাস্তা থেকে সিঁড়ি ছাড়াই ঢোকা যায়',
      accessibleToilet: 'সিনেমার তলায় প্রবেশগম্য শৌচাগার',
      hearingLoop: 'প্রতিটি হলে ইনডাকশন লুপ',
      companionSeat: 'প্রতিটি হুইলচেয়ারের জায়গার পাশে সঙ্গীর আসন',
      assistanceDogs: 'সব জায়গায় সহায়ক কুকুর সঙ্গে আনা যাবে',
      liftAccess: 'সিনেমার তলা পর্যন্ত লিফট',
      accessibleParking: 'প্রবেশগম্য পার্কিংয়ের জায়গা',
    },
    accessibility: {
      openCaptions: {
        label: 'ওপেন ক্যাপশন',
        blurb: 'ক্যাপশন ছবিরই অংশ। হলের সবাই দেখতে পান; আলাদা কোনো যন্ত্র লাগে না।',
      },
      closedCaptions: {
        label: 'ক্লোজড ক্যাপশন',
        blurb: 'বক্স অফিস থেকে নেওয়া আলাদা যন্ত্রে ক্যাপশন। কেবল আপনিই দেখতে পাবেন।',
      },
      audioDescription: {
        label: 'অডিও বর্ণনা',
        blurb: 'বক্স অফিস থেকে নেওয়া হেডসেটে বর্ণনাসহ সাউন্ডট্র্যাক।',
      },
      wheelchairSpaces: {
        label: 'হুইলচেয়ারের জায়গা',
        blurb: 'হুইলচেয়ারের জায়গা, ঠিক পাশেই সঙ্গীর আসন।',
      },
      hearingLoop: {
        label: 'হিয়ারিং লুপ',
        blurb: 'পুরো হলজুড়ে ইনডাকশন লুপ, T-তে সেট করা হিয়ারিং এইডের জন্য।',
      },
      sensoryFriendly: {
        label: 'সংবেদন-বান্ধব',
        blurb: 'হলের আলো কিছুটা জ্বালানো, শব্দ কম, ট্রেলার নেই, চলাফেরায় ছাড়।',
      },
    },
  },

  formats: {
    runtime: {
      // ঘণ্টা / মিনিট, abbreviated the way a Bangla listing abbreviates them.
      hour: 'ঘ',
      minute: 'মি',
    },
  },

  metadata: {
    titleTemplate: '{{page}} — গ্র্যান্ডপ্লেক্স',
    booking: 'বুকিং',
    confirmation: 'আপনার টিকিট',
    notFound: 'পাতাটি পাওয়া যায়নি',
    siteName: 'গ্র্যান্ডপ্লেক্স',
    home: 'প্রোগ্রাম',
    description:
      'গ্র্যান্ডপ্লেক্স — প্রোগ্রাম দেখুন, শোটাইম তুলনা করুন এবং আসন বুক করুন। এটি একটি স্থানীয়, ফ্রন্টএন্ড-only ডেমো বিল্ড।',
  },
};
