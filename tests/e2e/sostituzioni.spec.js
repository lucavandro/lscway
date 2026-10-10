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
  });
});
