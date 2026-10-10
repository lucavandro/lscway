import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Home Page - Orario Classe', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('loads home page, displays brand and tabs', async ({ page }) => {
    await page.goto('/app/way/tmp/');

    // Check title and brand
    await expect(page).toHaveTitle(/WAY Cortese/);
    await expect(page.locator('.brand-title')).toHaveText('WAY Cortese');

    // Check tabs
    await expect(page.locator('.tabs-nav')).toBeVisible();
    await expect(page.locator('.tab-pill.active')).toHaveText('Classe');
  });

  test('allows selecting a class and toggling full timetable', async ({ page }) => {
    await page.goto('/app/way/tmp/');

    // Click class select trigger
    const selectTrigger = page.locator('.custom-select-trigger');
    await expect(selectTrigger).toBeVisible();
    await selectTrigger.click();

    // Verify option exists and select 2B
    const option2B = page.locator('.custom-option', { hasText: '2B' }).first();
    if (await option2B.isVisible()) {
      await option2B.click();
      await expect(selectTrigger).toContainText('2B');
    }

    // Toggle full timetable via Settimana segment button
    const fullTableSwitch = page.locator('.segment-btn', { hasText: 'Settimana' });
    await expect(fullTableSwitch).toBeVisible();
    await fullTableSwitch.click();

    // Verify full timetable table is displayed
    const fullTable = page.locator('.compact-timetable');
    await expect(fullTable).toBeVisible();

    // Check day headers (LUN, MAR, MER, GIO, VEN)
    await expect(fullTable.locator('thead')).toContainText('LUN');
    await expect(fullTable.locator('thead')).toContainText('VEN');
  });
});
