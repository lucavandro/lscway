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

  test('displays 500 error page with illustration and random quote', async ({ page }) => {
    await page.goto('/app/way/tmp/500');

    await expect(page.locator('.error-title')).toContainText('Si è verificato un problema');
    await expect(page.locator('.error-gif')).toBeVisible();

    const quoteFigure = page.locator('.easteregg-quote');
    await expect(quoteFigure).toBeVisible();

    const quoteText = page.locator('.easteregg-quote__text');
    const quoteAuthor = page.locator('.easteregg-quote__author');
    await expect(quoteText).toBeVisible();
    await expect(quoteAuthor).toBeVisible();

    const firstText = await quoteText.textContent();
    expect(firstText?.trim().length).toBeGreaterThan(5);

    const refreshBtn = page.locator('.easteregg-quote__refresh');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    const secondText = await quoteText.textContent();
    expect(secondText?.trim().length).toBeGreaterThan(5);
    expect(secondText).not.toBe(firstText);
  });
});
