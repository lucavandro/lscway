import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Hotspot Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('displays hotspot passwords and supports copy', async ({ page }) => {
    await page.goto('/app/way/tmp/hotspot');

    await expect(page).toHaveTitle(/Hotspot/);
    await expect(page.locator('.section-title')).toContainText('Hotspot');

    // Should display hotspot card
    const card = page.locator('.hotspot-card').first();
    await expect(card).toBeVisible();

    // Check code font and copy button
    const code = card.locator('.hotspot-code');
    await expect(code).toBeVisible();
    const copyBtn = card.locator('.copy-btn');
    await expect(copyBtn).toBeVisible();
  });
});
