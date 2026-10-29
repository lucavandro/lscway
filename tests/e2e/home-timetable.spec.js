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

  test('displays full teacher name on a single line without ellipsis truncation on mobile in weekly view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/way/tmp/');

    const fullTableSwitch = page.locator('.segment-btn', { hasText: 'Settimana' });
    await fullTableSwitch.click();

    const teacherLabel = page.locator('.compact-timetable .teacher-label').first();
    await expect(teacherLabel).toBeVisible();

    const metrics = await teacherLabel.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      };
    });

    expect(metrics.textOverflow).not.toBe('ellipsis');
    expect(metrics.whiteSpace).toBe('nowrap');
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });

  test('displays substitution badge and banner when substitutions exist', async ({ page }) => {
    const todayWeekdays = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
    const currentDay = todayWeekdays[new Date().getDay()];

    await page.route(/\/app\/orario\/api\/.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classi: ['1A'],
          docenti: ['ROSSI MARIO', 'VERDI GIUSEPPE'],
          aule: ['A101'],
          data: [
            {
              day: currentDay === 'SAB' || currentDay === 'DOM' ? 'LUN' : currentDay,
              ora: '08:00',
              classe: '1A',
              docente: 'VERDI GIUSEPPE',
              docente_abbr: 'VERDI G',
              materia: 'MAT',
              aula: 'A101',
              isSubstitution: true,
              tipologia: 'sostituto',
              docenteOriginale: 'ROSSI MARIO',
              docenteOriginaleAbbr: 'ROSSI M'
            }
          ]
        })
      });
    });

    await page.goto('/app/way/tmp/?q=1A');

    if (currentDay !== 'SAB' && currentDay !== 'DOM') {
      // Check SubstitutionsBanner is visible
      await expect(page.locator('.sub-alert')).toBeVisible();
      await expect(page.locator('.sub-alert')).toContainText('1 ora di sostituzione oggi');

      // Check table row has substitution badge and original teacher note
      await expect(page.locator('.sub-badge')).toHaveText('Supplenza');
      await expect(page.locator('.sub-orig-label')).toContainText('sost. ROSSI M');
    }
  });
});
