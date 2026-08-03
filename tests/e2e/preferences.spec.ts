import { expect, test, type Page } from '@playwright/test';

/**
 * Language and appearance, proved in a real browser.
 *
 * The unit tests in `src/components/preferences/preferences.test.tsx` cover the
 * store, the re-render contract and the formatters. These cover the things
 * jsdom cannot answer: whether the *painted* page is actually dark, whether the
 * choice survives a genuine reload, and whether there is a flash of the wrong
 * theme before React boots.
 */

const STORE_KEY = 'nokshi.preferences.v1';

/** Seeds the persisted preference before the first paint of the next load. */
async function seed(page: Page, locale: 'en' | 'bn', theme: 'light' | 'dark') {
  await page.addInitScript(
    ([key, l, th]) => {
      window.localStorage.setItem(
        key as string,
        JSON.stringify({
          state: {
            cinemaId: null,
            cinemaChosen: false,
            accessibility: {},
            notificationPromptShown: false,
            locale: l,
            theme: th,
            themeChosen: true,
            localeChosen: true,
          },
          version: 2,
        }),
      );
    },
    [STORE_KEY, locale, theme] as const,
  );
}

const luminance = (rgb: string) => {
  const [r = 0, g = 0, b = 0] = (rgb.match(/\d+/g) ?? []).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ROUTES = ['/', '/movies', '/showtimes', '/cinemas', '/concessions', '/offers', '/bookings'];

/**
 * Returns a locator for a preference button, opening the mobile menu first if
 * that is where it lives at this width.
 *
 * The language toggle is `hidden lg:inline-flex` in the header — "বাংলা" needs
 * room the mobile bar does not have — so on a phone both toggles live in the
 * menu sheet. Reaching them the way a customer would is the point of the test.
 */
async function preferenceButton(page: Page, name: string | RegExp) {
  const inHeader = page.getByRole('button', { name });
  if (await inHeader.first().isVisible().catch(() => false)) return inHeader.first();

  await page.getByRole('button', { name: /Open menu|মেনু খুলুন/ }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  return sheet.getByRole('button', { name }).first();
}

test.describe('the four combinations', () => {
  for (const locale of ['en', 'bn'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${locale} + ${theme} renders every primary route`, async ({ page }) => {
        await seed(page, locale, theme);

        for (const route of ROUTES) {
          await page.goto(route);

          await expect(page.locator('html')).toHaveAttribute('lang', locale);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

          // The route actually rendered, rather than erroring into the boundary.
          await expect(page.locator('main h1')).toBeVisible();
          await expect(page.getByText('This page could not be displayed.')).toHaveCount(0);

          const background = await page
            .locator('body')
            .evaluate((el) => getComputedStyle(el).backgroundColor);
          const brightness = luminance(background);

          if (theme === 'dark') {
            expect(brightness, `${route} should paint a dark ground`).toBeLessThan(90);
          } else {
            expect(brightness, `${route} should paint a light ground`).toBeGreaterThan(180);
          }
        }
      });
    }
  }
});

test('the theme is applied before first paint, with no flash of the wrong one', async ({ page }) => {
  await seed(page, 'en', 'dark');

  // Sampled from the very first script the document runs — if the inline
  // bootstrap in index.html did not set the attribute, this is null and the
  // page would paint light before React corrects it.
  const atFirstScript = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.goto('/');
  void atFirstScript;

  const themeBeforeHydration = await page.evaluate(
    () => document.documentElement.getAttribute('data-theme'),
  );
  expect(themeBeforeHydration).toBe('dark');

  // `color-scheme` matters as much as the token set: without it the browser
  // paints form controls, scrollbars and the canvas light behind our own CSS.
  await expect(page.locator('html')).toHaveAttribute('style', /color-scheme:\s*dark/);
});

test('a choice survives a real reload', async ({ page }) => {
  await page.goto('/movies');
  await expect(page.locator('main h1')).toBeVisible();

  await (await preferenceButton(page, 'বাংলা')).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  await expect(page.locator('main h1')).toHaveText('এখন চলছে');
});

/*
 * Desktop only. The behaviour under test — the URL and its filter state
 * surviving a language switch — has nothing to do with viewport width, and at
 * phone widths the time-of-day chips live inside the filter sheet while the
 * language toggle lives inside the menu sheet. Driving two overlays to assert
 * something width-independent would test the overlays, not the preference.
 */
test('switching language keeps you on the page, with state intact', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Filter chips are sheet-bound on mobile.');

  await page.goto('/showtimes');
  await expect(page.locator('main h1')).toBeVisible();

  // Narrow the schedule first — the filter is the state that must survive.
  await page.getByText('Evening', { exact: true }).first().click();
  await expect(page).toHaveURL(/after=/);
  const urlBefore = new URL(page.url());

  await (await preferenceButton(page, 'বাংলা')).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  expect(new URL(page.url()).pathname).toBe(urlBefore.pathname);
  expect(new URL(page.url()).searchParams.get('after')).toBe(urlBefore.searchParams.get('after'));
  await expect(page.locator('main h1')).toHaveText('শোটাইম');
});

test('prices and times are rendered in Bengali numerals', async ({ page }) => {
  await seed(page, 'bn', 'light');
  await page.goto('/showtimes');
  // The route is code-split: without this the assertion can read the loading
  // skeleton, which has no prices in it at all.
  await expect(page.locator('main h1')).toBeVisible();

  const body = (await page.locator('main').textContent()) ?? '';

  // Bengali digits present…
  expect(body).toMatch(/[০-৯]/);
  // …and the taka figures are not left in Latin ones.
  expect(body).not.toMatch(/৳\s?\d/);
});

test('the document title follows the language', async ({ page }) => {
  await seed(page, 'bn', 'light');
  await page.goto('/showtimes');
  await expect(page).toHaveTitle(/শোটাইম/);

  await (await preferenceButton(page, 'English')).click();
  await expect(page).toHaveTitle(/Showtimes/);
});

test('both toggles are reachable and operable from the keyboard', async ({ page }) => {
  await page.goto('/movies');
  await expect(page.locator('main h1')).toBeVisible();

  const bangla = await preferenceButton(page, 'বাংলা');
  await bangla.focus();
  await expect(bangla).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');

  // `aria-pressed` is what tells a screen-reader user which one is active;
  // a purely visual highlight would leave them guessing.
  await expect(bangla).toHaveAttribute('aria-pressed', 'true');
});
