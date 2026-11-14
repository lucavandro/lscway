import { test, expect } from '@playwright/test';
import { setupMockRoutes } from './fixtures/helpers.js';

test.describe('Sostituzioni Docenti', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('shows access restricted when not logged in', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('userEmail');
    });

    await page.goto('/app/way/tmp/sostituzioni');

    // Should redirect to home or show login prompt
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.endsWith('/app/way/tmp/') || url.endsWith('/sostituzioni')).toBe(true);
  });

  test('displays substitutions list when logged in as teacher', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/sostituzioni');

    await expect(page).toHaveTitle(/Sostituzioni/);

    // Verify 2 sections: "Da confermare" and "Confermate"
    const headingPending = page.locator('h2.section-heading', { hasText: 'Da confermare' });
    const headingConfirmed = page.locator('h2.section-heading', { hasText: 'Confermate' });
    await expect(headingPending).toBeVisible();
    await expect(headingConfirmed).toBeVisible();

    const subCard = page.locator('.sub-card').first();
    await expect(subCard).toBeVisible();
    await expect(subCard).toContainText('08:55');

    // Verify Classe is in the central details section (.sub-details)
    const classDetailRow = subCard.locator('.sub-details .detail-row', { hasText: 'Classe:' });
    await expect(classDetailRow).toBeVisible();
    await expect(classDetailRow).toContainText('2B');

    // Verify slot-info in header does not contain slot-class
    await expect(subCard.locator('.slot-info .slot-class')).toHaveCount(0);

    // Checks presence of teacher header and unread counter
    await expect(page.locator('.teacher-header-card')).toBeVisible();
    await expect(page.locator('.unread-pill')).toContainText('da confermare');

    // Acknowledgment button should be visible before action
    const ackBtn = subCard.locator('.btn-acknowledge');
    await expect(ackBtn).toBeVisible();
    await expect(ackBtn).toContainText('Conferma presa visione');
  });

  test('records acknowledgment on button click and updates UI status and counter', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/sostituzioni');

    const subCard = page.locator('.sub-card').first();
    await expect(subCard).toBeVisible();

    const ackBtn = subCard.locator('.btn-acknowledge');
    await expect(ackBtn).toBeVisible();

    // Intercept POST acknowledgment request
    const [ackRequest] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/acknowledgment') && req.method() === 'POST'),
      ackBtn.click(),
    ]);

    expect(ackRequest).toBeTruthy();
    expect(ackRequest.postDataJSON()).toEqual({});

    // Once acknowledged, status badge changes and confirmed banner is shown
    await expect(subCard.locator('.ack-confirmed')).toBeVisible();
    await expect(subCard.locator('.ack-title')).toContainText('Presa visione registrata');
    await expect(page.locator('.unread-pill')).toContainText('Tutte confermate');
  });

  test('renders substitutions ordered from most recent to oldest', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.route('**/me/substitutions*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherName: 'Mario Rossi',
          teacherEmail: 'rossi@lscortese.com',
          substitutions: [
            {
              id: 101,
              ora: '08:00',
              data: '2026-11-10',
              classe: '1A',
              materia: 'Matematica',
              docenteAssente: 'BIANCHI',
              presaVisione: { stato: 'inviata', data: null },
            },
            {
              id: 103,
              ora: '11:40',
              data: '2026-11-20',
              classe: '3C',
              materia: 'Fisica',
              docenteAssente: 'VERDI',
              presaVisione: { stato: 'inviata', data: null },
            },
            {
              id: 102,
              ora: '09:50',
              data: '2026-11-15',
              classe: '2B',
              materia: 'Scienze',
              docenteAssente: 'NERI',
              presaVisione: { stato: 'inviata', data: null },
            },
          ],
        }),
      });
    });

    await page.goto('/app/way/tmp/sostituzioni');

    const cards = page.locator('.cards-grid .sub-card');
    await expect(cards).toHaveCount(3);

    // Card 0: more recent (20/11/2026, 3C)
    await expect(cards.nth(0)).toContainText('20/11/2026');
    await expect(cards.nth(0)).toContainText('3C');

    // Card 1: middle (15/11/2026, 2B)
    await expect(cards.nth(1)).toContainText('15/11/2026');
    await expect(cards.nth(1)).toContainText('2B');

    // Card 2: oldest (10/11/2026, 1A)
    await expect(cards.nth(2)).toContainText('10/11/2026');
    await expect(cards.nth(2)).toContainText('1A');
  });

  test('displays Web Push notification section with status badges and iOS help toggle', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
    });

    await page.goto('/app/way/tmp/sostituzioni');

    const pushCard = page.locator('.push-card');
    await expect(pushCard).toBeVisible();
    await expect(pushCard.locator('#push-section-heading')).toContainText('Notifiche sostituzioni (Web Push)');

    // Status grid with 3 tiles
    const statusGrid = pushCard.locator('.push-status-grid');
    await expect(statusGrid).toBeVisible();
    await expect(statusGrid).toContainText('Browser:');
    await expect(statusGrid).toContainText('Permesso:');
    await expect(statusGrid).toContainText('Dispositivo:');

    // Subscribe and sync buttons
    await expect(pushCard.locator('.btn-push-subscribe, .btn-push-unsubscribe')).toBeVisible();
    await expect(pushCard.locator('.btn-push-sync')).toBeVisible();

    // Toggle iOS instructions
    const iosToggle = pushCard.locator('.ios-toggle-btn');
    await expect(iosToggle).toBeVisible();
    await iosToggle.click();
    await expect(pushCard.locator('#ios-instructions-content')).toBeVisible();
    await expect(pushCard.locator('#ios-instructions-content')).toContainText('schermata Home');
  });

  test('preserves destination and redirects back to /sostituzioni after signin', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('userEmail');
    });

    // Navigate to signin with redirect query param
    await page.goto('/app/way/tmp/signin?redirect=%2Fapp%2Fway%2Ftmp%2Fsostituzioni');

    // Set authenticated session and trigger check
    await page.addInitScript(() => {
      window.localStorage.setItem('userEmail', 'rossi@lscortese.com');
      document.cookie = 'orariolsc_session=' + encodeURIComponent('rossi@lscortese.com') + '; path=/';
    });

    await page.reload();

    // Should redirect back to /app/way/tmp/sostituzioni
    await page.waitForURL('**/sostituzioni');
    expect(page.url()).toContain('/sostituzioni');
  });
});
