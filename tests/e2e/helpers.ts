import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Drives a real booking from the showtimes page to the review step.
 *
 * Deliberately written against what a customer sees — headings and accessible
 * names — rather than test ids, so it fails if the flow stops being usable.
 */

export const GUEST = {
  name: 'Shayan Abrar',
  email: 'shayan@example.com',
  phone: '01712345678',
};

/** The Continue control, which differs between the desktop and mobile bars. */
function continueButton(page: Page) {
  return page.getByRole('button', { name: /^continue$/i }).first();
}

async function clickContinue(page: Page) {
  const button = continueButton(page);
  await expect(button).toBeEnabled();
  await button.click();
}

/** The step heading the wizard is currently showing. */
function stepHeading(page: Page) {
  return page.locator('main h2').first();
}

/**
 * Enters the booking flow on the first bookable screening of the day.
 *
 * The `?showtime=` parameter seeds the store and jumps the wizard straight to
 * the tickets step, but that seeding lands a beat after navigation — so this
 * waits for the wizard to settle rather than reading the heading immediately.
 */
export async function enterBookingFlow(page: Page) {
  await page.goto('/showtimes');
  const first = page.locator('a[href*="/booking/"]').first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/booking\//);
  // Every showtimes link carries `?showtime=`, so seeding always lands on the
  // tickets step. Waiting for "which cinema" too would race the seeding and
  // click a screening button that is about to be unmounted.
  await expect(stepHeading(page)).toHaveText(/how many/i, { timeout: 15_000 });
}

/** Advances from wherever the flow currently is to the review step. */
export async function advanceToReview(page: Page) {
  for (let i = 0; i < 12; i += 1) {
    const heading = (await stepHeading(page).textContent())?.trim() ?? '';

    if (/check it over/i.test(heading)) return;

    if (/which cinema/i.test(heading)) {
      // The screening was not seeded from the URL; pick one by hand.
      const screening = page
        .locator('main ul button:not([disabled])')
        .filter({ hasText: /\d{1,2}:\d{2}/ })
        .first();
      await expect(screening).toBeVisible();
      await screening.click();
    } else if (/how many/i.test(heading)) {
      await page.getByRole('button', { name: /one more adult ticket/i }).click();
      // The counter is a live region; wait for it rather than the button.
      await expect(page.locator('[aria-label$="Adult tickets"]').first()).toHaveText('1');
    } else if (/choose your seats/i.test(heading)) {
      const seats = page.locator('[role="option"][aria-disabled="false"][aria-selected="false"]');
      for (let s = 0; s < 8; s += 1) {
        if (await continueButton(page).isEnabled()) break;
        await seats.first().click();
      }
    } else if (/who is the booking for/i.test(heading)) {
      await page.locator('#guest-name').fill(GUEST.name);
      await page.locator('#guest-email').fill(GUEST.email);
      await page.locator('#guest-phone').fill(GUEST.phone);
      // Validation is debounced; the Continue button is the signal.
    } else if (/how you would pay/i.test(heading)) {
      await page.locator('[role="radio"], input[type="radio"]').first().click();
    }

    await clickContinue(page);
    // Each step swaps the panel; wait for the heading to actually change.
    await expect(stepHeading(page)).not.toHaveText(heading, { timeout: 10_000 });
  }

  throw new Error(
    `Never reached the review step. Stuck at: ${(await stepHeading(page).textContent()) ?? '?'}`,
  );
}

/** Presses Confirm and waits for the confirmation route. */
export async function confirmBooking(page: Page): Promise<string> {
  const confirm = page.getByRole('button', { name: /^confirm( booking)?/i }).first();
  await expect(confirm).toBeEnabled();
  await confirm.click();

  // New bookings issue GP- since the GrandPlex rebrand. Historical NK- still
  // opens, but nothing generates it any more — see docs/grandplex-migration.md.
  await expect(page).toHaveURL(/\/booking-confirmation\/GP-/);
  const reference = new URL(page.url()).pathname.split('/').pop() ?? '';
  expect(reference).toMatch(/^GP-[A-Z0-9]{6}$/);
  return reference;
}

/** The full journey. Returns the booking reference. */
export async function completeBooking(page: Page): Promise<string> {
  await enterBookingFlow(page);
  await advanceToReview(page);
  return confirmBooking(page);
}

/**
 * Collects uncaught page errors and console errors for the life of a test.
 *
 * A blank page with a clean console is possible (it was exactly this defect),
 * so these are a supplement to the visible-content assertions, never a
 * substitute for them.
 */
export function collectErrors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // React Router's v7 future-flag notices are informational and are emitted
    // by the library, not by this application.
    if (/React Router Future Flag/i.test(text)) return;
    consoleErrors.push(text);
  });

  return { pageErrors, consoleErrors };
}

/**
 * Follows a primary navigation link, opening the mobile menu first if the
 * header nav is collapsed. Works unchanged on both projects.
 */
export async function navigateTo(page: Page, label: string) {
  // Branch on the desktop link itself, not on the menu button. The header nav
  // is `hidden lg:block`, so its visibility *is* the condition — checking the
  // menu button instead races the route transition and picks the wrong path.
  const desktopLink = page
    .locator('header')
    .getByRole('link', { name: label, exact: true })
    .first();

  if (await desktopLink.isVisible().catch(() => false)) {
    await desktopLink.click();
    return;
  }

  const menuButton = page.getByRole('button', { name: /open menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  // The sheet renders in a portal, outside <header>.
  const sheetLink = page
    .getByRole('dialog')
    .getByRole('link', { name: label, exact: true })
    .first();
  await expect(sheetLink).toBeVisible();
  await sheetLink.click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

/** Asserts the routed outlet is actually showing something. */
export async function expectRouteNotBlank(page: Page) {
  const main = page.locator('main');
  await expect(main).toBeVisible();

  // Polled: a lazy route chunk may still be in flight, and the fallback is
  // deliberately sparse. What matters is that it *settles* on real content.
  await expect
    .poll(async () => ((await main.innerText()) ?? '').trim().length, {
      message: 'the routed outlet rendered no visible text',
      timeout: 10_000,
    })
    .toBeGreaterThan(50);

  // The original defect left a fully-transparent copy of the previous route in
  // the outlet: real text in the DOM, nothing on screen. Opacity is therefore
  // asserted directly — polled, because the entrance transition is ~340ms and
  // a settled 1 is what we care about, not the frame we happened to sample.
  await expect
    .poll(
      async () =>
        main
          .locator(':scope > *')
          .first()
          .evaluate((el) => Number(getComputedStyle(el).opacity)),
      { message: 'the routed outlet is present but invisible', timeout: 5_000 },
    )
    .toBeGreaterThan(0.9);
}
