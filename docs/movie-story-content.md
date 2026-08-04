# Movie story content

The short, spoiler-free story shown under a selected film. Two or three
sentences, 30–95 words, generated from nothing — each one written against the
film's verified public premise and checked for spoilers by hand.

## Why these exist separately from the synopsis

The synopsis is a paragraph for someone deciding what a film *is*. The short
story is for someone who has already half-chosen it and is about to pay. They
answer different questions at different moments, so one cannot be a truncation
of the other — `validate:content` and a unit test both reject a story that is
the synopsis reused, wrapped, or sliced.

## Spoiler rule

Premise and central conflict only. No third act, no twist, no ending. Where a
film's marketing has itself revealed something, the story still stops short of
it — the customer has not necessarily seen the marketing.

## Enforcement

| Check | Where |
| --- | --- |
| Both languages present | `validate:content`, unit test |
| Bangla actually in Bengali script | `validate:content`, unit test |
| 30–95 words | `validate:content`, unit test |
| Not the synopsis reused | `validate:content`, unit test |
| No marketing filler | unit test (`avoids empty marketing filler`) |

Rejected phrasings the filler test guards against: *"an unforgettable cinematic
journey"*, *"a must-watch experience"*, *"adventure awaits"*, *"nothing is what
it seems"*, *"like never before"*, *"edge of your seat"*.

## The catalogue


### The Odyssey

**English** (48 words)

> Ten years after the fall of Troy, Odysseus is still trying to reach Ithaca. The gods have other plans, the sea keeps taking his crew, and the kingdom he left behind has stopped waiting for him. Nolan shoots the oldest adventure story in the language on IMAX film.

**বাংলা**

> ট্রয়ের পতনের দশ বছর পরেও ওডিসিয়ুস ইথাকায় ফিরতে পারেননি। দেবতাদের পরিকল্পনা অন্যরকম, সমুদ্র একের পর এক সঙ্গীকে কেড়ে নিচ্ছে, আর যে রাজ্য তিনি ফেলে এসেছিলেন সেটি আর অপেক্ষা করছে না। ভাষার সবচেয়ে পুরনো অভিযানকাহিনি নোলান তুলেছেন আইম্যাক্স ফিল্মে।

*Source synopsis:* https://www.themoviedb.org/movie/1368337-the-odyssey
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Spider-Man: Brand New Day

**English** (52 words)

> Nobody remembers Peter Parker. With his old life erased and no one left to call on, he is rebuilding from a rented room in New York — new job, new neighbourhood, same city that needs Spider-Man. Then something arrives that he cannot fight alone, and asking for help means being known again.

**বাংলা**

> পিটার পার্কারকে আর কেউ মনে রাখে না। পুরনো জীবন মুছে গেছে, ডাক দেওয়ার মতো কেউ নেই — নিউ ইয়র্কের একটি ভাড়া ঘর থেকে সে আবার শুরু করছে। নতুন কাজ, নতুন পাড়া, কিন্তু শহরটার স্পাইডার-ম্যানকে দরকার আগের মতোই। তারপর এমন কিছু আসে যার সঙ্গে একা লড়া যায় না — আর সাহায্য চাইলেই তাকে আবার চেনা যাবে।

*Source synopsis:* https://www.themoviedb.org/movie/969681-spider-man-brand-new-day
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Toy Story 5

**English** (38 words)

> Woody, Buzz and Jessie face something no toy has beaten yet: a screen. Bonnie is given a tablet that talks back, and the toys find themselves competing for attention with a device that never runs out of ideas.

**বাংলা**

> উডি, বাজ আর জেসির সামনে এমন একটা প্রতিদ্বন্দ্বী, যাকে আজ পর্যন্ত কোনো খেলনা হারাতে পারেনি — একটা পর্দা। বনি যখন কথা বলা একটা ট্যাবলেট পায়, খেলনাগুলোকে মন জয়ের লড়াইয়ে নামতে হয় এমন এক যন্ত্রের সঙ্গে, যার আইডিয়া কখনও ফুরোয় না। একসঙ্গে থাকার চেয়েও কঠিন হয়ে দাঁড়ায় ভালোবাসা ধরে রাখা।

*Source synopsis:* https://www.themoviedb.org/movie/1084244-toy-story-5
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Project Hail Mary

**English** (55 words)

> Ryland Grace wakes on a spacecraft with no memory of boarding it and two dead crewmates for company. As his past comes back in pieces, so does the reason he is out here: the sun is dimming, Earth has one attempt at a fix, and he is it. Then he finds he is not alone.

**বাংলা**

> রাইল্যান্ড গ্রেস একটি মহাকাশযানে জেগে ওঠে — কীভাবে উঠেছিল মনে নেই, সঙ্গী বলতে দুজন মৃত সহযাত্রী। স্মৃতি টুকরো টুকরো করে ফিরে আসার সঙ্গে সঙ্গে ফিরে আসে কারণটাও: সূর্য নিভে আসছে, পৃথিবীর হাতে একটাই চেষ্টা, আর সেই চেষ্টাটা সে নিজেই। তারপর সে টের পায়, সে একা নয়।

