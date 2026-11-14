// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE_VERSION = "v1.10.1";
const CACHE = `lscway-cache-${CACHE_VERSION}`;
let userEmail = null;
let notificationsEnabled = true;
let notifiedSubstitutions = new Set();
let checkInterval = null;

// Protegge Cache.prototype.put da errori di rete transitori (es. stream interrotto durante navigazione)
// e impedisce il salvataggio in cache di risposte redirezionate o in errore
if (typeof Cache !== 'undefined' && Cache.prototype && Cache.prototype.put) {
  const originalCachePut = Cache.prototype.put;
  Cache.prototype.put = function (request, response) {
    try {
      if (!response || !response.ok || response.type === 'error' || response.redirected) {
        return Promise.resolve();
      }
      return originalCachePut.call(this, request, response).catch(() => {});
    } catch (err) {
      return Promise.resolve();
    }
  };
}

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (typeof workbox !== 'undefined') {
  workbox.setConfig({ debug: false });
}

const offlineFallbackPage = "./";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data && event.data.type === "SET_USER_EMAIL") {
    const newEmail = event.data.email;
    
    // Se l'email cambia, resetta le notifiche inviate
    if (userEmail !== newEmail) {
      notifiedSubstitutions.clear();
    }
    
    userEmail = newEmail;
    if (typeof event.data.notificationsEnabled === "boolean") {
      notificationsEnabled = event.data.notificationsEnabled;
    }
    
    // Gestisci l'intervallo di controllo
    if (userEmail && notificationsEnabled) {
      startPeriodicCheck();
    } else {
      stopPeriodicCheck();
    }
  } else if (event.data && event.data.type === "SET_NOTIFICATIONS_ENABLED") {
    notificationsEnabled = !!event.data.enabled;
    if (userEmail && notificationsEnabled) {
      startPeriodicCheck();
    } else {
      stopPeriodicCheck();
    }
  }
});

function startPeriodicCheck() {
  if (checkInterval) return; // Evita intervalli multipli
  
  checkInterval = setInterval(() => {
    if (userEmail && notificationsEnabled) {
      checkSubstitutionsInBackground();
    }
  }, 5000);
}

function stopPeriodicCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

const PRECACHE_ASSETS = [
  offlineFallbackPage,
  "./app.css",
  "./logo-blue.webp",
  "./manifest.json"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          try {
            const res = await fetch(asset, {
              cache: 'no-cache',
              credentials: 'same-origin',
              redirect: 'follow'
            });
            if (res && res.ok && !res.redirected) {
              await cache.put(asset, res);
            }
          } catch (err) {
            console.warn(`[Service Worker] Failed to precache asset ${asset}:`, err);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration && self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.disable();
        } catch (e) {}
      }

      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter((name) => name !== CACHE);

      // Migra i bundle immutabili di SvelteKit (/_app/immutable/) già presenti nelle cache precedenti
      // per evitare di riscaricare file con hash identico ad ogni aggiornamento di versione
      if (oldCaches.length > 0) {
        try {
          const newCache = await caches.open(CACHE);
          for (const oldName of oldCaches) {
            const oldCache = await caches.open(oldName);
            const requests = await oldCache.keys();
            const immutableRequests = requests.filter((req) => req.url.includes('/_app/immutable/'));
            await Promise.all(
              immutableRequests.map(async (req) => {
                const existing = await newCache.match(req);
                if (!existing) {
                  const res = await oldCache.match(req);
                  if (res && res.ok && !res.redirected) {
                    await newCache.put(req, res);
                  }
                }
              })
            );
          }
        } catch (e) {}
      }

      // Elimina tutte le cache delle versioni precedenti
      await Promise.all(oldCaches.map((name) => caches.delete(name)));

      // Invalida eventuali vecchi redirect 301 (verso http://) rimasti nella HTTP disk cache del browser
      await Promise.allSettled(
        ['./', './docente', './aula'].map((route) =>
          fetch(route, { cache: 'reload', credentials: 'same-origin' }).catch(() => {})
        )
      );

      await self.clients.claim();
    })()
  );
});

const isDevModuleRequest = (url) =>
  url.pathname.includes('/@vite/') ||
  url.pathname.includes('/@fs/') ||
  url.pathname.includes('/node_modules/') ||
  url.pathname.includes('/src/') ||
  url.pathname.includes('/.svelte-kit/');

const isApiRequest = (url) =>
  url.pathname.includes('/api/') ||
  url.pathname.endsWith('.php');

const STATIC_ASSET_REGEX = /\.(?:css|js|mjs|webp|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|otf|json)$/i;

const isSpaShellRequest = ({ request, url }) => {
  if (request.method !== 'GET' || isDevModuleRequest(url) || isApiRequest(url)) {
    return false;
  }
  if (request.mode === 'navigate') {
    return true;
  }
  return (
    url.origin === self.location.origin &&
    !url.pathname.includes('/_app/immutable/') &&
    !STATIC_ASSET_REGEX.test(url.pathname)
  );
};

// CacheFirst per i bundle immutabili di SvelteKit (hanno già hash nel nome file)
const immutableCacheFirstStrategy = new workbox.strategies.CacheFirst({
  cacheName: CACHE
});

// StaleWhileRevalidate per asset statici (CSS, icone, immagini)
const staticStaleWhileRevalidateStrategy = new workbox.strategies.StaleWhileRevalidate({
  cacheName: CACHE,
  fetchOptions: {
    cache: 'no-cache'
  }
});

