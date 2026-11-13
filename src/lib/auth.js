import { userEmail, currentUser, authStatus, authError } from './stores.js';
import { cleanupPersonalSubstitutions } from './personalSubstitutions.js';
import { canEditInternalTimetable, checkTeacherHasSubsubjects } from './internalTimetable.js';
import { clearNotifiedSubstitutions, clearUserFromServiceWorker } from './notifications.js';

/**
 * Risolve l'URL di base per le API di autenticazione condivise con OrarioLSC.
 * Predefinito: /app/orario/api/v1 (Same-Origin).
 */
export function getAuthApiBase() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AUTH_API_BASE) {
    return import.meta.env.VITE_AUTH_API_BASE.replace(/\/+$/, '');
  }
  return '/app/orario/api/v1';
}

/**
 * 1. VERIFICARE SE L'UTENTE È AUTENTICATO
 * GET /app/orario/api/v1/auth/session
 * credentials: 'same-origin', cache: 'no-store'
 *
 * - HTTP 200: utente autenticato. JSON con user.displayName e user.email, oltre al profilo.
 * - HTTP 401: utente non autenticato; mostra "Accedi con Google".
 * - HTTP 403: accesso non autorizzato.
 * - Errori di rete o HTTP 5xx: mostra un errore temporaneo, senza interpretarli come logout.
 */
export async function checkSession(customFetch = fetch) {
  authStatus.set('loading');
  try {
    const url = `${getAuthApiBase()}/auth/session`;
    const response = await customFetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      const user = data.user || null;
      currentUser.set(user);
      if (user?.email) {
        userEmail.set(user.email);
      }
      authStatus.set('authenticated');
      authError.set(null);
      if (typeof window !== 'undefined') {
        try {
          checkTeacherHasSubsubjects().catch(() => {});
        } catch (e) {}
      }
      return { authenticated: true, user };
    }

    if (response.status === 401) {
      currentUser.set(null);
      userEmail.set(null);
      authStatus.set('unauthenticated');
      authError.set(null);
      cleanupPersonalSubstitutions();
      canEditInternalTimetable.set(false);
      return { authenticated: false };
    }

    if (response.status === 403) {
      let message = 'Accesso non autorizzato.';
      try {
        const data = await response.json();
        if (data.message) message = data.message;
      } catch (e) {}
      authStatus.set('forbidden');
      authError.set(message);
      return { authenticated: false, forbidden: true, message };
    }

    // Errori HTTP 5xx o altri: errore temporaneo, NON interpretare come logout
    let message = `Errore temporaneo del server (${response.status}).`;
    try {
      const data = await response.json();
      if (data.message) message = data.message;
    } catch (e) {}
    authStatus.set('error');
    authError.set(message);
    return { authenticated: false, error: true, message };
  } catch (err) {
    // Errore di rete: non interpretare come logout
    const message = err.message || 'Errore di connessione temporaneo.';
    authStatus.set('error');
    authError.set(message);
    return { authenticated: false, networkError: true, message };
  }
}

/**
 * 2. EFFETTUARE IL LOGIN
 * Invia il valore credential restituito da Google (ID token):
 * POST /app/orario/api/v1/auth/google
 * credentials: 'same-origin', body: { credential }
 *
 * - HTTP 200: il backend imposta il cookie e restituisce { user: ... }. Aggiorna user.displayName e user.email.
 * - HTTP 401: credenziale Google non valida.
 * - HTTP 403: account non autorizzato.
 *
 * Non inviare un access token Google al posto dell'ID token. Non conservare la credenziale Google dopo lo scambio.
 */
export async function loginWithGoogle(credential, customFetch = fetch) {
  if (!credential) {
    throw new Error('Credenziale Google mancante.');
  }

  authError.set(null);
  const url = `${getAuthApiBase()}/auth/google`;
  const response = await customFetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  if (response.status === 200) {
    const data = await response.json();
    const user = data.user || null;
    currentUser.set(user);
    if (user?.email) {
      userEmail.set(user.email);
    }
    authStatus.set('authenticated');
    authError.set(null);
    if (typeof window !== 'undefined') {
      try {
        checkTeacherHasSubsubjects().catch(() => {});
      } catch (e) {}
    }
    return { success: true, user };
  }

  let errorData = {};
  try {
    errorData = await response.json();
  } catch (e) {}

  let message = errorData.message;
  if (!message) {
    if (response.status === 401) {
      message = 'Credenziale Google non valida o scaduta.';
    } else if (response.status === 403) {
      message = 'Account Google non autorizzato.';
    } else {
      message = `Errore di autenticazione (${response.status}).`;
    }
  }

  if (response.status === 403) {
    authStatus.set('forbidden');
  } else {
    authStatus.set('unauthenticated');
  }
  authError.set(message);

  const error = new Error(message);
  error.status = response.status;
  error.data = errorData;
  throw error;
}

/**
 * 4. EFFETTUARE IL LOGOUT
 * DELETE /app/orario/api/v1/auth/session
 * credentials: 'same-origin'
 *
 * HTTP 204 conferma il logout: il backend revoca la sessione e cancella il cookie.
 * Dopo il successo:
 * - cancella profilo e dati personali dalla memoria dell'app;
 * - interrompi il polling delle notifiche;
 * - mostra "Accedi con Google";
 * - se usi Google Identity Services, chiama google.accounts.id.disableAutoSelect().
 *
 * Non considerare riuscito il logout se la richiesta fallisce: mostra un errore e consenti di riprovare.
 */
export async function logout(customFetch = fetch) {
  const url = `${getAuthApiBase()}/auth/session`;
  const response = await customFetch(url, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (response.status === 204 || response.status === 200) {
    currentUser.set(null);
    userEmail.set(null);
    authStatus.set('unauthenticated');
    authError.set(null);
    canEditInternalTimetable.set(false);

    cleanupPersonalSubstitutions();
    clearNotifiedSubstitutions();
    clearUserFromServiceWorker();

    if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {
        console.warn('Errore google disableAutoSelect:', e);
      }
    }

    return { success: true };
  }

  let errorData = {};
  try {
    errorData = await response.json();
  } catch (e) {}

  const message = errorData.message || `Disconnessione non riuscita (HTTP ${response.status}).`;
  const error = new Error(message);
  error.status = response.status;
  error.data = errorData;
  throw error;
}

/**
 * Gestisce la risposta 401 su qualsiasi API autenticata.
 * Elimina i dati personali e reimposta lo stato su non autenticato.
 */
export function handleAuth401() {
  currentUser.set(null);
  userEmail.set(null);
  authStatus.set('unauthenticated');
  cleanupPersonalSubstitutions();
  canEditInternalTimetable.set(false);
}
