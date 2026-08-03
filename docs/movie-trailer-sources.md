# Movie trailer sources

Every trailer in the catalogue, with the channel that actually published it.

## How these were verified

A YouTube search for `"<film> official trailer"` returns a great many videos
whose **titles** name a studio and whose **uploader** does not. Titles are
written by whoever uploads the video, so a title reading
*"Spider-Man: Brand New Day (2026) | OFFICIAL TRAILER 2 | Sony Pictures
Entertainment"* proves nothing — that one was uploaded by a channel called
**The Film Scene**.

`scripts/verify-trailers.mjs` therefore ignores titles entirely and reads
`author_name` from YouTube's public oEmbed endpoint, checking it against an
explicit list of studio, official-franchise and official-regional-distributor
channels. No API key, no quota, no account.

```
npm run verify:trailers            # re-check the committed catalogue
node scripts/verify-trailers.mjs ID   # check a candidate before committing it
```

Last full run: **2026-08-03 — 14/14 verified.**

## The catalogue

| Film | Type | Channel | Video ID | Verified |
| --- | --- | --- | --- | --- |
| The Odyssey | Official trailer | Universal Pictures | `Mzw2ttJD2qQ` | 2026-08-03 |
| Spider-Man: Brand New Day | Official trailer | Spider-Man (`@spiderman`) | `8TZMtslA3UY` | 2026-08-03 |
| Toy Story 5 | Official trailer | Pixar | `c51ND9Hdbw0` | 2026-08-03 |
| Project Hail Mary | Official trailer | Amazon MGM Studios | `m08TxIsFTRI` | 2026-08-03 |
| Supergirl | Official **teaser** | DC | `YqdAEdkHrwo` | 2026-08-03 |
| Backrooms | Official trailer | A24 | `0HjdiohVOik` | 2026-08-03 |
| Moana | Official trailer | Disney | `EEz5xbzYPKI` | 2026-08-03 |
| Masters of the Universe | Official trailer | Amazon MGM Studios | `X21JsHLHnY8` | 2026-08-03 |
| Avengers: Doomsday | Official trailer | Marvel Entertainment | `irVNGjRFZGk` | 2026-08-03 |
| Dune: Part Three | Official **teaser** | Warner Bros. | `3_9vCamtuPY` | 2026-08-03 |
| The Hunger Games: Sunrise on the Reaping | Official trailer | LionsgateFilmsUK | `k3khlqKZOJk` | 2026-08-03 |
| Jumanji: Open World | Official trailer | Sony Pictures Malaysia | `-citDl5XHLE` | 2026-08-03 |
| Clayface | Official trailer | Warner Bros. UK & Ireland | `qwacKDJOESw` | 2026-08-03 |
| Klara and the Sun | Official trailer | Sony Pictures Entertainment | `wixzainceAE` | 2026-08-03 |

Source URLs are `https://www.youtube.com/watch?v=<id>` and are stored in the
data record. Captions: all fourteen are marked `captionsAvailable: true`, and
the player passes `cc_load_policy=1`.

### Two teasers rather than trailers

**Supergirl** and **Dune: Part Three** are the studio's own *teaser*, not a full
trailer. In both cases a full trailer exists only on a regional or third-party
channel that did not verify, and the type is recorded honestly rather than
labelled "trailer" for tidiness. The interface says "Official teaser" for these.

### Regional distributor channels

Four entries come from a studio's own territory channel rather than its global
one, because for those titles the full trailer only appears there:

- **LionsgateFilmsUK** — Lionsgate's UK channel
- **Sony Pictures Malaysia** — Sony's Malaysian channel
- **Warner Bros. UK & Ireland** — Warner's UK channel
- *(Warner Bros. Australia was verified as official but not used)*

Each was checked to be the distributor's own channel, not a fan mirror using
the name. They are listed separately from the studio channels in the verifier
so the distinction stays visible.

## Rejected candidates

Every one of these appeared in search results with a title claiming a studio:

| Channel | What it is |
| --- | --- |
| The Film Scene | Reuploader |
| Animation Society | Reuploader |
| Screendollars | Aggregator |
| IGN / IGN Movie Trailers | Media outlet, not the distributor |
| ONE Media | Aggregator |
| OnePress TV | Aggregator |
| Entertainment Tonight | Media outlet |
| Rotten Tomatoes Trailers | Media outlet |
| Teaser Universe | Explicitly labelled "FAN TRAILER" |
| CinemaBlog, VOX Cinemas, CINEMA 21, FeelgoodEntertainment, ndn_editz | Third parties |
| Blumhouse | A studio — but not *this* film's |
| **The Rock** | Dwayne Johnson's own channel. An authentic Moana trailer, and still not the distributor's upload. |

The last one is the most instructive: authenticity and provenance are not the
same test. The verifier's `KNOWN_IMPOSTORS` list keeps these named so the
distinction is not quietly forgotten.

## Regional availability

Embeds are subject to the uploader's territory settings, which this project
cannot control. The player therefore always shows a "Watch on YouTube" link to
the official source, present before any failure rather than offered after one.
