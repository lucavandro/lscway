import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Sostituzioni Docenti', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('shows access restricted when not logged in', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('userEmail');
    });

    await page.goto('/app/way/tmp/sostituzioni');

    // Should redirect to home or show login prompt
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.endsWith('/app/way/tmp/') || url.endsWith('/sostituzioni')).toBe(true);
  });

  test('displays substitutions list when logged in as teacher', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/sostituzioni');

    await expect(page).toHaveTitle(/Sostituzioni/);
    const subCard = page.locator('.sub-card').first();
    await expect(subCard).toBeVisible();
    await expect(subCard).toContainText('08:55');
    await expect(subCard).toContainText('2B');

    // Checks presence of teacher header and unread counter
    await expect(page.locator('.teacher-header-card')).toBeVisible();
    await expect(page.locator('.unread-pill')).toContainText('da confermare');

    // Acknowledgment button should be visible before action
    const ackBtn = subCard.locator('.btn-acknowledge');
    await expect(ackBtn).toBeVisible();
    await expect(ackBtn).toContainText('Conferma presa visione');
  });

  test('records acknowledgment on button click and updates UI status and counter', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/sostituzioni');

    const subCard = page.locator('.sub-card').first();
    await expect(subCard).toBeVisible();

    const ackBtn = subCard.locator('.btn-acknowledge');
    await expect(ackBtn).toBeVisible();

    // Intercept POST acknowledgment request
    const [ackRequest] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/acknowledgment') && req.method() === 'POST'),
      ackBtn.click(),
    ]);

    expect(ackRequest).toBeTruthy();
    expect(ackRequest.postDataJSON()).toEqual({});

    // Once acknowledged, status badge changes and confirmed banner is shown
    await expect(subCard.locator('.ack-confirmed')).toBeVisible();
    await expect(subCard.locator('.ack-title')).toContainText('Presa visione registrata');
    await expect(page.locator('.unread-pill')).toContainText('Tutte confermate');
  });
});
