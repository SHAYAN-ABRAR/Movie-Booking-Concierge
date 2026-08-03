import { i18next } from './index';
import type { Resources } from './resources/en';
import type {
  CertificateCode,
  Format,
  Genre,
  Language,
  ScreeningAccessibility,
} from '@/data/types';

/**
 * The domain vocabulary — genre, language, format, certificate and access
 * markers.
 *
 * These are not page copy. They are a closed set of terms that appear on nearly
 * every surface: in filter chips, on posters, in Max's replies, on the ticket.
 * Keeping them here rather than in `@/data` means the data modules stay pure
 * (they describe the *schedule*, not what to call things in a given language)
 * and there is one place to check a translation against the glossary.
 *
 * ## Why the label maps are proxies
 *
 * `genreLabels[genre]` reads from the active language on every access, so the
 * seventy-odd existing call sites keep working unchanged and cannot go stale.
 * The trade is that a proxy read is not a subscription: something above the
 * reader has to re-render when the language changes. `Layout` does that — it
 * calls `useTranslation()` and every route is its child — and there is a test
 * (`preferences.test.tsx`) that fails if that guarantee is ever removed.
 *
 * In new code prefer `t('domain.genres.drama')` directly, which is both
 * checked and subscribed.
 */

/**
 * Every dotted key the catalogue actually contains, derived from the English
 * resource. The key maps below are typed against this, so a renamed key is a
 * compile error here rather than a raw `domain.genres.drama` on a filter chip.
 */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

type TranslationKey = Paths<Resources>;

export const amenityKeys = {
  parking: 'domain.amenities.parking',
  cafe: 'domain.amenities.cafe',
  lounge: 'domain.amenities.lounge',
  atm: 'domain.amenities.atm',
  'prayer-room': 'domain.amenities.prayerRoom',
  'baby-change': 'domain.amenities.babyChange',
  cloakroom: 'domain.amenities.cloakroom',
  'gift-card': 'domain.amenities.giftCard',
} as const satisfies Record<string, string>;

export const accessKeys = {
  'step-free-access': 'domain.access.stepFree',
  'accessible-toilet': 'domain.access.accessibleToilet',
  'hearing-loop': 'domain.access.hearingLoop',
  'companion-seat': 'domain.access.companionSeat',
  'assistance-dogs': 'domain.access.assistanceDogs',
  'lift-access': 'domain.access.liftAccess',
  'accessible-parking': 'domain.access.accessibleParking',
} as const satisfies Record<string, string>;

export const accessDetailKeys = {
  'step-free-access': 'domain.accessDetail.stepFree',
  'accessible-toilet': 'domain.accessDetail.accessibleToilet',
  'hearing-loop': 'domain.accessDetail.hearingLoop',
  'companion-seat': 'domain.accessDetail.companionSeat',
  'assistance-dogs': 'domain.accessDetail.assistanceDogs',
  'lift-access': 'domain.accessDetail.liftAccess',
  'accessible-parking': 'domain.accessDetail.accessibleParking',
} as const satisfies Record<string, string>;

export const genreKeys = {
  drama: 'domain.genres.drama',
  thriller: 'domain.genres.thriller',
  action: 'domain.genres.action',
  comedy: 'domain.genres.comedy',
  romance: 'domain.genres.romance',
  'sci-fi': 'domain.genres.sciFi',
  documentary: 'domain.genres.documentary',
  animation: 'domain.genres.animation',
  family: 'domain.genres.family',
  horror: 'domain.genres.horror',
  musical: 'domain.genres.musical',
  historical: 'domain.genres.historical',
} as const satisfies Record<Genre, string>;

export const languageKeys = {
  bn: 'domain.languages.bn',
  en: 'domain.languages.en',
  hi: 'domain.languages.hi',
} as const satisfies Record<Language, string>;

export const formatKeys = {
  standard: 'domain.formats.standard',
  'three-d': 'domain.formats.threeD',
  grandscreen: 'domain.formats.grandscreen',
  velvet: 'domain.formats.velvet',
} as const satisfies Record<Format, string>;

