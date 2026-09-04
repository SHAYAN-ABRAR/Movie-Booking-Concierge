/**
 * Asset manifest.
 *
 * Every file supplied with this project is recorded here exactly once, with
 * the classification it was given during the Phase 1 audit and the single
 * visual slot it is deployed into.
 *
 * The outcome of that audit was unusual and worth stating plainly: all six
 * supplied files are design-reference recordings of a third-party concept UI
 * ("WATCHER"). None is a logo, poster, backdrop, venue photograph, concession
 * photograph, offer graphic or trailer, and none is ever rendered as page
 * content. See docs/asset-inventory.md for the full audit.
 *
 * The raster media this application *does* ship was sourced separately and is
 * recorded in its own manifests: film posters and backdrops in
 * `mediaManifest.ts` (TMDB, with attribution), and three generated sets in
 * `concessionMedia.ts`, `venueMedia.ts` and `offerMedia.ts`. None of them is
 * covered by this file.
 *
 * The one-image-one-slot rule is enforced by `npm run check:assets`.
 */

export type AssetCategory =
  | 'logo'
  | 'poster'
  | 'backdrop'
  | 'still'
  | 'venue-photo'
  | 'concession-photo'
  | 'offer-art'
  | 'video'
  | 'icon'
  | 'design-reference'
  | 'unusable';

export interface AssetRecord {
  /** Filename as supplied. */
  file: string;
  path: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  sha256Prefix: string;
  category: AssetCategory;
  /** Whether the file may be rendered as page content. */
  deployable: boolean;
  /**
   * The one visual placement this asset occupies. `null` for study-only
   * material. A responsive srcset serving one component counts as one slot.
   */
  slot: string | null;
  quality: string;
  notes: string;
}

export const supplied: AssetRecord[] = [
  {
    file: 'aa1.webp',
    path: 'reference-assets/raw/aa1.webp',
    mime: 'image/webp',
    bytes: 143_298,
    width: 1504,
    height: 1128,
    sha256Prefix: '54E530A59B286D52',
    category: 'design-reference',
    deployable: false,
    slot: null,
    quality: 'Sharp, high resolution, but it is a screenshot of a UI mockup rather than photography.',
    notes:
      'Movie-detail screen of a third-party concept design branded "WATCHER". Studied for layout rhythm, seat-map treatment and the date-strip pattern. Never rendered.',
  },
  {
    file: 'aa2.webp',
    path: 'reference-assets/raw/aa2.webp',
    mime: 'image/webp',
    bytes: 120_482,
    width: 1504,
    height: 1128,
    sha256Prefix: '64A5904ADFEA6488',
    category: 'design-reference',
    deployable: false,
    slot: null,
    quality: 'Sharp screenshot; not content imagery.',
    notes:
      'Seat-selection screen from the same concept. Studied for the curved screen arc, legend structure and summary-panel hierarchy. Never rendered.',
  },
  {
    file: 'aa3.webp',
    path: 'reference-assets/raw/aa3.webp',
    mime: 'image/webp',
    bytes: 122_894,
    width: 1504,
    height: 1128,
    sha256Prefix: 'AC12E8536CBB8692',
    category: 'design-reference',
    deployable: false,
    slot: null,
    quality: 'Sharp screenshot; not content imagery.',
    notes:
      'Car-park booking and order-review screen. Out of scope for this product — parking is not part of the brief. Studied only for its order-summary breakdown. Never rendered.',
  },
  {
    file: 'aa4.webp',
    path: 'reference-assets/raw/aa4.webp',
    mime: 'image/webp',
    bytes: 154_792,
    width: 1504,
    height: 1128,
    sha256Prefix: '8A2718369C49C3D6',
    category: 'design-reference',
    deployable: false,
    slot: null,
    quality: 'Sharp screenshot; a component sheet, not content imagery.',
    notes:
      'UI-kit sheet showing the concept\'s buttons, chips, date pills and seat map together. The most useful single reference for extracting the palette. Never rendered.',
  },
  {
    file: 'aa5.webp',
    path: 'reference-assets/raw/aa5.webp',
    mime: 'image/webp',
    bytes: 177_232,
    width: 1504,
    height: 3189,
    sha256Prefix: '0E50B78D92395534',
    category: 'design-reference',
    deployable: false,
    slot: null,
    quality: 'Sharp full-page screenshot; not content imagery.',
    notes:
      'Full-page composition of the same concept, including a display-type marquee band. Studied for vertical rhythm. Never rendered.',
  },
  {
    file: 'vv1.mp4',
    path: 'reference-assets/raw/vv1.mp4',
    mime: 'video/mp4',
    bytes: 11_519_626,
    width: 1280,
    height: 960,
    sha256Prefix: '81D5E7F5C0635B66',
    category: 'design-reference',
    deployable: false,
    slot: null,
    quality:
      '30.6s, H.264 1280×960 4:3 at 30fps with an AAC track. Technically clean, but it is a screen recording of the concept UI being scrolled — not footage, not a trailer.',
    notes:
      'Because it is a recording of the reference mockup rather than filmed material, it cannot serve as a hero video or a trailer. The hero is built in CSS and type instead, and every film reports an honest "no trailer available" state.',
  },
];

/** Assets actually rendered by the application. Empty, by audit outcome. */
export const deployed: AssetRecord[] = supplied.filter((a) => a.deployable);

export const assetSummary = {
  suppliedCount: supplied.length,
  deployableCount: deployed.length,
  /**
   * Why the interface carries no photography, stated once so it can be quoted
   * in the UI where a reader might otherwise expect an image.
   */
  rationale:
    'None of the six files supplied with this project is usable as page content — they are all design-reference recordings of a third-party concept UI. The film artwork you see instead is real: posters and backdrops obtained from TMDB under its terms and recorded, with attribution, in `mediaManifest.ts`. Three sets of imagery are AI-generated and declared as such in their own manifests: the food photography on the counter, in `concessionMedia.ts`; the five venue foyers, in `venueMedia.ts`; and the five offer posters, in `offerMedia.ts`. All three are legitimate for the same reason — a dish, a lobby and a promotion that do not exist misrepresent nobody, where a film poster is real studio artwork and a still contains real faces. The offer posters carry no lettering at all: the figure is set as real text over them. Everything else — the screen diagrams, empty states, the wordmark — is drawn with type, rule, colour and layout.',
} as const;
