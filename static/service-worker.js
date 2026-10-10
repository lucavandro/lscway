// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE_VERSION = "v2026-10-10-2";
const CACHE = `lscway-cache-${CACHE_VERSION}`;
let userEmail = null;
let notificationsEnabled = true;
let notifiedSubstitutions = new Set();
let checkInterval = null;

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
            await cache.add(new Request(asset, { cache: 'no-cache' }));
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
                  if (res && res.ok) {
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

// CacheFirst per i bundle immutabili di SvelteKit (hanno già hash nel nome file)
const immutableCacheFirstStrategy = new workbox.strategies.CacheFirst({
  cacheName: CACHE
});

// StaleWhileRevalidate per asset statici (CSS, icone, immagini)
const staticStaleWhileRevalidateStrategy = new workbox.strategies.StaleWhileRevalidate({
  cacheName: CACHE
});

// Gestione navigazione pagina (SPA): Stale-While-Revalidate sull'index.html della SPA
// per avvio istantaneo con aggiornamento in background
workbox.routing.registerRoute(
  ({ request, url }) => request.mode === 'navigate' && !isDevModuleRequest(url),
  async ({ request }) => {
    const cache = await caches.open(CACHE);
    const scopeRootUrl = self.registration ? new URL('./', self.registration.scope).href : offlineFallbackPage;

    const cachedShell =
      (await cache.match(scopeRootUrl, { ignoreSearch: true })) ||
      (await cache.match(offlineFallbackPage, { ignoreSearch: true }));

    const networkFetch = fetch(scopeRootUrl, {
      cache: 'no-cache',
      credentials: 'same-origin',
      redirect: 'follow'
    })
      .then((freshResponse) => {
        if (freshResponse && freshResponse.ok) {
          cache.put(scopeRootUrl, freshResponse.clone()).catch(() => {});
        }
        return freshResponse;
      })
      .catch(() => null);

    if (cachedShell) {
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
    url.pathname.includes('/_app/immutable/') &&
    !isDevModuleRequest(url),
  immutableCacheFirstStrategy
);

// 2. Risorse statiche (CSS, JS, immagini, icone, font) -> StaleWhileRevalidate
workbox.routing.registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    request.mode !== 'navigate' &&
    !url.pathname.includes('/_app/immutable/') &&
    !isApiRequest(url) &&
    !isDevModuleRequest(url),
  staticStaleWhileRevalidateStrategy
);

// Gestione del background sync
self.addEventListener('sync', function(event) {
  if (event.tag === 'check-substitutions') {
    if (notificationsEnabled) {
      event.waitUntil(checkSubstitutionsInBackground());
    }
  }
});

async function checkSubstitutionsInBackground() {
  // Verifica che l'utente sia loggato e le notifiche siano abilitate
  if (!userEmail || !notificationsEnabled) {
    console.log('Service Worker: Skip controllo sostituzioni (utente non loggato o notifiche disabilitate)');
    return;
  }

  try {
    const response = await fetch(`https://www.liceoscientificocortese.edu.it/app/way/docenti_sostituzioni_api.php?email=${encodeURIComponent(userEmail)}`);
    const data = await response.json();
    
    if (data.success) {
      const today = new Date().toISOString().split('T')[0];
      const todaySubstitutions = data.data.filter(s => 
        s.data === today && !s.accettato && !notifiedSubstitutions.has(s.id)
      );

      for (const substitution of todaySubstitutions) {
        await self.registration.showNotification('Sostituzione non confermata', {
          body: `Hai una sostituzione alle ${substitution.ora} per la classe ${substitution.classe} che necessita conferma.`,
          icon: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/favicon.png',
          badge: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/favicon.png',
          tag: `substitution-${substitution.id}`,
          requireInteraction: true,
          data: {
            substitutionId: substitution.id,
            url: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/sostituzioni'
          }
        });
        
        notifiedSubstitutions.add(substitution.id);
      }
      
      console.log(`Service Worker: Controllate ${data.data.length} sostituzioni, inviate ${todaySubstitutions.length} notifiche`);
    }
  } catch (error) {
    console.error('Service Worker: Errore nel controllo sostituzioni in background:', error);
  }
}

self.addEventListener('notificationclick', function(event) {
	event.notification.close();
	
	if (event.notification.data && event.notification.data.url) {
		event.waitUntil(
			clients.openWindow(event.notification.data.url)
		);
	}
});
