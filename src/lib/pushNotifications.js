import { writable, get } from 'svelte/store';
import { userEmail, notificationPermission, notificationsEnabled } from './stores.js';
import { handleAuth401 } from './auth.js';
import { sortSubstitutionsRecentFirst } from './personalSubstitutions.js';

const STORAGE_KEY_ENDPOINT = 'lscway_push_endpoint';
const STORAGE_KEY_SUBSCRIBED = 'lscway_push_subscribed';

/**
 * Converte una chiave VAPID pubblica in formato Base64URL in Uint8Array
 * utilizzabile dal PushManager del browser.
 */
export function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('Chiave VAPID non valida o vuota.');
  }
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Confronta due buffer binari (ArrayBuffer o Uint8Array) byte a byte.
 */
export function areKeysEqual(buf1, buf2) {
  if (!buf1 || !buf2) return false;
  const a = buf1 instanceof Uint8Array ? buf1 : new Uint8Array(buf1);
  const b = buf2 instanceof Uint8Array ? buf2 : new Uint8Array(buf2);
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Verifica se il browser supporta le API necessarie per le notifiche Web Push.
 */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Rileva se il dispositivo corrente è iOS / iPadOS (iPhone o iPad).
 */
export function detectIosPlatform() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIosDevice = /iPad|iPhone|iPod/.test(ua);
  const isMacWithTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return Boolean(isIosDevice || isMacWithTouch);
}

/**
 * Rileva se la PWA è avviata in modalità standalone (aggiunta alla Home).
 */
export function detectStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.navigator?.standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)')?.matches)
  );
}

/**
 * Risolve l'URL base per le API push di OrarioLSC.
 * Predefinito: /app/orario/api/v1 (Same-Origin).
 */
export function getPushApiBase() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_PUSH_API_BASE) {
      return import.meta.env.VITE_PUSH_API_BASE.replace(/\/+$/, '');
    }
    if (import.meta.env.VITE_PERSONAL_SUBSTITUTIONS_API_BASE) {
      return import.meta.env.VITE_PERSONAL_SUBSTITUTIONS_API_BASE.replace(/\/+$/, '');
    }
  }
  return '/app/orario/api/v1';
}

/**
 * Esegue una richiesta HTTP autenticata verso le API push di OrarioLSC.
 */
export async function pushApiRequest(endpoint, options = {}, customFetch) {
  const fetchFn =
    customFetch ||
    (typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : fetch);

  if (typeof fetchFn !== 'function') {
    throw new Error('Funzione fetch non disponibile.');
  }

  const base = getPushApiBase();
  const url = `${base}${endpoint}`;

  let credentials = 'same-origin';
  if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.origin !== window.location.origin) {
        credentials = 'include';
      }
    } catch (e) {}
  }

  const defaultHeaders = {
    Accept: 'application/json',
  };
  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetchFn(url, {
    credentials,
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      try {
        handleAuth401();
      } catch (e) {}
    }

    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {}

    let message = errorData.message || errorData.error;
    if (!message) {
      switch (response.status) {
        case 401:
          message = 'Sessione assente o scaduta. Effettua nuovamente l\'accesso.';
          break;
        case 403:
          message = 'Profilo docente non autorizzato per le notifiche push.';
          break;
        case 404:
          message = 'Risorsa o sottoscrizione push non trovata.';
          break;
        case 422:
          message = 'Dati di sottoscrizione non validi.';
          break;
        default:
          message = `Errore di comunicazione con il server push (${response.status}).`;
      }
    }

    const err = new Error(message);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  if (response.status === 204) {
    return { success: true };
  }

  try {
    return await response.json();
  } catch (e) {
    return { success: true };
  }
}

/**
 * 1. GET /me/push-config
 * Restituisce { configured: boolean, publicKey: string, subscribed?: boolean }
 */
export async function fetchPushConfig(customFetch) {
  return pushApiRequest('/me/push-config', { method: 'GET' }, customFetch);
}

/**
 * 2. POST /me/push-subscription
 * Invia il risultato di PushSubscription.toJSON()
 */
export async function registerPushSubscriptionOnServer(subscriptionData, customFetch) {
  return pushApiRequest(
    '/me/push-subscription',
    {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    },
    customFetch
  );
}

/**
 * 3. DELETE /me/push-subscription
 * Invia { endpoint: "..." }
 */
export async function unregisterPushSubscriptionOnServer(endpoint, customFetch) {
  return pushApiRequest(
    '/me/push-subscription',
    {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    },
    customFetch
  );
}

/**
 * 4. GET /me/push-substitutions
 * Restituisce le sostituzioni pubblicate del docente autenticato.
 */
