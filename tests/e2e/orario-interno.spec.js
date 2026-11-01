import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Orario Interno Docenti', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('shows access restricted when not logged in', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('userEmail');
    });

    await page.goto('/app/way/tmp/orario-interno');

    await expect(page).toHaveTitle(/Orario Interno/);
    const card = page.locator('.auth-required-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Accesso Riservato ai Docenti');
    await expect(page.locator('a.auth-btn')).toBeVisible();
  });

  test('displays internal weekly timetable and allows modifying subsubject via modal', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
      window.localStorage.setItem('lscway_can_edit_internal_timetable', 'true');
    });

    await page.goto('/app/way/tmp/orario-interno');

    await expect(page).toHaveTitle(/Orario Interno/);
    await expect(page.locator('h1')).toHaveText('Orario Interno');

    // Find the editable card in the weekly timetable
    const editableCard = page.locator('.editable-card').first();
    await expect(editableCard).toBeVisible();
    await expect(editableCard).toContainText('3A');
    await expect(editableCard).toContainText('Fisica');

    // Click to open modal
    await editableCard.click();

    // Verify modal is displayed
    const dialog = page.locator('.modal-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#modal-title')).toHaveText('Assegna Sottomateria');
    await expect(dialog.locator('.parent-card-name')).toHaveText('Matematica e Fisica');

    // Select the "Matematica" subsubject radio option
    const matOption = dialog.locator('label.option-card:has-text("Matematica")').last();
    await matOption.click();

    // Click "Salva Modifica"
    const saveBtn = dialog.locator('button.btn-primary:has-text("Salva Modifica")');
    await saveBtn.click();

    // Modal closes and success toast is visible
    await expect(dialog).not.toBeVisible();
    const toast = page.locator('.toast-notification');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Ora aggiornata');
  });

  test('displays Orario interno link in header drawer when teacher is eligible', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
      window.localStorage.setItem('lscway_can_edit_internal_timetable', 'true');
    });

    await page.goto('/app/way/tmp/');

    // Open drawer
    const hamburgerBtn = page.locator('.hamburger-btn');
    await hamburgerBtn.click();

    const drawer = page.locator('.drawer-panel');
    await expect(drawer).toBeVisible();

    const orarioInternoLink = drawer.locator('a:has-text("Orario interno")');
    await expect(orarioInternoLink).toBeVisible();
    await expect(orarioInternoLink).toHaveAttribute('href', '/app/way/tmp/orario-interno');
  });
});
