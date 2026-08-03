import type { FaqEntry, InsurancePolicy } from './types';

/**
 * The local knowledge base Max answers policy questions from.
 *
 * If a question does not match anything here, Max must say it has no verified
 * information rather than inventing an answer. See `src/max/skills/policy.ts`.
 */

export const COMPANY = {
  name: 'GrandPlex',
  nameBn: 'নকশী সিনেমাস',
  foundedYear: 2009,
  supportEmail: 'hello@grandplexcinemas.example',
  supportPhone: '+880 9600 665 700',
  supportHours: 'Daily, 09:00 – 22:00',
  pressEmail: 'press@grandplexcinemas.example',
  accessibilityEmail: 'access@grandplexcinemas.example',
  registeredOffice: ['GrandPlex Ltd.', 'Level 6, Shatabdi Centre', 'Road 27, Dhanmondi, Dhaka 1209'],
} as const;

export const insurancePolicy: InsurancePolicy = {
  id: 'ins-standard',
  name: 'Ticket Cover',
  fee: 40,
  coverageSummary:
    'A sample refund product covering the ticket value if you cannot attend for one of the listed reasons. Cover is per booking, not per ticket.',
  coveredReasons: [
    {
      id: 'illness',
      label: 'Illness or injury',
      note: 'You or someone travelling with you on the booking is unwell on the day.',
    },
    {
      id: 'transport',
      label: 'Transport failure',
      note: 'A cancelled or significantly delayed service on your route to the venue.',
    },
    {
      id: 'bereavement',
      label: 'Bereavement',
      note: 'A death in the immediate family within seven days of the screening.',
    },
    {
      id: 'work',
      label: 'Emergency work commitment',
      note: 'An unplanned shift or callout that cannot be rescheduled.',
    },
    {
      id: 'weather',
      label: 'Severe weather',
      note: 'A local weather warning affecting travel on the day of the screening.',
    },
  ],
  exclusions: [
    'Changing your mind, or no longer wanting to see the film.',
    'Arriving after the film has started.',
    'Bookings where the screening has already taken place more than 14 days ago.',
    'Concessions and add-ons — cover applies to the ticket value only.',
  ],
  claimWindowDays: 14,
  contactEmail: 'ticketcover@grandplexcinemas.example',
  contactPhone: '+880 9600 665 712',
};

