import { expect, test, type Page } from '@playwright/test';

/**
 * Trailers and short stories, proved in a real browser.
 *
 * The unit tests cover the data shape, the store and the components in
 * isolation. These cover the things that only matter in a running page: that
 * the programme makes no YouTube request until someone asks, that the one
 * player really is one player, that closing it stops playback, and that a
 * blocked embed still leaves a way to the official source.
 *
 * None of these depend on YouTube actually streaming — the assertions are about
 * the iframe's configuration and lifecycle, which regional playback cannot
 * change.
 */

const STORE_KEY = 'nokshi.preferences.v1';

async function seedLocale(page: Page, locale: 'en' | 'bn') {
  await page.addInitScript(
    ([key, l]) => {
      window.localStorage.setItem(
        key as string,
        JSON.stringify({
          state: {
            cinemaId: null,
            cinemaChosen: false,
            accessibility: {},
            notificationPromptShown: false,
            locale: l,
            theme: 'light',
            themeChosen: true,
            localeChosen: true,
          },
          version: 2,
        }),
      );
    },
    [STORE_KEY, locale] as const,
  );
}

const iframes = (page: Page) => page.locator('iframe');

test.describe('the trailer player', () => {
  test('the programme loads no YouTube iframe until a trailer is opened', async ({ page }) => {
    await page.goto('/movies');
    await expect(page.locator('main h1')).toBeVisible();

    // The whole point of the preview-first design: a dozen cards, zero
    // third-party frames, until someone asks.
    await expect(iframes(page)).toHaveCount(0);
  });

  test('opening from the film page mounts exactly one nocookie iframe', async ({ page }) => {
    await page.goto('/movies/the-odyssey');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(iframes(page)).toHaveCount(0);

    await page.getByRole('button', { name: /watch (official )?trailer/i }).first().click();

    const frame = iframes(page);
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//);
    // The id from the film's own record — Universal's Odyssey trailer.
    await expect(frame).toHaveAttribute('src', /Mzw2ttJD2qQ/);
  });

  test('the dialog is named after the film and credits the channel', async ({ page }) => {
    await page.goto('/movies/backrooms');
    await expect(page.locator('main h1')).toBeVisible();

    await page.getByRole('button', { name: /watch (official )?trailer/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Backrooms')).toBeVisible();
    await expect(dialog.getByText(/A24/)).toBeVisible();
  });

  test('closing removes the iframe and returns focus to the trigger', async ({ page }) => {
    await page.goto('/movies/the-odyssey');
    const trigger = page.getByRole('button', { name: /watch (official )?trailer/i }).first();
    await trigger.click();
    await expect(iframes(page)).toHaveCount(1);

    await page.keyboard.press('Escape');

    // Removing the iframe is what stops playback — there is no player API call.
    await expect(iframes(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('a blocked embed still has a way to the official source', async ({ page }) => {
    await page.goto('/movies/the-odyssey');
    await page.getByRole('button', { name: /watch (official )?trailer/i }).first().click();

    const link = page.getByRole('dialog').getByRole('link', { name: /youtube/i });
    await expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=Mzw2ttJD2qQ');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('the programme page never leaves a second player mounted', async ({ page }) => {
    await page.goto('/movies');
    await expect(page.locator('main h1')).toBeVisible();

    // Open one trailer from a card, close it, open another. Only ever one frame.
    const cardTriggers = page.locator('article button[aria-haspopup="dialog"]');
    await cardTriggers.first().click();
    await expect(iframes(page)).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(iframes(page)).toHaveCount(0);

    await cardTriggers.nth(1).click();
    await expect(iframes(page)).toHaveCount(1);
  });

  test('the trailer dialog labels render in Bangla', async ({ page }) => {
    await seedLocale(page, 'bn');
    await page.goto('/movies/the-odyssey');
    await expect(page.locator('main h1')).toBeVisible();

    await page.getByRole('button', { name: /ট্রেলার/ }).first().click();
    // The recovery link and close button are chrome that must translate.
    await expect(page.getByRole('dialog').getByText(/ইউটিউব/)).toBeVisible();
  });
});

test.describe('the selected-movie story', () => {
  test('appears under the film chosen in Quick Book, and updates on change', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main h1')).toBeVisible();

    // No film chosen yet — no story panel above the fold.
    await expect(page.getByRole('region', { name: /moana|the odyssey|toy story/i })).toHaveCount(0);

    // Choose a film in the Quick Book select.
    await page.locator('#qb-movie').click();
    const firstOption = page.getByRole('option').first();
    const firstTitle = (await firstOption.textContent())?.trim() ?? '';
    await firstOption.click();

    const story = page.getByRole('region', { name: firstTitle });
    await expect(story).toBeVisible();
    await expect(story.getByRole('heading', { name: firstTitle })).toBeVisible();
    // The story carries a trailer action for that film.
    await expect(story.getByRole('button', { name: /watch trailer/i })).toBeVisible();
  });

  test('renders the Bangla story with a Bangla heading', async ({ page }) => {
    await seedLocale(page, 'bn');
    await page.goto('/');
    await expect(page.locator('main h1')).toBeVisible();

    await page.locator('#qb-movie').click();
    await page.getByRole('option').first().click();

    // The "Story" eyebrow is translated.
    await expect(page.getByText('কাহিনি সংক্ষেপ').first()).toBeVisible();
  });

  test('the film page separates the short story from the full synopsis', async ({ page }) => {
    await page.goto('/movies/project-hail-mary');
    await expect(page.locator('main h1')).toBeVisible();

    // The short story is up in the masthead…
    await expect(
      page.locator('header').getByText(/Ryland Grace wakes on a spacecraft/),
    ).toBeVisible();
    // …and the long section is labelled distinctly, lower down, with its own
    // opening line — proving the two are different tellings, not one reused.
    await expect(page.getByRole('heading', { name: /full synopsis/i })).toBeVisible();
    await expect(page.getByText(/Science teacher Ryland Grace/)).toBeVisible();
  });
});
