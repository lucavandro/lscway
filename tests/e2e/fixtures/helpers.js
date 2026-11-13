import { mockTimetableData, mockSubstitutionsData } from './mockData.js';

export async function setupMockRoutes(page) {
  // Sync localStorage userEmail with session cookie for same-origin auth requests
  await page.addInitScript(() => {
    const syncCookie = () => {
      const email = window.localStorage.getItem('userEmail');
      if (email) {
        document.cookie = 'orariolsc_session=' + encodeURIComponent(email) + '; path=/';
      } else {
        document.cookie = 'orariolsc_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    };
    syncCookie();
    const origSet = window.localStorage.setItem.bind(window.localStorage);
    const origRemove = window.localStorage.removeItem.bind(window.localStorage);
    const origClear = window.localStorage.clear.bind(window.localStorage);
    window.localStorage.setItem = function(k, v) {
      origSet(k, v);
      if (k === 'userEmail') syncCookie();
    };
    window.localStorage.removeItem = function(k) {
      origRemove(k);
      if (k === 'userEmail') syncCookie();
    };
    window.localStorage.clear = function() {
      origClear();
      syncCookie();
    };
  });

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

    if (url.includes('/auth/session')) {
      if (request.method() === 'DELETE') {
        await route.fulfill({
          status: 204,
          headers: corsHeaders,
        });
        return;
      }

      const cookieHeader = request.headers()['cookie'] || '';
      const hasSession = cookieHeader.includes('orariolsc_session=');
      if (hasSession) {
        let email = 'rossi@lscortese.com';
        const match = cookieHeader.match(/orariolsc_session=([^;]+)/);
        if (match && match[1] && match[1] !== 'test-mock-session') {
          email = decodeURIComponent(match[1]);
        }
        await route.fulfill({
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: {
              displayName: 'Mario Rossi',
              email: email,
              role: 'teacher',
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Sessione assente o scaduta.',
        }),
      });
      return;
    }

    if (url.includes('/auth/google')) {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            displayName: 'Mario Rossi',
            email: 'rossi@lscortese.com',
            role: 'teacher',
          },
        }),
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

    if (url.includes('/acknowledgment')) {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acknowledged: true }),
      });
      return;
    }

    if (url.includes('/me/notifications')) {
      const items = mockSubstitutionsData.substitutions || [];
      const unreadCount = items.filter((s) => !s.presaVisione?.data).length;
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, unreadCount }),
      });
      return;
    }

    if (url.includes('/sostituzioni') || url.includes('/me/substitutions')) {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockSubstitutionsData),
      });
      return;
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
}