export const formatBlurbKeys = {
  standard: 'domain.formatBlurbs.standard',
  'three-d': 'domain.formatBlurbs.threeD',
  grandscreen: 'domain.formatBlurbs.grandscreen',
  velvet: 'domain.formatBlurbs.velvet',
} as const satisfies Record<Format, string>;

export const accessibilityKeys = {
  'open-captions': 'domain.accessibility.openCaptions.label',
  'closed-captions': 'domain.accessibility.closedCaptions.label',
  'audio-description': 'domain.accessibility.audioDescription.label',
  'wheelchair-spaces': 'domain.accessibility.wheelchairSpaces.label',
  'hearing-loop': 'domain.accessibility.hearingLoop.label',
  'sensory-friendly': 'domain.accessibility.sensoryFriendly.label',
} as const satisfies Record<ScreeningAccessibility, string>;

export const accessibilityBlurbKeys = {
  'open-captions': 'domain.accessibility.openCaptions.blurb',
  'closed-captions': 'domain.accessibility.closedCaptions.blurb',
  'audio-description': 'domain.accessibility.audioDescription.blurb',
  'wheelchair-spaces': 'domain.accessibility.wheelchairSpaces.blurb',
  'hearing-loop': 'domain.accessibility.hearingLoop.blurb',
  'sensory-friendly': 'domain.accessibility.sensoryFriendly.blurb',
} as const satisfies Record<ScreeningAccessibility, string>;

const CERTIFICATE_PATHS = {
  U: 'u',
  UA12: 'ua12',
  UA16: 'ua16',
  A18: 'a18',
} as const satisfies Record<CertificateCode, string>;

/**
 * The full certificate wording — "U — Universal".
 *
 * Note that the *code* itself (`U`, `UA12`) is business data and lives in
 * `@/data/pricing` with `minAge`; only the wording is translated.
 */
export function certificateLabel(code: CertificateCode): string {
  return i18next.t(`domain.certificates.${CERTIFICATE_PATHS[code]}.label`);
}

/**
 * The badge form — "U", "U/A 12+".
 *
 * A separate key rather than `label.split('—')[0]`, which quietly assumed every
 * language would put an em dash in the same place.
 */
export function certificateShort(code: CertificateCode): string {
  return i18next.t(`domain.certificates.${CERTIFICATE_PATHS[code]}.short`);
}

export function certificateGuidance(code: CertificateCode): string {
  return i18next.t(`domain.certificates.${CERTIFICATE_PATHS[code]}.guidance`);
}

/**
 * A read-through view of a key map: every property access resolves against the
 * active language. `ownKeys`/`getOwnPropertyDescriptor` are implemented so that
 * `Object.keys()` and spreading still behave like the plain object this
 * replaced.
 */
function liveLabels<K extends string>(keys: Record<K, TranslationKey>): Record<K, string> {
  return new Proxy({} as Record<K, string>, {
    get: (_target, property) =>
      typeof property === 'string' && property in keys
        ? i18next.t(keys[property as K])
        : undefined,
    has: (_target, property) => typeof property === 'string' && property in keys,
    ownKeys: () => Object.keys(keys),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
}

export const genreLabels = liveLabels(genreKeys);
export const languageLabels = liveLabels(languageKeys);
export const formatLabels = liveLabels(formatKeys);
export const formatBlurbs = liveLabels(formatBlurbKeys);
export const accessibilityLabels = liveLabels(accessibilityKeys);
/**
 * The venue vocabularies were duplicated verbatim in `Cinemas.tsx` and
 * `CinemaDetails.tsx`. One copy, one language decision.
 */
export const amenityLabels = liveLabels(amenityKeys);
export const accessLabels = liveLabels(accessKeys);
/** The fuller wording, for the venue page where there is room to state it. */
export const accessDetailLabels = liveLabels(accessDetailKeys);
export const accessibilityBlurbs = liveLabels(accessibilityBlurbKeys);
