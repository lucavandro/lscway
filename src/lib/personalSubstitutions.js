import { writable } from "svelte/store";
import { userEmail } from "./stores.js";
import {
  checkSubstitutionsForNotifications,
  clearNotifiedSubstitutions,
} from "./notifications.js";
import { handleAuth401 } from "./auth.js";

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
    if (response.status === 401) {
      try {
        handleAuth401();
      } catch (e) {}
    }

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
 * Estrae un timestamp numerico confrontabile per una sostituzione.
 * Combina data evento (o pubblicataIl), ora/timeSlotId e pubblicataIl come tie-breaker.
 */
export function getSubstitutionTimestamp(sub) {
  if (!sub || typeof sub !== "object") return 0;

  let timestamp = 0;

  // 1. Prova a ricavare la data principale dell'evento
  const dateStr = sub.data || sub.date;
  if (dateStr) {
    if (typeof dateStr === "string") {
      const trimmed = dateStr.trim();
      const partsYMD = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      const partsDMY = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);

      if (partsYMD) {
        timestamp = new Date(
          Number(partsYMD[1]),
          Number(partsYMD[2]) - 1,
          Number(partsYMD[3])
        ).getTime();
      } else if (partsDMY) {
        timestamp = new Date(
          Number(partsDMY[3]),
          Number(partsDMY[2]) - 1,
          Number(partsDMY[1])
        ).getTime();
      } else {
        const parsed = Date.parse(trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`);
        if (!isNaN(parsed)) {
          timestamp = parsed;
        }
      }
    } else if (dateStr instanceof Date) {
      timestamp = dateStr.getTime();
    } else if (typeof dateStr === "number") {
      timestamp = dateStr;
    }
  }

  // 2. Se non presente la data evento, fallback su pubblicataIl
  if (!timestamp && sub.pubblicataIl) {
    const pubParsed = Date.parse(sub.pubblicataIl);
    if (!isNaN(pubParsed)) {
      timestamp = pubParsed;
    }
  }

  // 3. Aggiungi l'offset orario per ordinare correttamente all'interno dello stesso giorno
  let timeOffsetMs = 0;
  if (sub.ora) {
    const timeMatch = String(sub.ora).match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      timeOffsetMs = (Number(timeMatch[1]) * 60 + Number(timeMatch[2])) * 60 * 1000;
    } else {
      const romanMatch = String(sub.ora).toUpperCase().match(/\b(VIII|VII|VI|IV|III|II|V|I)\b/);
      if (romanMatch) {
        const romanSlots = {
          I: 8 * 60,
          II: 8 * 60 + 55,
          III: 9 * 60 + 50,
          IV: 10 * 60 + 45,
          V: 11 * 60 + 40,
          VI: 12 * 60 + 35,
          VII: 13 * 60 + 30,
          VIII: 14 * 60 + 25,
        };
        const minutes = romanSlots[romanMatch[1]] || 0;
        timeOffsetMs = minutes * 60 * 1000;
      }
    }
  } else if (sub.timeSlotId) {
    const slotNum = Number(sub.timeSlotId);
    if (!isNaN(slotNum) && slotNum >= 1 && slotNum <= 8) {
      const slotMinutes = [0, 480, 535, 590, 645, 700, 755, 810, 865];
      timeOffsetMs = (slotMinutes[slotNum] || slotNum * 60) * 60 * 1000;
    }
  }

  return timestamp + timeOffsetMs;
}

/**
 * Ordina un array di sostituzioni dalla più recente alla più vecchia.
 * Non modifica l'array originale (restituisce una copia ordinata).
 */
export function sortSubstitutionsRecentFirst(substitutions) {
  if (!Array.isArray(substitutions)) return [];

  return [...substitutions].sort((a, b) => {
    const timeA = getSubstitutionTimestamp(a);
    const timeB = getSubstitutionTimestamp(b);

    if (timeA !== timeB) {
      return timeB - timeA; // Discendente: più recente prima
    }

    // Tie-breaker 1: pubblicataIl
    const pubA = a?.pubblicataIl ? Date.parse(a.pubblicataIl) || 0 : 0;
    const pubB = b?.pubblicataIl ? Date.parse(b.pubblicataIl) || 0 : 0;
    if (pubA !== pubB) {
      return pubB - pubA;
    }

    // Tie-breaker 2: id discendente
    const idA = Number(a?.id);
    const idB = Number(b?.id);
    if (!isNaN(idA) && !isNaN(idB) && idA !== idB) {
      return idB - idA;
    }
    if (a?.id && b?.id && a.id !== b.id) {
      return String(b.id).localeCompare(String(a.id));
    }

    return 0;
  });
}

/**
 * Recupera l'elenco delle proprie sostituzioni pubblicate.
 * Restituisce i dati con le sostituzioni ordinate dalla più recente alla più vecchia.
 * GET /me/substitutions
 */
export async function fetchPersonalSubstitutions(customFetch) {
  const data = await personalSubstitutionsRequest("/me/substitutions", { method: "GET" }, customFetch);
  if (data && Array.isArray(data.substitutions)) {
    data.substitutions = sortSubstitutionsRecentFirst(data.substitutions);
  }
  return data;
}

/**
 * Recupera le notifiche personali e il numero di quelle non confermate.
 * Restituisce i dati con gli elementi ordinati dalla più recente alla più vecchia.
 * GET /me/notifications
 */
export async function fetchPersonalNotifications(customFetch) {
  const data = await personalSubstitutionsRequest("/me/notifications", { method: "GET" }, customFetch);
  if (data && Array.isArray(data.items)) {
    data.items = sortSubstitutionsRecentFirst(data.items);
  }
  return data;
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
