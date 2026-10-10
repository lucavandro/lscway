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
    const altBtns = page.locator('.easteregg-quote__category-btn');
    await expect(refreshBtn).toBeVisible();
    await expect(altBtns).toHaveCount(2);

    const currentCatLabel = (await refreshBtn.textContent())?.trim();
    const alt1Label = (await altBtns.nth(0).textContent())?.trim();
    const alt2Label = (await altBtns.nth(1).textContent())?.trim();

    expect(currentCatLabel).toBeTruthy();
    expect(alt1Label).toBeTruthy();
    expect(alt2Label).toBeTruthy();
    expect(new Set([currentCatLabel, alt1Label, alt2Label]).size).toBe(3);

    // Click fixed button: stays in the same category, extracts another quote
    await refreshBtn.click();
    const secondText = await quoteText.textContent();
    expect(secondText?.trim().length).toBeGreaterThan(5);
    expect(secondText).not.toBe(firstText);
    await expect(refreshBtn).toHaveText(currentCatLabel);

    // Click one of the two random category buttons: switches current category to that choice
    const targetCategory = (await altBtns.nth(0).textContent())?.trim();
    await altBtns.nth(0).click();
    await expect(refreshBtn).toHaveText(targetCategory);

    const newAlt1 = (await altBtns.nth(0).textContent())?.trim();
    const newAlt2 = (await altBtns.nth(1).textContent())?.trim();
    expect(new Set([targetCategory, newAlt1, newAlt2]).size).toBe(3);
  });
});

