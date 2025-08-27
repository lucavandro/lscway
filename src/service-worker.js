// This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const CACHE = "lscway-cache";
let userEmail = null;
let notifiedSubstitutions = new Set();
let checkInterval = null;

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
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
    
    // Gestisci l'intervallo di controllo
    if (userEmail) {
      startPeriodicCheck();
    } else {
      stopPeriodicCheck();
    }
  }
});

function startPeriodicCheck() {
  if (checkInterval) return; // Evita intervalli multipli
  
  checkInterval = setInterval(() => {
    if (userEmail) {
      checkSubstitutionsInBackground();
    }
  }, 60000); // Ogni 60 secondi
}

function stopPeriodicCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => {
        try {
          cache.add(offlineFallbackPage)
        } catch (error) {
          console.log("⛔ Failed to add offline fallback page to cache")
        }
      })
  );
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

self.addEventListener('fetch', (event) => {
  console.log(event)
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {

        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});

// Gestione del background sync
self.addEventListener('sync', function(event) {
  if (event.tag === 'check-substitutions') {
    event.waitUntil(checkSubstitutionsInBackground());
  }
});

async function checkSubstitutionsInBackground() {
  // Verifica che l'utente sia loggato
  if (!userEmail) {
    console.log('Service Worker: Nessun utente loggato, skip controllo sostituzioni');
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
