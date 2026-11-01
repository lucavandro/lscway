import { writable } from "svelte/store";

const STORAGE_KEY = "lscway_can_edit_internal_timetable";

/**
 * Risolve l'URL di base per le API dell'orario interno.
 * In produzione usa il percorso relativo sul medesimo dominio (/app/orario/api/v1),
 * mentre in locale o test permette override tramite VITE_INTERNAL_TIMETABLE_API_BASE o VITE_API_URL.
 */
export function getInternalTimetableApiBase() {
  if (typeof import.meta !== "undefined" && import.meta.env) {
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
 * Esegue una chiamata fetch autenticata verso le API dell'orario interno.
 * Include il cookie di sessione HTTP orariolsc_session e gestisce errori strutturati (401, 403, 409, 422).
 */
export async function internalTimetableRequest(endpoint, options = {}, customFetch) {
  const fetchFn =
    customFetch ||
    (typeof window !== "undefined" && window.fetch ? window.fetch.bind(window) : fetch);

  if (typeof fetchFn !== "function") {
    throw new Error("Funzione fetch non disponibile nell'ambiente corrente.");
  }

  const base = getInternalTimetableApiBase();
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

    const message =
      errorData.message ||
      (errorData.error ? `Errore: ${errorData.error}` : `Errore HTTP ${response.status}`);
    const error = new Error(message);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

export const internalTimetableApi = {
  loginWithGoogle: (credential, customFetch) =>
    internalTimetableRequest(
      "/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ credential }),
      },
      customFetch
    ),

  getSession: (customFetch) =>
    internalTimetableRequest("/auth/session", { method: "GET" }, customFetch),

  getInternalTimetable: (customFetch) =>
    internalTimetableRequest("/me/internal-timetable", { method: "GET" }, customFetch),

  assignSubsubject: (lessonId, subsubjectId, revision, customFetch) =>
    internalTimetableRequest(
      `/me/internal-timetable/${encodeURIComponent(lessonId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          subsubjectId: subsubjectId || null,
          revision,
        }),
      },
      customFetch
    ),
};

function getInitialCanEdit() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch (e) {
    return false;
  }
}

export const canEditInternalTimetable = writable(getInitialCanEdit());

if (typeof window !== "undefined") {
  canEditInternalTimetable.subscribe((val) => {
    try {
      if (val) {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  });
}

/**
 * Determina se nella lista delle materie ne esiste almeno una che ammette sottomaterie.
 */
export function hasAdmitsSubsubjects(subjects) {
  if (!Array.isArray(subjects)) return false;
  return subjects.some(
    (s) =>
      Boolean(s.admitsSubsubjects) &&
      Array.isArray(s.subsubjectIds) &&
      s.subsubjectIds.length > 0
  );
}

/**
 * Interroga l'API per verificare se il docente loggato possiede materie che ammettono sottomaterie.
 * Aggiorna lo store `canEditInternalTimetable`.
 */
export async function checkTeacherHasSubsubjects(customFetch) {
  if (typeof window === "undefined") return false;
  try {
    const data = await internalTimetableApi.getInternalTimetable(customFetch);
    const hasAny = hasAdmitsSubsubjects(data?.subjects);
    canEditInternalTimetable.set(hasAny);
    return hasAny;
  } catch (err) {
    if (err && (err.status === 401 || err.status === 403)) {
      canEditInternalTimetable.set(false);
    }
    return false;
  }
}
