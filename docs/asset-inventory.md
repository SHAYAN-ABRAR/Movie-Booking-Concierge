# Asset inventory

Phase 1 audit of everything supplied with this project.

**Source:** the public Google Drive folder "Project resources", downloaded in full to
`reference-assets/raw/`. The folder contained two subfolders — "Project images" (5 files) and
"Project Video" (1 file). All six were retrieved successfully; nothing was inaccessible and no
manual intervention was needed.

> **The files themselves are not committed to this repository.** They are third-party design
> mockups — studied under the brief, but not ours to redistribute. `reference-assets/` is
> gitignored, and this document plus [`src/data/assetManifest.ts`](../src/data/assetManifest.ts)
> are the durable record: filename, type, dimensions, size, SHA-256, classification and rationale
> for each one.
>
> `npm run check:assets` works either way. With the files present it additionally reconciles the
> manifest against disk and verifies each hash; without them it skips those and validates the
> manifest and the source tree, which is where the rules that matter actually apply.

---

## The headline finding

**All six supplied files are design-reference recordings of a third-party concept UI.** Not one is
a deployable content asset.

The five images are screenshots of an unbuilt movie-booking concept branded **"WATCHER"** — a
movie-detail screen, a seat-selection screen, a car-park booking screen, a UI-kit component sheet,
and a full-page composition. The video is a 30-second screen recording of the same concept being
scrolled in a browser.

There is therefore:

- **no logo or brand asset** — the "WATCHER" wordmark belongs to the reference concept, not to this
  project, and adopting it would mean adopting the reference's visual identity
- **no movie poster, backdrop or still**
- **no cinema or venue photography**
- **no concession photography**
- **no offer artwork**
- **no trailer or any usable footage**

The brief is explicit that design-reference screenshots are to be studied, not displayed. Applying
that rule to all six files leaves the application with **zero deployable raster media**, which is
the single largest constraint on the design and is addressed head-on in
[`design-directions.md`](./design-directions.md) and [`design-system.md`](./design-system.md).

---

## File-by-file

Dimensions were read from the file headers; hashes are the first 16 hex digits of the SHA-256.

| File | Type | Dimensions | Aspect | Orientation | Size | Category | Quality | Deployable | Slot |
|---|---|---|---|---|---|---|---|---|---|
| `aa1.webp` | image/webp | 1504 × 1128 | 4:3 | landscape | 143.3 KB | design-reference | Sharp, high-res, but a UI screenshot | **No** | — |
| `aa2.webp` | image/webp | 1504 × 1128 | 4:3 | landscape | 120.5 KB | design-reference | Sharp; not content imagery | **No** | — |
| `aa3.webp` | image/webp | 1504 × 1128 | 4:3 | landscape | 122.9 KB | design-reference | Sharp; not content imagery | **No** | — |
| `aa4.webp` | image/webp | 1504 × 1128 | 4:3 | landscape | 154.8 KB | design-reference | Sharp; a component sheet | **No** | — |
| `aa5.webp` | image/webp | 1504 × 3189 | ~1:2.1 | portrait | 177.2 KB | design-reference | Sharp full-page screenshot | **No** | — |
| `vv1.mp4` | video/mp4 | 1280 × 960 | 4:3 | landscape | 11.5 MB | design-reference | Clean H.264 + AAC, 30.6 s @ 30 fps | **No** | — |

### Hashes and duplicate check

| File | SHA-256 (first 16) |
|---|---|
| `aa1.webp` | `54E530A59B286D52` |
| `aa2.webp` | `64A5904ADFEA6488` |
| `aa3.webp` | `AC12E8536CBB8692` |
| `aa4.webp` | `8A2718369C49C3D6` |
| `aa5.webp` | `0E50B78D92395534` |
| `vv1.mp4` | `81D5E7F5C0635B66` |

No two files are byte-identical. `aa5.webp` is a full-page composition that *contains* the regions
shown in `aa1`–`aa3`, so those four overlap in content without being duplicates — a further reason
none of them could be deployed independently even if they were content assets.

### What each file contributed

| File | Studied for |
|---|---|
| `aa1.webp` | Movie-detail hierarchy; the stacked date-chip strip; metadata density |
| `aa2.webp` | Seat-map treatment: the curved screen arc, aisles as gaps, legend structure, summary-panel placement |
| `aa3.webp` | Order-summary breakdown structure. The car-park feature is out of scope for this brief |
| `aa4.webp` | **The palette.** The clearest single source for the reference's colour relationships |
| `aa5.webp` | Vertical rhythm across a long page; the display-type marquee band |
| `vv1.mp4` | Scroll behaviour and section transitions of the concept |

### Why the video is not the hero video

The brief allows a supplied video in the hero "only when an appropriate video exists". `vv1.mp4` is
technically clean — 1280×960, H.264, 30 fps, with an AAC track — but it is a screen recording of the
reference mockup, not filmed material. Using it as a hero would put a third party's concept UI on
the front page of this product. The hero is built in type and CSS instead, and every film reports an
honest "no trailer available" state rather than linking to something unrelated.

---

## Palette derivation

The brief asks that the palette be derived from the supplied assets. It was, by sampling rather than
by eye — `ffmpeg`'s `palettegen` filter at `stats_mode=full` over each image and over the video.

Dominant values recovered:

| Family | Sampled values |
|---|---|
| Near-black / ink | `#060913` `#0A101D` `#12131A` `#191D2A` `#1E1F24` `#202125` `#24242B` `#2D2E38` |
| Periwinkle accent | `#91B2F2` `#93B2F3` `#97ACD8` `#7F9CD8` `#6177A4` `#395387` `#233D72` `#122C63` |
| Warm clay (rare) | `#BA887A` `#97868B` |
| Paper / light | `#DFDFE8` `#EEEEF5` `#F1F4FA` `#FCFCFD` |

Two things stood out. First, the ink family is *blue*-black, not neutral — every dark value carries a
blue cast. Second, the periwinkle appears as a solid fill on light panels, not as a gradient.

How these were reinterpreted rather than copied is set out in
[`design-system.md` §Colour](./design-system.md#colour).

---

## Consequences for the build

1. **Every visual in the application is drawn, not photographed.** Films are presented through
   generated typographic *plates*; cinemas through true diagrams of their own screens; offers
   through set type.
2. **No stock or generated imagery was introduced.** The brief rules both out, and filling the gap
   that way would have been dishonest about what was supplied.
3. **`npm run check:assets` enforces this.** It fails the build if anything under
   `reference-assets/` is referenced from `src/`, `public/` or `index.html`; if a file on disk is
   missing from the manifest or vice versa; if a manifest file's hash has drifted; or if any source
   image is ever assigned to more than one visual slot.

Current output:

```
· 6 supplied asset(s) catalogued.
· 0 deployable, occupying 0 visual slot(s).
· 6 study-only (design reference), rendered nowhere.

✓ Asset check passed — no image occupies more than one visual slot.
```

The machine-readable version of this inventory is [`src/data/assetManifest.ts`](../src/data/assetManifest.ts).
