import { mockTimetableData, mockSubstitutionsData } from './mockData.js';

export async function setupMockRoutes(page) {
  // Intercept all API calls to /app/orario/api/*
  await page.route(/\/app\/orario\/api\/.*/, async (route) => {
    const request = route.request();
    const url = request.url();
    const origin = request.headers()['origin'] || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
      return;
    }

    if (url.includes('/me/internal-timetable')) {
      if (request.method() === 'PUT') {
        let postData = {};
        try {
          postData = request.postDataJSON() || {};
        } catch (e) {}
        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item: {
              id: 'les_internal_1',
              revision: 2,
              subsubjectId: postData.subsubjectId || null,
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timetable: { id: 'tt_pub_1', nome: 'Orario Definitivo V1' },
          canWrite: true,
          lessons: [
            {
              id: 'les_internal_1',
              revision: 1,
              timetableId: 'tt_pub_1',
              giorno: 1,
              timeSlotId: 'slot_1_1',
              classId: '3A',
              subjectId: 'MATFIS',
              subsubjectId: 'FIS',
              teacherId: 'ROSSIM',
            },
          ],
          subjects: [
            {
              id: 'MATFIS',
              nome: 'Matematica e Fisica',
              admitsSubsubjects: true,
              subsubjectIds: ['MAT', 'FIS'],
            },
            {
              id: 'MAT',
              nome: 'Matematica',
              admitsSubsubjects: false,
              subsubjectIds: [],
            },
            {
              id: 'FIS',
              nome: 'Fisica',
              admitsSubsubjects: false,
              subsubjectIds: [],
            },
          ],
          classes: [{ id: '3A', nome: '3A' }],
          teachers: [{ id: 'ROSSIM', nome: 'Mario', cognome: 'Rossi' }],
          timeSlots: [{ id: 'slot_1_1', giorno: 1, numeroOra: 1 }],
        }),
      });
      return;
    }

    if (url.includes('/sostituzioni')) {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockSubstitutionsData),
      });
    } else {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockTimetableData),
      });
    }
  });

  // Intercept polling API calls to docenti_sostituzioni_api.php
  await page.route(/.*docenti_sostituzioni_api\.php.*/, async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 991,
            data: new Date().toISOString().split('T')[0],
            ora: '08:55',
            classe: '2B',
            accettato: false,
          },
        ],
      }),
    });
  });
}
