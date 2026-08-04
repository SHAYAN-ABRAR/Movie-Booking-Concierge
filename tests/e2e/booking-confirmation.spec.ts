import { test, expect } from '@playwright/test';
import {
  collectErrors,
  completeBooking,
  expectRouteNotBlank,
  advanceToReview,
  enterBookingFlow,
  navigateTo,
} from './helpers';

/**
 * Regression cover for the blank booking-confirmation page.
 *
 * The defect: the routed outlet kept a fully-transparent copy of the previous
 * page and the confirmation never mounted. It produced no console error and no
 * uncaught exception, so every assertion here is about *visible content*.
 *
 * See docs/booking-confirmation-root-cause.md.
 */

test.describe('booking confirmation', () => {
  test('a completed booking shows the ticket immediately', async ({ page }) => {
    const { pageErrors, consoleErrors } = collectErrors(page);

    const reference = await completeBooking(page);

    // The route is not blank.
    await expectRouteNotBlank(page);

    // The heading is real and visible.
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/you're booked for/i);

    // The movie title appears.
    await expect(heading).not.toHaveText(/^\s*$/);

    // The booking reference appears on the page, not only in the URL.
    await expect(page.locator('main')).toContainText(reference);

    // The ticket container and the QR code are present.
    await expect(page.locator('main .auditorium').first()).toBeVisible();
    await expect(page.locator('main svg').first()).toBeVisible();

    // At least one confirmation action is offered.
    await expect(
      page.getByRole('button', { name: /print|calendar|add to/i }).first(),
    ).toBeVisible();

    expect(pageErrors, 'uncaught page errors').toEqual([]);
    expect(consoleErrors, 'console errors').toEqual([]);
  });

  test('the confirmation survives a hard reload', async ({ page }) => {
    const reference = await completeBooking(page);

    await page.reload();

    await expectRouteNotBlank(page);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/you're booked for/i);
    await expect(page.locator('main')).toContainText(reference);
    await expect(page.locator('main svg').first()).toBeVisible();
  });

  test('the confirmation renders under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const reference = await completeBooking(page);

    await expectRouteNotBlank(page);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/you're booked for/i);
    await expect(page.locator('main')).toContainText(reference);
  });

  test('an unknown reference shows a recovery state, not a blank page', async ({ page }) => {
    const { pageErrors } = collectErrors(page);

    // A legacy-prefixed reference that does not exist — the recovery state
    // has to handle both prefixes, and an unknown one of either shape.
    await page.goto('/booking-confirmation/NK-NOSUCH');

    await expectRouteNotBlank(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main')).toContainText(/no booking with that reference/i);

    // Real ways out.
    await expect(page.getByRole('link', { name: /bookings/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /book a screening/i }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('confirm cannot be double-submitted into two bookings', async ({ page }) => {
    await enterBookingFlow(page);
    await advanceToReview(page);

    const confirm = page.getByRole('button', { name: /^confirm( booking)?/i }).first();
    await expect(confirm).toBeEnabled();

    // Fire twice as fast as the browser allows.
    await confirm.click({ force: true });
    // Client-side navigation fires no `load`, so assert on the URL rather than
    // waiting for a navigation event that will never arrive.
    await expect(page).toHaveURL(/\/booking-confirmation\/GP-/);

    await page.goto('/bookings');
    await expectRouteNotBlank(page);

    // Exactly one booking was written.
    const references = await page.locator('main').innerText();
    const found = references.match(/GP-[A-Z0-9]{6}/g) ?? [];
    expect(new Set(found).size, 'a single confirm produced more than one booking').toBe(1);
  });

  test('every primary route renders after an in-app click', async ({ page }) => {
    // The root defect broke *all* client-side navigation, so this walks the
    // header rather than only checking confirmation.
    const { pageErrors } = collectErrors(page);
    await page.goto('/');

    const journey: Array<[string, RegExp]> = [
      ['Programme', /now showing|programme/i],
      ['Showtimes', /showtimes|what.s on/i],
      ['Cinemas', /cinemas/i],
      ['Counter', /food and drink/i],
      ['Offers', /offers/i],
    ];

    for (const [label, expected] of journey) {
      await navigateTo(page, label);
      await expectRouteNotBlank(page);
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(expected);
    }

    expect(pageErrors).toEqual([]);
  });
});