export async function fetchPushSubstitutions(customFetch) {
  const data = await pushApiRequest('/me/push-substitutions', { method: 'GET' }, customFetch);
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && Array.isArray(data.substitutions)) {
    list = data.substitutions;
  } else if (data && Array.isArray(data.items)) {
    list = data.items;
  }
  return {
    raw: data,
    teacherName: data?.teacherName || '',
    teacherEmail: data?.teacherEmail || '',
    substitutions: sortSubstitutionsRecentFirst(list),
  };
}

/**
 * Store reattivo per lo stato della sottoscrizione Web Push.
 */
export const pushSubscriptionStore = writable({
  supported: false,
  permission: 'default', // 'default' | 'granted' | 'denied'
  subscribed: false,     // registrato con successo nel browser e confermato sul server
  endpoint: null,
  loading: false,
  error: null,
  success: null,
  serverConfigured: false,
  publicKey: null,
  isIos: false,
  isStandalone: false,
});

/**
 * Memorizza localmente l'endpoint attivo dell'utente.
 */
function setStoredPushEndpoint(endpoint) {
  if (typeof localStorage !== 'undefined') {
    if (endpoint) {
      localStorage.setItem(STORAGE_KEY_ENDPOINT, endpoint);
      localStorage.setItem(STORAGE_KEY_SUBSCRIBED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_ENDPOINT);
      localStorage.removeItem(STORAGE_KEY_SUBSCRIBED);
    }
  }
}

/**
 * Recupera l'endpoint push memorizzato localmente.
 */
export function getStoredPushEndpoint() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_ENDPOINT);
  }
  return null;
}

/**
 * Inizializza o aggiorna lo stato locale delle notifiche push senza mostrare prompt di autorizzazione.
 */
export async function checkPushStatus(customFetch) {
  const supported = isPushSupported();
  const isIos = detectIosPlatform();
  const isStandalone = detectStandaloneMode();
  const currentPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

  pushSubscriptionStore.update((state) => ({
    ...state,
    supported,
    isIos,
    isStandalone,
    permission: currentPermission,
  }));

  if (!supported) return;

  try {
    let browserSub = null;
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.pushManager) {
        browserSub = await reg.pushManager.getSubscription();
      }
    }

    // Se l'utente è loggato, possiamo opzionalmente controllare la config del server
    const email = get(userEmail);
    let serverConfig = null;
    if (email) {
      try {
        serverConfig = await fetchPushConfig(customFetch);
      } catch (e) {
        // Se 401 o non configurato, continuiamo senza bloccare l'interfaccia
      }
    }

    const isSubscribedLocally = Boolean(browserSub);
    const serverSubscribed = Boolean(serverConfig?.subscribed);
    const isSubscribed = isSubscribedLocally || serverSubscribed;

    pushSubscriptionStore.update((state) => ({
      ...state,
      permission: typeof Notification !== 'undefined' ? Notification.permission : currentPermission,
      subscribed: isSubscribed,
      endpoint: browserSub ? browserSub.endpoint : getStoredPushEndpoint(),
      serverConfigured: Boolean(serverConfig?.configured),
      publicKey: serverConfig?.publicKey || state.publicKey,
    }));
  } catch (err) {
    console.warn('[Push] Errore verifica stato:', err);
  }
}

/**
 * Attiva le notifiche Web Push su questo dispositivo (azione esplicita su click utente).
 */
