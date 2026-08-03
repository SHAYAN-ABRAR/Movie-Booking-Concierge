import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { collectErrors, expectRouteNotBlank } from './helpers';

/**
 * The counter must use real photography, and the drawings must be gone.
 *
 * "Gone" is asserted two ways: every card carries a decoded raster image, and
 * no card contains the inline SVG the illustrations were drawn as.
 */

async function cardImages(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('main article')).map((card) => {
      const img = card.querySelector('img');
      return {
        name: card.querySelector('h3')?.textContent?.trim() ?? '(no title)',
        src: img ? (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src : null,
        naturalWidth: img ? (img as HTMLImageElement).naturalWidth : 0,
        alt: img ? (img as HTMLImageElement).alt : '',
        inlineSvgs: card.querySelectorAll('svg').length,
      };
    }),
  );
}

test.describe('counter photography', () => {
  test('every item shows a real, decoded photograph', async ({ page }) => {
    const { pageErrors, consoleErrors } = collectErrors(page);
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400 && /\/media\//.test(r.url())) failed.push(`${r.status()} ${r.url()}`);
    });

    await page.goto('/concessions');
    await expectRouteNotBlank(page);

    // Scroll the whole grid so every lazy image is requested.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await page.waitForTimeout(1200);

    const cards = await cardImages(page);
    expect(cards.length).toBeGreaterThanOrEqual(10);

    for (const card of cards) {
      expect(card.src, `${card.name} has no image`).not.toBeNull();
      expect(card.src, `${card.name} uses a remote image`).toContain('/media/concessions/');
      expect(card.naturalWidth, `${card.name} image did not decode`).toBeGreaterThan(0);
      expect(card.alt.length, `${card.name} has no alt text`).toBeGreaterThan(5);
    }

    expect(failed, 'failed image requests').toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('no two items share a photograph', async ({ page }) => {
    await page.goto('/concessions');
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await page.waitForTimeout(800);

    const sources = (await cardImages(page))
      .map((c) => c.src?.replace(/-\d+\.(avif|webp|jpg)$/, ''))
      .filter(Boolean);
    expect(new Set(sources).size, 'a photograph is reused across items').toBe(sources.length);
  });

  test('the drawn illustrations are gone from the cards', async ({ page }) => {
    await page.goto('/concessions');
    await expectRouteNotBlank(page);

    // The illustrations were inline SVG line-work inside the card's media slot.
    // A card may still contain a small icon SVG (the allergen warning), so this
    // asserts the media slot itself is a raster image.
    const mediaSlots = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main article')).map((card) => {
        const first = card.firstElementChild;
        return {
          hasImg: !!first?.querySelector('img'),
          hasSvg: !!first?.querySelector('svg'),
        };
      }),
    );

    for (const slot of mediaSlots) {
      expect(slot.hasImg, 'a card media slot is not a photograph').toBe(true);
      expect(slot.hasSvg, 'a card media slot still contains a drawing').toBe(false);
    }
  });

  test('add, increase, decrease and remove all still work', async ({ page }) => {
    await page.goto('/concessions');
    const summary = page.getByRole('region', { name: /your counter order/i });

    await page.getByRole('button', { name: /^add$/i }).first().click();
    await expect(summary).toContainText(/subtotal/i);

    const quantity = page.locator('main input[type="number"]').first();
    await expect(quantity).toHaveValue('1');

    await page.getByRole('button', { name: /^add one /i }).first().click();
    await expect(quantity).toHaveValue('2');

    await page.getByRole('button', { name: /^remove one /i }).first().click();
    await expect(quantity).toHaveValue('1');

    await page.getByRole('button', { name: /^remove one /i }).first().click();
    await expect(summary).toContainText(/nothing added yet/i);
  });

  test('category and dietary filters still work', async ({ page }) => {
    await page.goto('/concessions');
    await expect(page.locator('main article').first()).toBeVisible();
    const before = await page.locator('main article').count();

    await page.locator('label').filter({ hasText: /^Popcorn$/ }).first().click();
    // The grid re-renders; wait for it to settle on a smaller set.
    await expect
      .poll(async () => page.locator('main article').count(), { timeout: 10_000 })
      .toBeLessThan(before);
    const after = await page.locator('main article').count();

    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });

  test('the counter does not overflow horizontally', async ({ page }) => {
    await page.goto('/concessions');
    await expectRouteNotBlank(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow, 'the counter scrolls sideways').toBe(false);
  });
});