*Source synopsis:* https://www.themoviedb.org/movie/687163-project-hail-mary
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Supergirl

**English** (51 words)

> Kara Zor-El remembers Krypton dying — she was old enough to watch it happen. Drifting between worlds with little use for Earth, she is pulled into a revenge mission by a girl with nothing left to lose. What follows is less a rescue than a long, hard journey across the galaxy.

**বাংলা**

> কারা জোর-এল ক্রিপ্টনের ধ্বংস দেখেছিল — সেটা মনে রাখার মতো বয়স তার হয়েছিল। পৃথিবীর প্রতি বিশেষ টান নেই, নানা গ্রহে ঘুরে বেড়ায় সে; তারপর সব হারানো এক মেয়ের প্রতিশোধের অভিযানে তাকে জড়িয়ে পড়তে হয়। যা ঘটে তা উদ্ধারকাজের চেয়ে বেশি — ছায়াপথজুড়ে এক দীর্ঘ, কঠিন যাত্রা।

*Source synopsis:* https://www.themoviedb.org/movie/1081003-supergirl
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Backrooms

**English** (49 words)

> A boy falls out of the world in 1996 and lands somewhere that should not exist: an office corridor with no end, buzzing lights and damp carpet, repeating forever. Years of found footage suggest others have fallen through too, and that whatever is down there has learned to wait.

**বাংলা**

> ১৯৯৬ সালে এক কিশোর পৃথিবী থেকে ছিটকে গিয়ে পড়ে এমন এক জায়গায়, যার থাকারই কথা নয় — শেষহীন অফিস করিডোর, ভনভন করা আলো আর স্যাঁতসেঁতে কার্পেট, অনন্তকাল ধরে একই রকম। বছরের পর বছরের ফুটেজ বলে, আরও অনেকে এভাবেই হারিয়ে গেছে — আর নিচে যা-ই থাকুক, সে অপেক্ষা করতে শিখে গেছে।

*Source synopsis:* https://www.themoviedb.org/movie/1083381-backrooms
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Moana

**English** (45 words)

> Motunui is failing: the fish are gone and the coconuts are spoiling. Moana, who has been told her whole life not to cross the reef, takes a boat past it anyway to find the demigod who caused it. Maui is not especially interested in helping.

**বাংলা**

> মোতুনুই ভালো নেই — মাছ উধাও, নারকেল নষ্ট হয়ে যাচ্ছে। সারা জীবন যাকে বলা হয়েছে প্রবাল-প্রাচীর পেরোতে নেই, সেই মোয়ানা নৌকা নিয়ে ঠিকই পেরিয়ে যায়, খুঁজতে যায় সেই দেবতুল্যকে, যার জন্য এই দশা। মাউয়ির অবশ্য সাহায্য করায় বিশেষ আগ্রহ নেই।

*Source synopsis:* https://www.themoviedb.org/movie/1108427-moana
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Masters of the Universe

**English** (50 words)

> Adam was sent away from Eternia as a baby and raised on Earth knowing none of it. When the sword that belongs to him finally arrives, so does Skeletor\'s army — and a throne he never asked for. Becoming He-Man is the easy part; being worth the title is not.

**বাংলা**

> শিশু বয়সেই অ্যাডামকে ইটার্নিয়া থেকে সরিয়ে দেওয়া হয়েছিল; পৃথিবীতে সে বড় হয়েছে কিছুই না জেনে। যে তরবারি তার, সেটি যখন অবশেষে পৌঁছয়, সঙ্গে পৌঁছয় স্কেলেটরের বাহিনী — আর এমন এক সিংহাসন, যা সে কখনও চায়নি। হি-ম্যান হওয়াটা সহজ; নামের যোগ্য হয়ে ওঠাটা নয়।

*Source synopsis:* https://www.themoviedb.org/movie/454639-masters-of-the-universe
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Avengers: Doomsday

**English** (51 words)

> Heroes from three separate universes are pulled onto the same collision course by a threat none of them can meet alone. Victor Von Doom is not hiding, not bargaining and not obviously wrong — and the teams sent to stop him have never worked together, or in some cases even met.

**বাংলা**

> তিনটি আলাদা মহাবিশ্বের নায়কদের এক সংঘর্ষের পথে টেনে আনে এমন এক বিপদ, যার সামনে কেউ একা দাঁড়াতে পারে না। ভিক্টর ভন ডুম লুকোচ্ছে না, দরকষাকষিও করছে না, আর তাকে স্পষ্ট ভুলও বলা যাচ্ছে না — অথচ তাকে থামাতে পাঠানো দলগুলো কখনও একসঙ্গে কাজ করেনি, কেউ কেউ তো একে অন্যকে চেনেই না।