export async function subscribeToPush(customFetch) {
  if (!isPushSupported()) {
    const errorMsg = 'Questo browser non supporta le notifiche Web Push.';
    pushSubscriptionStore.update((s) => ({ ...s, error: errorMsg, loading: false }));
    throw new Error(errorMsg);
  }

  pushSubscriptionStore.update((s) => ({ ...s, loading: true, error: null, success: null }));

  try {
    // 1. Richiedi permesso al browser (deve essere generato da un click utente)
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';
    notificationPermission.set(isGranted);

    pushSubscriptionStore.update((s) => ({
      ...s,
      permission,
    }));

    if (!isGranted) {
      const msg =
        permission === 'denied'
          ? 'I permessi per le notifiche sono stati bloccati nel browser. Modificali nelle impostazioni del sito o del browser.'
          : 'Permesso per le notifiche non concesso.';
      pushSubscriptionStore.update((s) => ({ ...s, loading: false, error: msg }));
      throw new Error(msg);
    }

    // 2. Recupera la configurazione VAPID dal backend
    const config = await fetchPushConfig(customFetch);
    if (!config || !config.configured || !config.publicKey) {
      const msg = 'Il backend OrarioLSC non ha ancora configurato le chiavi VAPID per le notifiche push.';
      pushSubscriptionStore.update((s) => ({
        ...s,
        loading: false,
        error: msg,
        serverConfigured: false,
      }));
      throw new Error(msg);
    }

    pushSubscriptionStore.update((s) => ({
      ...s,
      serverConfigured: true,
      publicKey: config.publicKey,
    }));

    // 3. Attendi il service worker
    const registration = await navigator.serviceWorker.ready;
    if (!registration || !registration.pushManager) {
      throw new Error('Service Worker o PushManager non disponibili.');
    }

    // 4. Verifica sottoscrizione browser esistente
    let subscription = await registration.pushManager.getSubscription();
    const targetKeyArray = urlBase64ToUint8Array(config.publicKey);

    if (subscription) {
      // Verifica se la chiave VAPID corrisponde
      const existingKey = subscription.options?.applicationServerKey;
      const keyMatches = existingKey ? areKeysEqual(existingKey, targetKeyArray) : true;

      if (!keyMatches) {
        // Chiave pubblica cambiata: rimuovi la vecchia sottoscrizione
        try {
          await subscription.unsubscribe();
        } catch (e) {
          console.warn('[Push] Errore unsubscribe vecchia chiave:', e);
        }
        subscription = null;
      }
    }

    // 5. Crea una nuova sottoscrizione se non presente
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: targetKeyArray,
      });
    }

    // 6. Registra la sottoscrizione sul backend OrarioLSC
    const subJSON = subscription.toJSON();
    try {
      await registerPushSubscriptionOnServer(subJSON, customFetch);
    } catch (serverErr) {
      // Rollback: se il server rifiuta la registrazione, annulla la sottoscrizione nel browser
      // per evitare di mostrare falsamente l'attivazione riuscita
      try {
        await subscription.unsubscribe();
      } catch (rollbackErr) {
        console.warn('[Push] Errore durante rollback unsubscribe:', rollbackErr);
      }
      setStoredPushEndpoint(null);
      pushSubscriptionStore.update((s) => ({
        ...s,
        loading: false,
        subscribed: false,
        endpoint: null,
        error: `Registrazione sul server non riuscita: ${serverErr.message || serverErr}`,
      }));
      throw serverErr;
    }

    // 7. Successo
    setStoredPushEndpoint(subscription.endpoint);
    notificationsEnabled.set(true);

    pushSubscriptionStore.update((s) => ({
      ...s,
      loading: false,
      subscribed: true,
      endpoint: subscription.endpoint,
      error: null,
      success: 'Notifiche Web Push attivate con successo su questo dispositivo!',
    }));

    return subscription;
  } catch (err) {
    pushSubscriptionStore.update((s) => ({
      ...s,
      loading: false,
      error: err.message || 'Errore durante l\'attivazione delle notifiche.',
    }));
    throw err;
  }
}

/**
 * Disattiva le notifiche Web Push su questo dispositivo.
 */
export async function unsubscribeFromPush(customFetch) {
  pushSubscriptionStore.update((s) => ({ ...s, loading: true, error: null, success: null }));

  try {
    let endpoint = getStoredPushEndpoint();
    let subscription = null;

    if (isPushSupported() && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.pushManager) {
          subscription = await registration.pushManager.getSubscription();
          if (subscription && subscription.endpoint) {
            endpoint = subscription.endpoint;
          }
        }
      } catch (e) {
        console.warn('[Push] Errore lettura pushManager al logout:', e);
      }
    }

    // 1. Rimuovi la registrazione dal server OrarioLSC
    if (endpoint) {
      try {
        await unregisterPushSubscriptionOnServer(endpoint, customFetch);
      } catch (err) {
        console.warn('[Push] Avviso durante unregister sul server:', err);
        // Anche in caso di errore server (es. 404 o 401), continuiamo con la disattivazione locale
      }
    }

    // 2. Annulla la sottoscrizione nel browser
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (err) {
        console.warn('[Push] Avviso durante unsubscribe del browser:', err);
      }
    }

    // 3. Pulisci stato locale
    setStoredPushEndpoint(null);
    notificationsEnabled.set(false);

    pushSubscriptionStore.update((s) => ({
      ...s,
      loading: false,
      subscribed: false,
      endpoint: null,
      error: null,
      success: 'Notifiche Web Push disattivate per questo dispositivo.',
    }));

    return true;
  } catch (err) {
    pushSubscriptionStore.update((s) => ({
      ...s,
      loading: false,
      error: err.message || 'Errore durante la disattivazione delle notifiche.',
    }));
    throw err;
  }
}

/**
 * Pulisce lo stato locale delle notifiche al logout o alla scadenza sessione.
 */
export function handleLogoutPushCleanup() {
  setStoredPushEndpoint(null);
  pushSubscriptionStore.update((s) => ({
    ...s,
    subscribed: false,
    endpoint: null,
    loading: false,
    error: null,
    success: null,
  }));
}
