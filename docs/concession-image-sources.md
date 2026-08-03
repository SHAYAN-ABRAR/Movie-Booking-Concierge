# Concession photography — sources and licences

Every photograph on the counter is a real image of real food, downloaded once at
authoring time and committed to this repository. Nothing is fetched at runtime,
nothing is hotlinked, and nothing here was generated.

All images were located through the [Openverse](https://openverse.org) API,
filtered to licences that permit **commercial** reuse. No item reuses another
item's photograph — asserted by `npm run validate:content`.

Each file is stored at three widths (480 / 800 / 1200 px) in AVIF, WebP and JPEG,
cropped to 4:3 for the card slot.

| Item | Source | Creator | Provider | Licence | Downloaded | Local files |
|---|---|---|---|---|---|---|
| con-popcorn-salt-r | [popcorn-salt-r](https://www.rawpixel.com/image/5956203/free-public-domain-cc0-photo) | Unknown | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/popcorn-salt-r-*` |
| con-popcorn-salt-l | [Popcorn up close salted and air popped](https://commons.wikimedia.org/w/index.php?curid=44524042) | HeatherLion at English Wikipedia | wikimedia | CC BY-SA 3.0 | 2026-08-03 | `/media/concessions/popcorn-salt-l-*` |
| con-popcorn-caramel | [Gourmet decorated cupcakes frosting popcorn](https://www.rawpixel.com/image/3294449/free-photo-image-cake-images-caramel) | Unknown | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/popcorn-caramel-*` |
| con-popcorn-cheese | [Free popcorn snack image](https://www.rawpixel.com/image/5911262/image-public-domain-food-free) | Unknown | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/popcorn-cheese-*` |
| con-cola-r | [Serving ice cold cola](https://commons.wikimedia.org/w/index.php?curid=14485670) | Reiner Schubert | wikimedia | CC BY 2.0 | 2026-08-03 | `/media/concessions/cola-r-*` |
| con-cola-l | [On Ice (31516434600)](https://commons.wikimedia.org/w/index.php?curid=189867052) | Michael Pardo from Niagara, Canada | wikimedia | CC CC0 1.0 | 2026-08-03 | `/media/concessions/cola-l-*` |
| con-lassi | [Strawberry mint milkshake](https://www.rawpixel.com/image/447779/strawberry-smoothie) | Jakub Kapusnak | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/lassi-*` |
| con-lemon-soda | [Free lime soda image](https://www.rawpixel.com/image/5922645/photo-image-background-public-domain-food) | Unknown | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/lemon-soda-*` |
| con-tea | [A bengali intricacy](https://commons.wikimedia.org/w/index.php?curid=145165975) | Muntaha Maryum | wikimedia | CC BY-SA 4.0 | 2026-08-03 | `/media/concessions/tea-*` |
| con-samosa | [Shingara 01](https://commons.wikimedia.org/w/index.php?curid=74633598) | Marajozkee | wikimedia | CC BY-SA 4.0 | 2026-08-03 | `/media/concessions/samosa-*` |
| con-chicken-roll | [chicken-roll](https://www.rawpixel.com/image/5952239/free-public-domain-cc0-photo) | Unknown | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/chicken-roll-*` |
| con-nachos | [Nachos supreme](https://commons.wikimedia.org/w/index.php?curid=24636324) | JIP | wikimedia | CC BY-SA 3.0 | 2026-08-03 | `/media/concessions/nachos-*` |
| con-mishti | [Indian Sweet Dessert Peda in a white bone china plate](https://commons.wikimedia.org/w/index.php?curid=40894863) | Prashant Sahu | wikimedia | CC BY-SA 4.0 | 2026-08-03 | `/media/concessions/mishti-*` |
| con-choc-icecream | [A dessert served in a glass bowl, featuring a layer of chocolate dusted on top and an orange scoop of ice cream.](https://wordpress.org/photos/photo/3868dc0bd6/) | shirishpoudel07 | wordpress | CC CC0 1.0 | 2026-08-03 | `/media/concessions/choc-icecream-*` |
| con-combo-two | [Free close pop corn](https://www.rawpixel.com/image/5909473/image-public-domain-free-movie) | Unknown | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/combo-two-*` |
| con-combo-family | [Free dish nachos dip spicy](https://www.rawpixel.com/image/5923596/photo-image-public-domain-wood-food) | Unknown | rawpixel | CC CC0 1.0 | 2026-08-03 | `/media/concessions/combo-family-*` |

## Licence obligations

- **CC0 / Public Domain** — no attribution required; credited here regardless.
- **CC BY / CC BY-SA** — attribution required. The creator, provider and licence
  are recorded above and in `src/data/concessionMedia.ts`, which ships with the
  application.

## Why these images and not stock photography

The brief called for real food photography rather than illustration. Openverse
aggregates Wikimedia Commons, Rawpixel, StockSnap and Flickr under filterable
licences, needs no API key, and gives a verifiable source page for every file —
which is what makes the attribution above checkable rather than decorative.