*Source synopsis:* https://www.themoviedb.org/movie/1003596-avengers-doomsday
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Dune: Part Three

**English** (47 words)

> Paul Atreides got everything he set out for: the throne, the desert, the faithful. Twelve years on, the holy war carried out in his name has crossed the known universe, and the people closest to him are quietly deciding what to do about the emperor they made.

**বাংলা**

> পল আত্রেইদিস যা যা চেয়েছিল, সবই পেয়েছে — সিংহাসন, মরুভূমি, অনুগত মানুষ। বারো বছর পরে তার নামে চালানো পবিত্র যুদ্ধ ছড়িয়ে পড়েছে গোটা পরিচিত মহাবিশ্বে, আর তার সবচেয়ে কাছের মানুষগুলো চুপচাপ ঠিক করছে — নিজেদের বানানো এই সম্রাটকে নিয়ে এখন কী করা যায়।

*Source synopsis:* https://www.themoviedb.org/movie/1170608-dune-part-three
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### The Hunger Games: Sunrise on the Reaping

**English** (44 words)

> Twenty-four years before Katniss, the Capitol marks the fiftieth Games by doubling the tributes. Sixteen-year-old Haymitch Abernathy is reaped from District Twelve into an arena built for forty-eight children, and works out early that surviving it and beating it are not the same thing.

**বাংলা**

> ক্যাটনিসের চব্বিশ বছর আগে, পঞ্চাশতম গেমস উপলক্ষে ক্যাপিটল দ্বিগুণ প্রতিযোগী তুলে নেয়। বারো নম্বর ডিস্ট্রিক্ট থেকে ষোলো বছরের হেইমিচ অ্যাবারনাথিকে পাঠানো হয় আটচল্লিশটি কিশোর-কিশোরীর জন্য বানানো এক আখড়ায় — আর সে খুব তাড়াতাড়ি বুঝে যায়, বেঁচে ফেরা আর জিতে ফেরা এক জিনিস নয়।

*Source synopsis:* https://www.themoviedb.org/movie/1300968-the-hunger-games-sunrise-on-the-reaping
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Jumanji: Open World

**English** (46 words)

> The game is back, and it has stopped waiting to be played. Where Jumanji once pulled people in, this version has learned to spill out — and the avatars who survived it before are the only ones who understand the rules well enough to be frightened.

**বাংলা**

> খেলাটা ফিরে এসেছে, আর এবার সে খেলার অপেক্ষায় বসে নেই। জুমানজি আগে মানুষকে ভেতরে টেনে নিত; এবারের সংস্করণ বাইরে বেরিয়ে আসতে শিখেছে — আর আগে যারা বেঁচে ফিরেছিল, নিয়মগুলো এতটা ভালো জানে বলেই কেবল তারাই ভয় পাচ্ছে।

*Source synopsis:* https://www.themoviedb.org/movie/1260649-jumanji-open-world
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Clayface

**English** (49 words)

> A failing actor takes a treatment that promises him any face he wants. It works — and then it keeps working, past the point where he can stop it or find his own face underneath. A body-horror picture set at the edges of Gotham rather than in its skyline.

**বাংলা**

> কেরিয়ার-ডোবা এক অভিনেতা এমন এক চিকিৎসা নেয়, যা তাকে যেকোনো চেহারা এনে দেবে বলে কথা দেয়। কাজ হয় — এবং হতেই থাকে, এমন জায়গা পেরিয়ে যায় যেখান থেকে সে আর থামাতে পারে না, নিজের চেহারাটাও খুঁজে পায় না। গথামের আকাশরেখা নয়, এই বডি-হরর ছবিটি শহরের প্রান্তের গল্প।

*Source synopsis:* https://www.themoviedb.org/movie/1400940-clayface
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.


### Klara and the Sun

**English** (52 words)

> Klara is an Artificial Friend, built to be bought and watching the street through a shop window until she is. Chosen by a girl who is often ill, she learns a household from the outside in — and forms her own quiet theory about what is wrong and what might fix it.

**বাংলা**

> ক্লারা একজন আর্টিফিশিয়াল ফ্রেন্ড — বিক্রি হওয়ার জন্য তৈরি, আর সেই অপেক্ষায় দোকানের কাচ দিয়ে রাস্তা দেখে। প্রায়ই অসুস্থ থাকে এমন এক কিশোরী তাকে বেছে নেয়, আর বাইরে থেকে ভেতরে ঢুকে ক্লারা একটি পরিবারকে চিনতে শেখে — নিজের মতো করে একটা নিঃশব্দ ধারণাও তৈরি করে ফেলে, কী গোলমাল হয়েছে আর কীসে তা সারতে পারে।

*Source synopsis:* https://www.themoviedb.org/movie/858035-klara-and-the-sun
*Verified:* 2026-08-03 · *Spoiler review:* passed — premise and central conflict only.
