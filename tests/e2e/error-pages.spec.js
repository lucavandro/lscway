import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Error Pages & Offline', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('displays offline fallback screen on /offline', async ({ page }) => {
    await page.goto('/app/way/tmp/offline');

    await expect(page).toHaveTitle(/Offline/);
    await expect(page.locator('h2')).toContainText('Sei offline');
    await expect(page.locator('.retry-btn')).toBeVisible();
  });

  test('displays 500 error page with illustration', async ({ page }) => {
    await page.goto('/app/way/tmp/500');

    await expect(page.locator('.error-title')).toContainText('Si è verificato un problema');
    await expect(page.locator('.error-gif')).toBeVisible();
  });
});
