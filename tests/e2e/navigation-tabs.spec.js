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

for (const width of [1280, 390]) {
  test(`shows teacher names and preserves selection values at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 720 });
    await setupMockRoutes(page, {
      lessons: [],
      teachers: [
        { id: 'T_ROSSI', nome: 'MARIO', cognome: 'ROSSI', teacherFullName: 'Mario Rossi' },
        { id: 'T_BIANCHI', nome: 'LUIGI', cognome: 'BIANCHI' }
      ]
    });
    await page.goto('/app/way/tmp/docente?q=BIANCHI%20LUIGI');

    const trigger = page.getByRole('button', { name: 'Docente', exact: true });
    await expect(trigger).toHaveText('BIANCHI LUIGI');
    await trigger.click();
    const search = page.locator('.search-input:visible');
    const option = page.getByRole('option', { name: 'Mario Rossi', exact: true });
    await expect(option).toBeVisible();
    await search.fill('Mario Rossi');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(option).toBeVisible();
    await search.fill('ROSSI MARIO');
    await option.click();
    await expect(trigger).toHaveText('Mario Rossi');

    const select = page.locator('#select-Docente');
    await expect(select.locator('option[value="ROSSI MARIO"]')).toHaveText('Mario Rossi');
    await expect(select).toHaveValue('ROSSI MARIO');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('prefTeacher'))).toBe('ROSSI MARIO');
  });
}
