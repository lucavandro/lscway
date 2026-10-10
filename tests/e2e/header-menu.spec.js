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

  test('navigates from drawer to Prenotazioni page and hides teacher-only items for non-teachers', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('userEmail');
    });

    await page.goto('/app/way/tmp/');
    await page.locator('.hamburger-btn').click();

    const drawerPanel = page.locator('.drawer-panel');
    await expect(drawerPanel).toBeVisible();

    // Link Rapidi must be hidden in drawer for non-teachers
    await expect(drawerPanel.locator('a.nav-link', { hasText: 'Link Rapidi' })).toHaveCount(0);

    const prenotazioniNavLink = drawerPanel.locator('a.nav-link', { hasText: 'Prenotazioni' });
    await expect(prenotazioniNavLink).toBeVisible();
    await prenotazioniNavLink.click();

    await expect(page).toHaveURL(/\/app\/way\/tmp\/prenotazioni$/);
    await expect(page.locator('h1.page-title')).toContainText('Prenotazioni');

    // Public booking card is visible
    const sportelloCard = page.locator('.sportello-psicologico-card');
    await expect(sportelloCard).toBeVisible();
    await expect(sportelloCard.locator('a.btn-visit')).toHaveAttribute('href', 'https://forms.gle/UPLBbEKaK56fpDaL6');
    await expect(sportelloCard.locator('a.btn-visit')).toHaveAttribute('target', '_blank');

    // Teacher-only laptop booking card is hidden
    const portatiliCard = page.locator('.portatili-comodato-card');
    await expect(portatiliCard).toHaveCount(0);
  });

  test('displays Portatili in comodato d\'uso card on Prenotazioni page when logged in as teacher', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/prenotazioni');

    const sportelloCard = page.locator('.sportello-psicologico-card');
    await expect(sportelloCard).toBeVisible();

    const portatiliCard = page.locator('.portatili-comodato-card');
    await expect(portatiliCard).toBeVisible();
    await expect(portatiliCard.locator('a.btn-visit')).toHaveAttribute('href', 'https://forms.gle/NzWrea6g8ZDpwCQ8A');
    await expect(portatiliCard.locator('a.btn-visit')).toHaveAttribute('target', '_blank');
  });

  test('navigates from drawer to Link Rapidi page when logged in as teacher and displays external resource cards', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/');
    await page.locator('.hamburger-btn').click();

    const drawerPanel = page.locator('.drawer-panel');
    await expect(drawerPanel).toBeVisible();

    const linkRapidiNavLink = drawerPanel.locator('a.nav-link', { hasText: 'Link Rapidi' });
    await expect(linkRapidiNavLink).toBeVisible();
    await linkRapidiNavLink.click();

    await expect(page).toHaveURL(/\/app\/way\/tmp\/link$/);
    await expect(page.locator('h1.page-title')).toContainText('Link Rapidi');

    const mailCard = page.locator('.gruppi-mail-card a.btn-visit');
    await expect(mailCard).toBeVisible();
    await expect(mailCard).toHaveAttribute(
      'href',
      'https://docs.google.com/spreadsheets/d/1CHoQed5cFo5ryTkfugP5-4K2jlOuV_RiNbSYj_wD6G4/edit?usp=sharing'
    );

    const moduliCard = page.locator('.moduli-web-card a.btn-visit');
    await expect(moduliCard).toBeVisible();
    await expect(moduliCard).toHaveAttribute('href', 'https://forms.gle/UPLBbEKaK56fpDaL6');

    const elsCard = page.locator('.els-cortese-card a.btn-visit');
    await expect(elsCard).toBeVisible();
    await expect(elsCard).toHaveAttribute('href', 'https://www.liceoscientificocortese.edu.it/els/');
  });
});
