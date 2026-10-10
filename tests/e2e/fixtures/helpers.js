import { mockTimetableData, mockSubstitutionsData } from './mockData.js';

export async function setupMockRoutes(page) {
  // Intercept all API calls to /app/orario/api/v0/*
  await page.route(/\/app\/orario\/api\/v0.*/, async (route) => {
    const url = route.request().url();
    if (url.includes('/sostituzioni')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSubstitutionsData)
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTimetableData)
      });
    }
  });

  // Intercept polling API calls to docenti_sostituzioni_api.php
  await page.route(/.*docenti_sostituzioni_api\.php.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 991,
            data: new Date().toISOString().split('T')[0],
            ora: '08:55',
            classe: '2B',
            accettato: false
          }
        ]
      })
    });
  });
}
