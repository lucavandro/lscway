import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('QR Code & Social Hub', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('displays QR code image and share input', async ({ page }) => {
    await page.goto('/app/way/tmp/qr');

    await expect(page).toHaveTitle(/Condividi/);
    await expect(page.locator('.qr-image')).toBeVisible();
    await expect(page.locator('#share-url')).toBeVisible();
    await expect(page.locator('a[download]')).toBeVisible();
  });

  test('displays official school social channels', async ({ page }) => {
    await page.goto('/app/way/tmp/social');

    await expect(page).toHaveTitle(/Social/);
    await expect(page.locator('.social-card')).toHaveCount(4);

    // Verify Facebook, Instagram, TikTok, YouTube
    const pageText = await page.locator('.social-grid').textContent();
    expect(pageText).toContain('Facebook');
    expect(pageText).toContain('Instagram');
    expect(pageText).toContain('TikTok');
    expect(pageText).toContain('YouTube');
  });
});
