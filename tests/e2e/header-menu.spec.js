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
    const increaseBtn = page.locator('button[title*="Aumenta"], button[title*="Ingrandisci"]');
    if (await increaseBtn.isVisible()) {
      await increaseBtn.click();
      const styleScale = await page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--table-font-scale')
      );
      expect(Number(styleScale)).toBeGreaterThanOrEqual(1.0);
    }
  });

  test('shows public Prenotazioni and Link Rapidi for non-teacher users, hiding teacher-only laptop form', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('userEmail');
    });

    await page.goto('/app/way/tmp/');
    await page.locator('.hamburger-btn').click();

    const drawerPanel = page.locator('.drawer-panel');
    await expect(drawerPanel).toBeVisible();

    // Public booking link is visible
    const sportelloLink = drawerPanel.locator('a', { hasText: 'Sportello Psicologico' });
    await expect(sportelloLink).toBeVisible();
    await expect(sportelloLink).toHaveAttribute('href', 'https://forms.gle/UPLBbEKaK56fpDaL6');
    await expect(sportelloLink).toHaveAttribute('target', '_blank');

    // Teacher-only laptop booking link is hidden
    const portatiliLink = drawerPanel.locator('a', { hasText: "Portatili in comodato d'uso" });
    await expect(portatiliLink).toHaveCount(0);

    // Quick external links are visible
    const mailLink = drawerPanel.locator('a', { hasText: 'Indirizzi gruppi mail scolastici' });
    await expect(mailLink).toBeVisible();
    await expect(mailLink).toHaveAttribute(
      'href',
      'https://docs.google.com/spreadsheets/d/1CHoQed5cFo5ryTkfugP5-4K2jlOuV_RiNbSYj_wD6G4/edit?usp=sharing'
    );

    const moduliLink = drawerPanel.locator('a', { hasText: 'Moduli Web 2.0' });
    await expect(moduliLink).toBeVisible();
    await expect(moduliLink).toHaveAttribute('href', 'https://forms.gle/UPLBbEKaK56fpDaL6');

    const elsLink = drawerPanel.locator('a', { hasText: 'ELS Cortese' });
    await expect(elsLink).toBeVisible();
    await expect(elsLink).toHaveAttribute('href', 'https://www.liceoscientificocortese.edu.it/els/');
  });

  test('shows Portatili in comodato d\'uso booking link when logged in as teacher', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/');
    await page.locator('.hamburger-btn').click();

    const drawerPanel = page.locator('.drawer-panel');
    await expect(drawerPanel).toBeVisible();

    const portatiliLink = drawerPanel.locator('a', { hasText: "Portatili in comodato d'uso" });
    await expect(portatiliLink).toBeVisible();
    await expect(portatiliLink).toHaveAttribute('href', 'https://forms.gle/NzWrea6g8ZDpwCQ8A');
    await expect(portatiliLink).toHaveAttribute('target', '_blank');
  });
});
