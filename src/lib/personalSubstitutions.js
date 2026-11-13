import { writable } from "svelte/store";
import { userEmail } from "./stores.js";
import {
  checkSubstitutionsForNotifications,
  clearNotifiedSubstitutions,
} from "./notifications.js";

/**
 * Risolve l'URL di base per le API delle sostituzioni personali del docente.
 * In produzione usa il percorso relativo sul medesimo dominio (/app/orario/api/v1),
 * mentre in locale o test permette override tramite variabili d'ambiente.
 */
export function getPersonalSubstitutionsApiBase() {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    if (import.meta.env.VITE_PERSONAL_SUBSTITUTIONS_API_BASE) {
      return import.meta.env.VITE_PERSONAL_SUBSTITUTIONS_API_BASE.replace(/\/+$/, "");
    }
    if (import.meta.env.VITE_INTERNAL_TIMETABLE_API_BASE) {
      return import.meta.env.VITE_INTERNAL_TIMETABLE_API_BASE.replace(/\/+$/, "");
    }
    const apiUrl = import.meta.env.VITE_API_URL || "";
    if (apiUrl.includes("/app/orario/api/v1")) {
      if (typeof window !== "undefined") {
        try {
          const parsed = new URL(apiUrl, window.location.href);
          if (parsed.origin === window.location.origin) {
            return "/app/orario/api/v1";
          }
          return `${parsed.origin}/app/orario/api/v1`;
        } catch (e) {}
      }
      return apiUrl.split("/public/orario")[0];
    }
  }
  return "/app/orario/api/v1";
}

/**
 * Esegue una chiamata fetch verso le API delle sostituzioni personali.
 * Include il cookie di sessione HTTP (orariolsc_session) e gestisce errori 401, 403, 404, 422.
 */
export async function personalSubstitutionsRequest(endpoint, options = {}, customFetch) {
  const fetchFn =
    customFetch ||
    (typeof window !== "undefined" && window.fetch ? window.fetch.bind(window) : fetch);

  if (typeof fetchFn !== "function") {
    throw new Error("Funzione fetch non disponibile nell'ambiente corrente.");
  }

  const base = getPersonalSubstitutionsApiBase();
  const url = `${base}${endpoint}`;

  let credentials = "same-origin";
  if (typeof window !== "undefined") {
    try {
      const parsed = new URL(url, window.location.href);
      if (parsed.origin !== window.location.origin) {
        credentials = "include";
      }
    } catch (e) {}
  }

  const defaultHeaders = {
    Accept: "application/json",
  };
  if (options.body && typeof options.body === "string") {
    defaultHeaders["Content-Type"] = "application/json";
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
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {}

    let message = errorData.message;
    if (!message) {
      if (
        errorData.error &&
        typeof errorData.error === "string" &&
        !["unauthorized", "forbidden", "not_found", "invalid_request"].includes(errorData.error)
      ) {
        message = errorData.error;
      } else {
        switch (response.status) {
          case 401:
            message = "Sessione assente o scaduta. Effettua nuovamente l'accesso.";
            break;
          case 403:
            message = "Nessun docente attivo associato univocamente all'email della sessione.";
            break;
          case 404:
            message = "Sostituzione inesistente, altrui o non più pubblicata.";
            break;
          case 422:
            message = "Richiesta non valida.";
            break;
          default:
            message = `Errore di comunicazione con il server (${response.status})`;
        }
      }
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

/**
 * Recupera l'elenco delle proprie sostituzioni pubblicate.
 * GET /me/substitutions
 */
export async function fetchPersonalSubstitutions(customFetch) {
  return personalSubstitutionsRequest("/me/substitutions", { method: "GET" }, customFetch);
}

/**
 * Recupera le notifiche personali e il numero di quelle non confermate.
 * GET /me/notifications
 */
export async function fetchPersonalNotifications(customFetch) {
  return personalSubstitutionsRequest("/me/notifications", { method: "GET" }, customFetch);
}

/**
 * Registra la presa visione di una sostituzione personale.
 * POST /me/substitutions/{id}/acknowledgment con corpo {}
 */
export async function acknowledgeSubstitution(id, customFetch) {
  return personalSubstitutionsRequest(
    `/me/substitutions/${encodeURIComponent(id)}/acknowledgment`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    customFetch
  );
}

/**
 * Store reattivo per il numero di sostituzioni senza presa visione.
 */
export const unreadSubstitutionsCount = writable(0);

/**
 * Store per la cache e lo stato delle sostituzioni personali del docente.
 */
export const personalSubstitutionsStore = writable({
  teacherName: "",
  teacherEmail: "",
  substitutions: [],
  loaded: false,
  error: null,
});

let pollingTimer = null;
let isPollingInFlight = false;

/**
 * Esegue un singolo ciclo di polling delle notifiche personali evitando chiamate sovrapposte.
 */
export async function pollPersonalNotifications(customFetch) {
  if (isPollingInFlight) return null;
  isPollingInFlight = true;

  try {
    const data = await fetchPersonalNotifications(customFetch);
    if (data && typeof data.unreadCount === "number") {
      unreadSubstitutionsCount.set(data.unreadCount);
    }
    if (data && Array.isArray(data.items)) {
      personalSubstitutionsStore.update((prev) => ({
        ...prev,
        substitutions: data.items,
        loaded: true,
        error: null,
      }));
      checkSubstitutionsForNotifications(data.items);
    }
    return data;
  } catch (err) {
    if (err && (err.status === 401 || err.status === 403)) {
      cleanupPersonalSubstitutions();
    }
    throw err;
  } finally {
    isPollingInFlight = false;
  }
}

/**
 * Avvia il polling periodico ogni 60 secondi.
 */
export function startPersonalSubstitutionsPolling(customFetch) {
  stopPersonalSubstitutionsPolling();

  // Esegui subito una prima richiesta
  pollPersonalNotifications(customFetch).catch(() => {});

  pollingTimer = setInterval(() => {
    pollPersonalNotifications(customFetch).catch(() => {});
  }, 60000);
}

/**
 * Arresta l'intervallo di polling.
 */
export function stopPersonalSubstitutionsPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

/**
 * Ripulisce dati personali, store e timer (ad esempio al logout).
 */
export function cleanupPersonalSubstitutions() {
  stopPersonalSubstitutionsPolling();
  unreadSubstitutionsCount.set(0);
  personalSubstitutionsStore.set({
    teacherName: "",
    teacherEmail: "",
    substitutions: [],
    loaded: false,
    error: null,
  });
  clearNotifiedSubstitutions();
}

/**
 * Aggiorna localmente lo stato di presa visione di una sostituzione confermata.
 */
export function markSubstitutionAcknowledgedLocally(id) {
  personalSubstitutionsStore.update((state) => {
    const nowIso = new Date().toISOString();
    const updated = state.substitutions.map((sub) => {
      if (String(sub.id) === String(id)) {
        return {
          ...sub,
          presaVisione: {
            ...(sub.presaVisione || {}),
            stato: "presa_visione",
            data: sub.presaVisione?.data || nowIso,
          },
        };
      }
      return sub;
    });

    const unread = updated.filter((s) => !s.presaVisione?.data).length;
    unreadSubstitutionsCount.set(unread);

    return {
      ...state,
      substitutions: updated,
    };
  });
}

// Ascolta cambiamenti di sessione su browser per ripulire al logout
if (typeof window !== "undefined") {
  userEmail.subscribe((email) => {
    if (!email) {
      cleanupPersonalSubstitutions();
    }
  });
}
