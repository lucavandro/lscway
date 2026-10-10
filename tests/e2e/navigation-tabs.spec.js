import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Tabs Navigation - Classe / Docente / Aula', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('navigates from Classe to Docente and Aula', async ({ page }) => {
    await page.goto('/app/way/tmp/');

    // Navigate to Docente
    const docenteTab = page.locator('.tab-pill', { hasText: 'Docente' });
    await expect(docenteTab).toBeVisible();
    await docenteTab.click();

    await expect(page).toHaveURL(/.*\/docente/);
    await expect(page.locator('.tab-pill.active')).toHaveText('Docente');
    await expect(page.locator('.custom-select-trigger')).toBeVisible();
    const docenteTrigger = await page.locator('.custom-select-trigger').textContent();
    expect(docenteTrigger?.trim().length).toBeGreaterThan(0);

    // Navigate to Aula
    const aulaTab = page.locator('.tab-pill', { hasText: 'Aula' });
    await expect(aulaTab).toBeVisible();
    await aulaTab.click();

    await expect(page).toHaveURL(/.*\/aula/);
    await expect(page.locator('.tab-pill.active')).toHaveText('Aula');
    await expect(page.locator('.custom-select-trigger')).toBeVisible();
    const aulaTrigger = await page.locator('.custom-select-trigger').textContent();
    expect(aulaTrigger?.trim().length).toBeGreaterThan(0);
  });
});
