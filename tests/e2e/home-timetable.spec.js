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

  test('displays substitution badge in timetable when substitutions exist', async ({ page }) => {
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
      // Check table row has substitute chip with SwapIcon and original teacher note, without redundant Supplenza badge
      await expect(page.locator('.teacher-chip.is-substitute')).toBeVisible();
      await expect(page.locator('.sub-orig-label')).toContainText('sost. ROSSI M');
      await expect(page.locator('.sub-badge')).toHaveCount(0);
      await expect(page.locator('.subject-tag.is-substitution')).toContainText('Sostituzione');
    }
  });

  test('displays single row for teacher substitution superseding POT, showing Sostituzione as materia without SUPPLENZA tag', async ({ page }) => {
    const weekdays = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
    const currentDay = weekdays[new Date().getDay()];

    await page.route('**/app/orario/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classi: ['4E'],
          docenti: ['VIGLIOTTI G', 'SANZARI E'],
          aule: ['A101'],
          data: [
            {
              day: currentDay === 'SAB' || currentDay === 'DOM' ? 'LUN' : currentDay,
              ora: '08:00',
              classe: '',
              docente: 'VIGLIOTTI G',
              docente_abbr: 'VIGLIOTTI G',
              materia: 'POT',
              aula: '',
              isSubstitution: false
            },
            {
              day: currentDay === 'SAB' || currentDay === 'DOM' ? 'LUN' : currentDay,
              ora: '08:00',
              classe: '4E',
              docente: 'VIGLIOTTI G',
              docente_abbr: 'VIGLIOTTI G',
              materia: 'SCIE',
              aula: 'A101',
              isSubstitution: true,
              tipologia: 'sostituto',
              docenteOriginale: 'SANZARI E',
              docenteOriginaleAbbr: 'SANZARI E'
            }
          ]
        })
      });
    });

    await page.goto('/app/way/tmp/docente?q=VIGLIOTTI+G');

    if (currentDay !== 'SAB' && currentDay !== 'DOM') {
      // Row must only show the single substitution entry (POT is superseded)
      const row = page.locator('.timetable-row.has-substitution').first();
      await expect(row).toBeVisible();

      // No entry divider in row
      await expect(row.locator('.entry-divider')).toHaveCount(0);

      // Class chip shows 4E and original teacher
      await expect(row.locator('.class-chip')).toContainText('4E');
      await expect(row.locator('.sub-orig-label')).toContainText('sost. SANZARI E');

      // Tag SUPPLENZA is eliminated
      await expect(row.locator('.sub-badge')).toHaveCount(0);

      // Materia displays "Sostituzione"
      const materiaTag = row.locator('.subject-tag.is-substitution');
      await expect(materiaTag).toBeVisible();
      await expect(materiaTag).toContainText('Sostituzione');
    }
  });
});
