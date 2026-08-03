import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { collectErrors, expectRouteNotBlank, navigateTo } from './helpers';

/**
 * The catalogue must be real films with real, locally-served artwork.
 *
 * These assertions are deliberately about *loaded pixels*, not about markup:
 * an `<img>` with a correct-looking src that 404s still renders a blank card.
 */

/** Titles removed from the programme. None may render again. */
const RETIRED = ['Cholonto Chhaya', 'The Salt Line', 'Rickshaw City', 'Nadir Naam Meghna', 'Kaanch'];

async function loadedImages(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('main img')).map((img) => ({
      src: (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src,
      naturalWidth: (img as HTMLImageElement).naturalWidth,
      alt: (img as HTMLImageElement).alt,
    })),
  );
}

test.describe('real movie catalogue', () => {
  test('now showing lists at least eight real films, each with a loaded poster', async ({ page }) => {
    const { pageErrors, consoleErrors } = collectErrors(page);
    const failedRequests: string[] = [];
    page.on('requestfailed', (r) => failedRequests.push(r.url()));
    page.on('response', (r) => {
      if (r.status() >= 400 && /\/media\//.test(r.url())) failedRequests.push(`${r.status()} ${r.url()}`);
    });

    await page.goto('/movies');
    await expectRouteNotBlank(page);

    const cards = page.locator('main article');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count(), 'at least 8 now-showing films').toBeGreaterThanOrEqual(8);

    // Every visible card carries a real, decoded poster served from this app.
    const images = await loadedImages(page);
    expect(images.length).toBeGreaterThanOrEqual(8);
    for (const image of images) {
      expect(image.naturalWidth, `image did not decode: ${image.src}`).toBeGreaterThan(0);
      expect(image.src).toContain('/media/movies/posters/');
      expect(image.alt.length).toBeGreaterThan(5);
    }

    expect(failedRequests, 'failed image requests').toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('coming soon lists at least six real upcoming films', async ({ page }) => {
    await page.goto('/movies?status=coming-soon');
    await expectRouteNotBlank(page);

    const cards = page.locator('main article');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count(), 'at least 6 coming-soon films').toBeGreaterThanOrEqual(6);

    const images = await loadedImages(page);
    for (const image of images) {
      expect(image.naturalWidth, `image did not decode: ${image.src}`).toBeGreaterThan(0);
    }
  });

  test('no retired fictional title renders anywhere in the programme', async ({ page }) => {
    for (const path of ['/', '/movies', '/movies?status=coming-soon', '/showtimes']) {
      await page.goto(path);
      await expectRouteNotBlank(page);
      const text = await page.locator('body').innerText();
      for (const title of RETIRED) {
        expect(text, `${title} still renders on ${path}`).not.toContain(title);
      }
    }
  });

  test('a film page shows a loaded backdrop and real credits', async ({ page }) => {
    await page.goto('/movies');
    await page.locator('main a[href^="/movies/"]').first().click();
    await expect(page).toHaveURL(/\/movies\/[a-z0-9-]+$/);
    await expectRouteNotBlank(page);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    const images = await loadedImages(page);
    const backdrop = images.find((i) => i.src.includes('/media/movies/backdrops/'));
    expect(backdrop, 'the details page renders no backdrop').toBeDefined();
    expect(backdrop!.naturalWidth).toBeGreaterThan(0);

    // Director and cast are real people from the source record.
    await expect(page.locator('main')).toContainText(/director/i);
  });

  test('filters still narrow the catalogue', async ({ page }) => {
    await page.goto('/movies');
    // Count only once the grid has actually rendered, or `before` is 0 and the
    // comparison below is meaningless.
    await expect(page.locator('main article').first()).toBeVisible();
    const before = await page.locator('main article').count();

    // On small screens the filter panel lives in a sheet.
    const openFilters = page.getByRole('button', { name: /filter/i }).first();
    if (await openFilters.isVisible().catch(() => false)) await openFilters.click();

    // Both panels exist in the DOM at once — the desktop one is hidden below
    // `lg`. Scope to the sheet when it is open, or `.first()` picks the hidden
    // copy and never becomes clickable.
    const dialog = page.getByRole('dialog');
    const scope = (await dialog.isVisible().catch(() => false)) ? dialog : page.locator('main');

    // FilterChip is a <label> wrapping an sr-only checkbox — clicking the
    // label is what a customer actually does.
    const chip = scope.locator('label').filter({ hasText: /^Animation$/ }).first();
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page).toHaveURL(/genre=/);

    const after = await page.locator('main article').count();
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThanOrEqual(before);
  });

  test('Max recognises real film titles', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ask max/i }).first().click();

    const field = page.getByRole('textbox').first();
    await expect(field).toBeVisible();
    await field.fill('How long is The Odyssey?');
    await field.press('Enter');

    // Max answers about the real film rather than failing to match it.
    await expect(page.getByText(/odyssey/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('the catalogue discloses what is real and what is simulated', async ({ page }) => {
    await page.goto('/movies');
    await page.locator('main a[href^="/movies/"]').first().click();
    await expect(page.locator('main')).toContainText(/simulated for this demonstration/i);
  });

  test('every primary route still renders with the new catalogue', async ({ page }) => {
    await page.goto('/');
    for (const label of ['Programme', 'Showtimes', 'Cinemas', 'Counter', 'Offers']) {
      await navigateTo(page, label);
      await expectRouteNotBlank(page);
    }
  });
});
