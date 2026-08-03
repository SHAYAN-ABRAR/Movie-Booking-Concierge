import type { Resources } from './resources/en';
import type { defaultNS } from './index';

/**
 * Makes `t()` key-checked at compile time.
 *
 * A typo in a translation key becomes a TypeScript error rather than the key
 * itself appearing on screen.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: { translation: Resources };
    returnNull: false;
  }
}
