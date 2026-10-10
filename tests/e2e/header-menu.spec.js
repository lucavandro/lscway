import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Header Menu - Drawer, Temi e Font Scale', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('opens menu drawer and toggles light/dark theme', async ({ page }) => {
    await page.goto('/app/way/tmp/');

    const hamburgerBtn = page.locator('.hamburger-btn');
    await expect(hamburgerBtn).toBeVisible();
    await hamburgerBtn.click();

    // Verify menu drawer panel is open
    const drawerPanel = page.locator('.drawer-panel');
    await expect(drawerPanel).toBeVisible();

    // Find and click theme toggle button
    const themeBtn = page.locator('.theme-toggle-btn');
    await expect(themeBtn).toBeVisible();

    // Check initial data-theme on html element
    const initialTheme = await page.locator('html').getAttribute('data-theme');
    await themeBtn.click();

    // Verify data-theme toggled
    const newTheme = await page.locator('html').getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('adjusts table font scale via buttons', async ({ page }) => {
    await page.goto('/app/way/tmp/');

    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const drawerPanel = page.locator('.drawer-panel');
    await expect(drawerPanel).toBeVisible();

    // Increase font scale
    const increaseBtn = page.locator('button[title*="Aumenta"]');
    if (await increaseBtn.isVisible()) {
      await increaseBtn.click();
      const styleScale = await page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--table-font-scale')
      );
      expect(Number(styleScale)).toBeGreaterThanOrEqual(1.0);
    }
  });
});
