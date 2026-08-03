# Bangla glossary

The terms `src/i18n/resources/bn.ts` commits to, and why. The point of writing
them down is consistency: the same English word should not become three
different Bangla words on three different pages.

## The governing rule

**Write what a Dhaka box office writes.** Where an English loanword is what
people actually say — টিকিট, বুকিং, শোটাইম, ক্যাপশন — the loanword is used. A
purer Bangla coinage that nobody says would be a translation of the dictionary,
not of the language, and would make the interface harder to use, not easier.

Where a good Bangla word is in everyday use — প্রামাণ্যচিত্র, প্রবেশগম্যতা,
নামাজঘর — that word is used.

## Core vocabulary

| English | Bangla | Note |
| --- | --- | --- |
| ticket | টিকিট | Loanword. Universal. |
| booking | বুকিং | Loanword. "সংরক্ষণ" reads like a library. |
| showtime | শোটাইম | Loanword, and the name of the page. |
| screening / show | শো | |
| cinema (the building) | হল | Not "সিনেমা", which means the film. |
| screen (the auditorium) | পর্দা | |
| seat | আসন | |
| row | সারি | |
| film | ছবি | Not "চলচ্চিত্র", which is formal register. |
| programme | প্রোগ্রাম | Loanword; it is the section's name. |
| offer | অফার | Loanword. |
| counter (concessions) | কাউন্টার | Loanword. |
| accessibility | প্রবেশগম্যতা | |
| certificate (censor) | সেন্সর সনদ | |
| booking fee | বুকিং ফি | |
| add-on | অ্যাড-অন | Loanword; used at the counter. |
| demonstration / demo | ডেমো | Loanword. |

## Deliberately **not** translated

These stay in Latin script in both languages, because they are matched against
something physical or typed rather than read as prose:

- **Booking references** — read down a phone line and printed on the ticket.
- **Seat identifiers** (`F12`) — stencilled on the seat back in a dark room.
- **Certificate codes** (`U`, `U/A 12+`) — the regulator's, printed that way on
  every poster. The *guidance text* beside them is translated.
- **Telephone numbers, email addresses, URLs, QR payloads.**
- **Film titles, cinema names, screen names** — proper nouns.

`Formatters.identifier()` exists so a call site can say it means this, rather
than a conversion being quietly omitted and later "fixed" by someone tidying up.

## Numerals

Bangla renders numbers in Bengali digits (১২৩) and groups money in **lakh**,
not thousands: ১,১৫,০০০ — never ১১৫,০০০. Both come free from
`Intl.NumberFormat('bn-BD')`; see `src/i18n/formatters.ts`.

## Time of day

Bangla names the part of the day **before** the clock reading — "রাত ৮:৪৫",
literally *night 8:45* — where English puts a marker after it. CLDR's `bn`
day-period strings are the formal পূর্বাহ্ন/অপরাহ্ন pair, which nobody says when
arranging to meet at the cinema, so the everyday six-band set is used:

| Hours | Bangla |
| --- | --- |
| 00:00–03:59 | রাত |
| 04:00–05:59 | ভোর |
| 06:00–11:59 | সকাল |
| 12:00–14:59 | দুপুর |
| 15:00–17:59 | বিকাল |
| 18:00–19:59 | সন্ধ্যা |
| 20:00–23:59 | রাত |

## Plurals

Bangla does not inflect nouns for number: "১টি আসন" and "৫টি আসন" share the
same noun. The `_one` and `_other` forms in `bn.ts` are therefore usually
identical — but **both are still present**, because i18next selects on the
plural rule and a missing `_other` falls through to the raw key.

## Genres

Film listings in Bangladesh use the English loanword for most genres. A Bangla
term is used only where one is genuinely in circulation:

ড্রামা · থ্রিলার · অ্যাকশন · কমেডি · রোমান্স · সায়েন্স ফিকশন ·
**প্রামাণ্যচিত্র** · অ্যানিমেশন · **পারিবারিক** · হরর · মিউজিক্যাল ·
**ঐতিহাসিক**

## What enforces this

`npm run check:i18n` fails on a Bangla value that is byte-identical to the
English, or that contains no Bengali characters at all — with a per-entry
allowlist that requires a stated reason. That catches the most common way a
glossary rots: a string copied across during a rush and never revisited.
