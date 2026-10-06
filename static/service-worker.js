// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE_VERSION = "v2026-10-06-4";
const CACHE = `lscway-cache-${CACHE_VERSION}`;
let userEmail = null;
let notificationsEnabled = true;
let notifiedSubstitutions = new Set();
let checkInterval = null;

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (typeof workbox !== 'undefined') {
  workbox.setConfig({ debug: false });
}

const offlineFallbackPage = "offline";

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
  "eastereggs/500.gif",
  "500",
  "500.html"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          try {
            await cache.add(new Request(asset, { cache: 'reload' }));
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
      // Elimina tutte le cache delle versioni precedenti (es. "lscway-cache" non versionata)
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

const isDevModuleRequest = (url) =>
  url.pathname.includes('/@vite/') ||
  url.pathname.includes('/@fs/') ||
  url.pathname.includes('/node_modules/') ||
  url.pathname.includes('/src/') ||
  url.pathname.includes('/.svelte-kit/');

// NetworkFirst con cache: 'no-cache' per garantire che online vengano sempre
// scaricate le versioni aggiornate di HTML, CSS, JS e icone senza pescare dalla cache HTTP stantia
const networkFirstStrategy = new workbox.strategies.NetworkFirst({
  cacheName: CACHE,
  fetchOptions: {
    cache: 'no-cache'
  }
});

// Gestione navigazione pagina con fallback su offlineFallbackPage
workbox.routing.registerRoute(
  ({ request, url }) => request.mode === 'navigate' && !isDevModuleRequest(url),
  async (params) => {
    try {
      const response = await networkFirstStrategy.handle(params);
      if (response) return response;
    } catch (error) {
      // Ignora e passa al fallback offline
    }
    const cache = await caches.open(CACHE);
    return (await cache.match(offlineFallbackPage)) || Response.error();
  }
);

// Tutte le altre risorse statiche, CSS, icone e API (esclusi moduli dev di Vite)
workbox.routing.registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    request.mode !== 'navigate' &&
    !isDevModuleRequest(url),
  networkFirstStrategy
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