// Gestione navigazione e route SPA: Stale-While-Revalidate sull'index.html della SPA
// per avvio istantaneo con aggiornamento in background (copre anche fetch a route SPA come /docente o /aula)
workbox.routing.registerRoute(
  isSpaShellRequest,
  async ({ event, request }) => {
    const cache = await caches.open(CACHE);
    const scopeRootUrl = self.registration ? new URL('./', self.registration.scope).href : offlineFallbackPage;

    const cachedShell =
      (await cache.match(scopeRootUrl, { ignoreSearch: true })) ||
      (await cache.match(offlineFallbackPage, { ignoreSearch: true }));

    if (cachedShell && request.mode !== 'navigate') {
      return cachedShell;
    }

    const networkFetch = fetch(scopeRootUrl, {
      cache: 'no-cache',
      credentials: 'same-origin',
      redirect: 'follow'
    })
      .then(async (freshResponse) => {
        if (freshResponse && freshResponse.ok && !freshResponse.redirected) {
          await cache.put(scopeRootUrl, freshResponse.clone());
        }
        return freshResponse;
      })
      .catch(() => null);

    if (cachedShell) {
      if (event && typeof event.waitUntil === 'function') {
        event.waitUntil(networkFetch);
      }
      return cachedShell;
    }

    const freshResponse = await networkFetch;
    if (freshResponse) {
      return freshResponse;
    }

    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      Response.error()
    );
  }
);

// 1. Risorse immutabili di SvelteKit (/_app/immutable/) -> CacheFirst (0ms network)
workbox.routing.registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    url.pathname.includes('/_app/immutable/') &&
    !isDevModuleRequest(url),
  immutableCacheFirstStrategy
);

// 2. Risorse statiche dello stesso dominio (CSS, JS, immagini, icone, font, manifest) -> StaleWhileRevalidate
workbox.routing.registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    request.mode !== 'navigate' &&
    url.origin === self.location.origin &&
    STATIC_ASSET_REGEX.test(url.pathname) &&
    !url.pathname.includes('/_app/immutable/') &&
    !isApiRequest(url) &&
    !isDevModuleRequest(url),
  staticStaleWhileRevalidateStrategy
);

// Gestione del background sync
self.addEventListener('sync', function(event) {
  if (event.tag === 'check-substitutions') {
    if (userEmail && notificationsEnabled) {
      event.waitUntil(checkSubstitutionsInBackground());
    }
  }
});

async function checkSubstitutionsInBackground() {
  // Verifica che l'utente sia loggato e le notifiche siano abilitate
  if (!userEmail || !notificationsEnabled) {
    return;
  }

  try {
    const response = await fetch('/app/orario/api/v1/me/notifications', {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) return;

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todaySubstitutions = items.filter(s => {
        const isAcknowledged = Boolean(
          s.accettato ||
          (s.presaVisione && s.presaVisione.data !== null && s.presaVisione.stato === 'presa_visione')
        );
        return s.data === today && !isAcknowledged && !notifiedSubstitutions.has(s.id);
      });

      for (const substitution of todaySubstitutions) {
        const className = typeof substitution.classe === 'object' && substitution.classe !== null
          ? (substitution.classe.nome || '')
          : (substitution.classe || '');

        const scopeUrl = self.registration ? self.registration.scope : self.location.href;
        const iconUrl = new URL('favicon.png', scopeUrl).href;
        const targetUrl = new URL('sostituzioni', scopeUrl).href;

        await self.registration.showNotification('Sostituzione non confermata', {
          body: `Hai una sostituzione alle ${substitution.ora} per la classe ${className} che necessita conferma.`,
          icon: iconUrl,
          badge: iconUrl,
          tag: `substitution-${substitution.id}`,
          requireInteraction: true,
          data: {
            substitutionId: substitution.id,
            url: targetUrl
          }
        });

        notifiedSubstitutions.add(substitution.id);
      }

      console.log(`Service Worker: Controllate ${items.length} sostituzioni, inviate ${todaySubstitutions.length} notifiche`);
    }
  } catch (error) {
    console.error('Service Worker: Errore nel controllo sostituzioni in background:', error);
  }
}

// Gestione Notifiche Web Push (VAPID) inviate dal backend OrarioLSC
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      try {
        payload = { body: event.data.text() };
      } catch (err) {
        payload = {};
      }
    }
  }

  const title = (payload && typeof payload.title === 'string' && payload.title.trim())
    ? payload.title.trim()
    : 'OrarioLSC · Sostituzioni';

  const body = (payload && typeof payload.body === 'string' && payload.body.trim())
    ? payload.body.trim()
    : 'Una sostituzione è stata pubblicata o aggiornata. Accedi per i dettagli.';

  const tag = (payload && typeof payload.tag === 'string' && payload.tag.trim())
    ? payload.tag.trim()
    : 'orariolsc-substitution';

  const scopeUrl = self.registration ? self.registration.scope : self.location.href;
  const iconUrl = new URL('favicon.png', scopeUrl).href;
  const targetUrl = new URL('sostituzioni', scopeUrl).href;

  const options = {
    body,
    tag,
    icon: iconUrl,
    badge: iconUrl,
    requireInteraction: true,
    data: {
      url: targetUrl,
      tag
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const scopeUrl = self.registration ? self.registration.scope : self.location.href;
  const targetUrl = new URL('sostituzioni', scopeUrl).href;

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      // Se una finestra della PWA sullo stesso dominio è già aperta, portala in primo piano e naviga
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          try {
            const clientUrl = new URL(client.url, self.location.origin);
            if (clientUrl.origin === self.location.origin) {
              await client.focus();
              if (client.url !== targetUrl && 'navigate' in client) {
                await client.navigate(targetUrl);
              }
              return client;
            }
          } catch (e) {}
        }
      }

      // Se non vi è alcuna finestra aperta, apri la pagina /sostituzioni
      if (clients.openWindow) {
        return await clients.openWindow(targetUrl);
      }
    })()
  );
});