export const faq: FaqEntry[] = [
  {
    id: 'faq-guest',
    topic: 'tickets',
    question: 'Do I need an account to book?',
    questionBn: 'বুক করতে কি অ্যাকাউন্ট লাগবে?',
    answer:
      'No. Every booking on this site is a guest booking. There is no sign-up, no login and no password anywhere in the flow.',
    answerBn:
      'না। এই সাইটের প্রতিটি বুকিং গেস্ট বুকিং। এখানে কোনো সাইন-আপ, লগইন বা পাসওয়ার্ড নেই।',
    keywords: ['account', 'login', 'sign up', 'register', 'guest', 'password'],
  },
  {
    id: 'faq-price',
    topic: 'pricing',
    question: 'How is a ticket price worked out?',
    questionBn: 'টিকিটের দাম কীভাবে হিসাব হয়?',
    answer:
      'A seat starts at its class price — ৳350 regular, ৳450 premium, ৳650 recliner. The format is added on top: ৳100 for 3D, ৳150 for Grandscreen, ৳250 for the Velvet Room. Screenings before 15:00 take ৳60 off, and Friday and Saturday add ৳50. Your age category is applied last: child 0.7×, student 0.85×, senior 0.75×. A ৳20 booking fee is added per ticket and is shown in every total.',
    answerBn:
      'সিট ক্লাস অনুযায়ী দাম শুরু হয় — রেগুলার ৳৩৫০, প্রিমিয়াম ৳৪৫০, রিক্লাইনার ৳৬৫০। এরপর ফরম্যাট যোগ হয়: 3D ৳১০০, গ্র্যান্ডস্ক্রিন ৳১৫০, ভেলভেট রুম ৳২৫০। বিকেল ৩টার আগের শোতে ৳৬০ ছাড়, শুক্র ও শনিবার ৳৫০ বেশি। সবশেষে বয়স অনুযায়ী ছাড়: শিশু ০.৭×, শিক্ষার্থী ০.৮৫×, প্রবীণ ০.৭৫×। প্রতি টিকিটে ৳২০ বুকিং ফি যোগ হয়, যা সব হিসাবে দেখানো হয়।',
    keywords: ['price', 'cost', 'how much', 'fee', 'charge', 'discount', 'taka', 'দাম', 'মূল্য'],
  },
  {
    id: 'faq-fees',
    topic: 'pricing',
    question: 'Are there any hidden fees?',
    questionBn: 'কোনো লুকানো ফি আছে কি?',
    answer:
      'No. There is one fee — ৳20 per ticket for booking online — and it appears on the ticket step, in every running total and on the review page. Nothing else is added at the end.',
    answerBn:
      'না। শুধু একটি ফি আছে — অনলাইনে বুকিংয়ের জন্য প্রতি টিকিটে ৳২০ — এবং এটি টিকিট ধাপে, প্রতিটি মোট হিসাবে এবং রিভিউ পাতায় দেখানো হয়। শেষে আর কিছু যোগ হয় না।',
    keywords: ['hidden', 'fee', 'extra', 'surcharge', 'booking fee', 'convenience'],
  },
  {
    id: 'faq-arrival',
    topic: 'arrival',
    question: 'When should I arrive?',
    questionBn: 'কখন পৌঁছানো উচিত?',
    answer:
      'Aim to be at the door 20 minutes before the printed start time. Trailers run for 10 to 15 minutes depending on the house, so the feature itself begins after that — but seating, tickets and the concessions queue all happen before it.',
    answerBn:
      'নির্ধারিত সময়ের ২০ মিনিট আগে দরজায় পৌঁছানোর চেষ্টা করুন। হাউস ভেদে ১০–১৫ মিনিট ট্রেলার চলে, তাই মূল ছবি এরপর শুরু হয় — কিন্তু আসন, টিকিট ও খাবারের লাইন তার আগেই সারতে হয়।',
    keywords: ['arrive', 'early', 'when', 'trailers', 'adverts', 'start', 'কখন'],
  },
  {
    id: 'faq-late',
    topic: 'arrival',
    question: 'What happens if I arrive late?',
    questionBn: 'দেরিতে পৌঁছালে কী হবে?',
    answer:
      'You will still be seated. Each house handles it differently — the larger rooms hold latecomers until a scene change, the smaller ones seat you from the rear aisle at any point. Late arrival is not a refundable reason. Each cinema page carries its own policy.',
    answerBn:
      'আপনি আসন পাবেন। প্রতিটি হাউসে নিয়ম আলাদা — বড় হলগুলোতে দৃশ্য পরিবর্তনের আগ পর্যন্ত অপেক্ষা করানো হয়, ছোট হলে পেছনের পথ দিয়ে যেকোনো সময় বসানো হয়। দেরিতে আসা ফেরতযোগ্য কারণ নয়। প্রতিটি সিনেমার পাতায় নিজস্ব নীতি আছে।',
    keywords: ['late', 'miss', 'delayed', 'missed the start', 'দেরি'],
  },
  {
    id: 'faq-refund',
    topic: 'refunds',
    question: 'Can I refund or exchange a ticket?',
    questionBn: 'টিকিট ফেরত বা বদল করা যাবে?',
    answer:
      'In this demonstration build, no refund or exchange is actually processed — there is no payment and no backend. The sample policy the interface describes is: exchanges up to three hours before the screening, refunds only where Ticket Cover was added to the booking.',
    answerBn:
      'এই ডেমো সংস্করণে কোনো ফেরত বা বদল প্রকৃতপক্ষে প্রক্রিয়া করা হয় না — এখানে পেমেন্ট বা ব্যাকএন্ড নেই। ইন্টারফেসে বর্ণিত নমুনা নীতি: শোয়ের তিন ঘণ্টা আগে পর্যন্ত বদল, এবং শুধু টিকিট কভার নেওয়া থাকলে ফেরত।',
    keywords: ['refund', 'exchange', 'cancel', 'change', 'money back', 'ফেরত'],
  },
  {
    id: 'faq-outside-food',
    topic: 'food',
    question: 'Can I bring my own food?',
    questionBn: 'বাইরের খাবার আনা যাবে?',
    answer:
      'Outside food and drink are not permitted in the houses. Baby food, and food required for a medical reason, are always allowed — tell the door staff and they will wave you through.',
    answerBn:
      'বাইরের খাবার ও পানীয় হলে আনা যাবে না। শিশুখাদ্য এবং চিকিৎসাজনিত কারণে প্রয়োজনীয় খাবার সবসময় অনুমোদিত — দরজার কর্মীকে জানালেই হবে।',
    keywords: ['outside food', 'bring food', 'own food', 'snacks', 'water', 'খাবার'],
  },
  {
    id: 'faq-captions',
    topic: 'access',
    question: 'What is the difference between open and closed captions?',
    questionBn: 'ওপেন ও ক্লোজড ক্যাপশনের পার্থক্য কী?',
    answer:
      'Open captions are burned into the picture. Everyone in the house sees them, and you do not need any equipment. Closed captions are delivered to a personal device you collect from the box office, so only you see them. They are not interchangeable — if you need captions guaranteed on screen, book an open-caption screening.',
    answerBn:
      'ওপেন ক্যাপশন ছবির সঙ্গে স্থায়ীভাবে যুক্ত থাকে। হলের সবাই দেখতে পান, কোনো যন্ত্র লাগে না। ক্লোজড ক্যাপশন বক্স অফিস থেকে নেওয়া ব্যক্তিগত ডিভাইসে আসে, শুধু আপনি দেখেন। এই দুটি এক নয় — পর্দায় নিশ্চিত ক্যাপশন প্রয়োজন হলে ওপেন-ক্যাপশন শো বুক করুন।',
    keywords: ['captions', 'subtitles', 'open caption', 'closed caption', 'cc', 'deaf', 'ক্যাপশন'],
  },
  {
    id: 'faq-wheelchair',
    topic: 'access',
    question: 'How do I book a wheelchair space?',
    questionBn: 'হুইলচেয়ারের জায়গা কীভাবে বুক করব?',
    answer:
      'Wheelchair spaces appear on the seat map with their own marker and are charged at the regular seat rate whatever part of the house they sit in. Each space has companion seats immediately beside it. Filter the showtimes page by wheelchair access to see only screenings in houses that have them.',
    answerBn:
      'সিট ম্যাপে হুইলচেয়ারের জায়গা আলাদা চিহ্ন দিয়ে দেখানো হয় এবং হলের যেখানেই থাকুক, রেগুলার সিটের দামেই দেওয়া হয়। প্রতিটি জায়গার পাশেই সঙ্গীর আসন আছে। শোটাইম পাতায় হুইলচেয়ার ফিল্টার দিলে শুধু সেই শোগুলো দেখাবে।',
    keywords: ['wheelchair', 'accessible', 'companion', 'disabled', 'access', 'হুইলচেয়ার'],
  },
  {
    id: 'faq-age',
    topic: 'tickets',
    question: 'How do age categories work?',
    questionBn: 'বয়সের শ্রেণি কীভাবে কাজ করে?',
    answer:
      'You pick a category — child, student, adult or senior — and that sets the price. We never ask for a date of birth. Where a film carries an age restriction, the booking flow checks the categories in your basket against it and explains which one triggered the warning. This site does not verify anyone\'s age; the door does.',
    answerBn:
      'আপনি একটি শ্রেণি বেছে নেন — শিশু, শিক্ষার্থী, প্রাপ্তবয়স্ক বা প্রবীণ — তাতেই দাম ঠিক হয়। আমরা কখনো জন্মতারিখ চাই না। ছবিতে বয়সসীমা থাকলে বুকিং ধাপ আপনার নির্বাচিত শ্রেণিগুলো যাচাই করে জানায় কোনটি সতর্কবার্তার কারণ। এই সাইট কারও বয়স যাচাই করে না; সেটি দরজায় হয়।',
    keywords: ['age', 'child', 'senior', 'student', 'rating', 'certificate', 'restriction', 'বয়স'],
  },
  {
    id: 'faq-parking',
    topic: 'venue',
    question: 'Is there parking?',
    questionBn: 'পার্কিং আছে কি?',
    answer:
      'It varies by house, and one has none at all. Dhanmondi, Bashundhara and Agrabad have their own car parks with accessible bays; Uttara shares the arcade\'s; Zindabazar has no cinema parking. Each cinema page states its own arrangement.',
    answerBn:
      'হাউস ভেদে আলাদা, একটিতে কোনো পার্কিং নেই। ধানমন্ডি, বসুন্ধরা ও আগ্রাবাদে নিজস্ব পার্কিং ও অ্যাক্সেসিবল বে আছে; উত্তরায় আর্কেডের সঙ্গে ভাগাভাগি; জিন্দাবাজারে সিনেমার পার্কিং নেই। প্রতিটি সিনেমার পাতায় বিস্তারিত আছে।',
    keywords: ['parking', 'car', 'park', 'garage', 'পার্কিং'],
  },
  {
    id: 'faq-lost',
    topic: 'lost-found',
    question: 'I left something in the cinema.',
    questionBn: 'সিনেমায় কিছু ফেলে এসেছি।',
    answer:
      'Each house keeps found items for between 14 and 30 days and has its own lost property contact. Max can put a report together for you — with the booking, seat and screening details already filled in — but you have to send it yourself by email or phone, because this build has no backend to submit it to.',
    answerBn:
      'প্রতিটি হাউস ১৪ থেকে ৩০ দিন পর্যন্ত প্রাপ্ত জিনিস রাখে এবং আলাদা যোগাযোগ ঠিকানা আছে। ম্যাক্স আপনার জন্য রিপোর্ট তৈরি করে দিতে পারে — বুকিং, আসন ও শোয়ের তথ্যসহ — তবে পাঠাতে হবে আপনাকেই, ইমেইল বা ফোনে, কারণ এই সংস্করণে কোনো ব্যাকএন্ড নেই।',
    keywords: ['lost', 'left', 'found', 'forgot', 'missing', 'property', 'হারানো'],
  },
  {
    id: 'faq-demo',
    topic: 'demo',
    question: 'Is this a real cinema site?',
    questionBn: 'এটি কি আসল সিনেমার সাইট?',
    answer:
      'No. GrandPlex is a demonstration build. The films, venues, schedules, seat availability, prices, offers and policies are all sample data authored for this project. No payment is taken, nothing is sent anywhere, and every booking is stored only in this browser.',
    answerBn:
      'না। নকশী সিনেমাস একটি ডেমো সংস্করণ। এখানকার ছবি, হল, সময়সূচি, আসন, দাম, অফার ও নীতিমালা সবই এই প্রকল্পের জন্য তৈরি নমুনা তথ্য। কোনো পেমেন্ট নেওয়া হয় না, কিছু কোথাও পাঠানো হয় না, এবং প্রতিটি বুকিং শুধু এই ব্রাউজারেই সংরক্ষিত থাকে।',
    keywords: ['real', 'demo', 'fake', 'sample', 'actual', 'genuine', 'ডেমো'],
  },
  {
    id: 'faq-print',
    topic: 'tickets',
    question: 'How do I print or save my ticket?',
    questionBn: 'টিকিট কীভাবে প্রিন্ট বা সেভ করব?',
    answer:
      'The confirmation page has a Print button that opens your browser\'s print dialogue — from there you can print on paper or save a PDF. There is also an Add to calendar button that generates an .ics file in the browser.',
    answerBn:
      'কনফার্মেশন পাতায় প্রিন্ট বোতাম আছে যা ব্রাউজারের প্রিন্ট ডায়ালগ খোলে — সেখান থেকে কাগজে প্রিন্ট বা PDF সেভ করতে পারেন। ক্যালেন্ডারে যোগ করার বোতামও আছে, যা ব্রাউজারেই .ics ফাইল তৈরি করে।',
    keywords: ['print', 'save', 'pdf', 'calendar', 'ics', 'download', 'প্রিন্ট'],
  },
  {
    id: 'faq-data',
    topic: 'demo',
    question: 'Where is my booking stored?',
    questionBn: 'আমার বুকিং কোথায় সংরক্ষিত হয়?',
    answer:
      'In this browser\'s local storage, and nowhere else. Clear your browser data and it is gone. It is not on a server, it will not appear on another device, and nobody else can see it.',
    answerBn:
      'শুধু এই ব্রাউজারের লোকাল স্টোরেজে, আর কোথাও নয়। ব্রাউজারের ডেটা মুছলে এটি চলে যাবে। এটি কোনো সার্ভারে নেই, অন্য ডিভাইসে দেখা যাবে না, এবং অন্য কেউ দেখতে পাবে না।',
    keywords: ['stored', 'storage', 'data', 'privacy', 'saved', 'where', 'ডেটা'],
  },
];

export const faqById = new Map(faq.map((f) => [f.id, f]));

/** Refund and exchange sample policy, quoted verbatim by Max and /ticket-prices. */
export const refundPolicy = {
  exchangeWindowHours: 3,
  summary:
    'Sample policy: tickets may be exchanged for another screening up to three hours before the start time. Refunds are available only where Ticket Cover was added to the booking, and only for the listed reasons.',
  demoNote:
    'Nothing is actually processed in this build — there is no payment and no backend. This text describes what the policy would say.',
} as const;
