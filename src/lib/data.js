import { userEmail, timetableData } from "./stores";


function decodeGoogleJwt(token) {
    const parts = token.split(".");
    if (parts.length < 2) {
        throw new Error("Il token Google non è valido.");
    }

    const payload = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    const normalized = decodeURIComponent(
        decoded.split("").map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`).join("")
    );

    return JSON.parse(normalized);
}

const DEFAULT_API_URL = "https://www.liceoscientificocortese.edu.it/app/orario/api/v0";
const API_URL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_ORARIO_API_URL ||
    DEFAULT_API_URL;
const CACHE_KEY = "lscway_orario_cache_v1";

let memoryCache = null;
let lastSerializedJson = null;
let inflightRevalidation = null;

function buildTimetableIndexes(rows) {
    const byClass = Object.create(null);
    const byTeacher = Object.create(null);
    const byAula = Object.create(null);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.classe && row.materia !== "INCL") {
            (byClass[row.classe] ||= []).push(row);
        }
        if (row.docente) {
            (byTeacher[row.docente] ||= []).push(row);
        }
        if (row.aula) {
            (byAula[row.aula] ||= []).push(row);
        }
    }

    return { byClass, byTeacher, byAula };
}

function attachIndexes(target, rows) {
    if (!target || typeof target !== "object") return target;
    Object.defineProperty(target, "_index", {
        value: buildTimetableIndexes(rows),
        enumerable: false,
        configurable: true,
        writable: true
    });
    return target;
}

function normalizeTimetableData(raw) {
    if (!raw || typeof raw !== "object") return null;

    if (raw.user) {
        userEmail.set(raw.user);
    }

    if (raw.__normalized) {
        if (!raw._index && Array.isArray(raw.data)) {
            attachIndexes(raw, raw.data);
        }
        return raw;
    }

    const classi = Array.isArray(raw.classi)
        ? raw.classi.filter((e) => !e.includes(".") && !e.includes("*"))
        : [];

    const rows = Array.isArray(raw.data)
        ? raw.data.map((e) => {
            if (e.classe && e.classe.includes(".")) {
                e.classe = e.classe.replace(".", "");
            } else if (e.classe && e.classe.includes("*")) {
                e.classe = e.classe.replace("*", "");
                if (!e.aula) e.aula = "-";
            }
            if (e.materia == "sub_potenziamento" || e.materia == "POT") {
                e.materia = "POT";
                e.aula = "";
                e.classe = "";
            } else if (e.materia == "sub_ricevimento" || e.materia == "RIC") {
                e.materia = "RIC";
                e.aula = "";
            }
            return e;
        })
        : [];

    const normalized = {
        ...raw,
        classi,
        data: rows,
        __normalized: true
    };

    return attachIndexes(normalized, rows);
}

function readCachedData() {
    if (typeof localStorage === "undefined") {
        return memoryCache;
    }

    try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (!cachedStr) {
            memoryCache = null;
            lastSerializedJson = null;
            return null;
        }
        if (memoryCache && lastSerializedJson === cachedStr) {
            return memoryCache;
        }
        const parsed = JSON.parse(cachedStr);
        if (!parsed || !Array.isArray(parsed.data)) return null;
        lastSerializedJson = cachedStr;
        memoryCache = normalizeTimetableData(parsed);
        return memoryCache;
    } catch (e) {
        return null;
    }
}

function persistCachedDataAsync(serializedJson) {
    if (typeof window === "undefined" || typeof localStorage === "undefined" || !serializedJson) return;

    const save = () => {
        try {
            localStorage.setItem(CACHE_KEY, serializedJson);
        } catch (e) {}
    };

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(save, { timeout: 2000 });
    } else {
        setTimeout(save, 50);
    }
}

async function fetchNetworkData(fetchFn, isBackground = false) {
    let rawData = null;

    if (typeof window !== "undefined" && window.__lscwayInitialDataPromise && API_URL === DEFAULT_API_URL) {
        const preloadPromise = window.__lscwayInitialDataPromise;
        delete window.__lscwayInitialDataPromise;
        try {
            rawData = await preloadPromise;
        } catch (e) {
            rawData = null;
        }
    }

    if (!rawData) {
        const res = await fetchFn(API_URL, {
            mode: "cors",
            cache: "no-cache",
            priority: isBackground ? "low" : "high"
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        rawData = await res.json();
    }

    const normalized = normalizeTimetableData(rawData);
    if (normalized) {
        const nextJson = JSON.stringify(normalized);
        const hasChanged = !memoryCache || lastSerializedJson !== nextJson;
        if (hasChanged) {
            memoryCache = normalized;
            lastSerializedJson = nextJson;
            timetableData.set(normalized);
            persistCachedDataAsync(nextJson);
        }
    }
    return memoryCache || normalized;
}

export async function getData(fetch) {
    const cached = readCachedData();

    if (cached) {
        timetableData.set(cached);

        if (!inflightRevalidation && typeof window !== "undefined") {
            inflightRevalidation = fetchNetworkData(fetch, true)
                .catch(() => {})
                .finally(() => {
                    inflightRevalidation = null;
                });
        }

        return cached;
    }

    try {
        return await fetchNetworkData(fetch, false);
    } catch (err) {
        const fallback = readCachedData();
        if (fallback) {
            timetableData.set(fallback);
            return fallback;
        }
        throw err;
    }
}

export async function googleAuth(credential) {
    try {
        const payload = decodeGoogleJwt(credential);

        if (!payload.email) {
            throw new Error("Non è stato possibile recuperare l'email da Google.");
        }

        if (payload.email_verified !== true) {
            throw new Error("L'email Google non è verificata.");
        }

        if (!payload.email.toLowerCase().endsWith("@lscortese.com")) {
            throw new Error("L'accesso con Google è consentito solo agli account @lscortese.com.");
        }

        userEmail.set(payload.email);

        return {
            success: true,
            message: "Accesso effettuato con Google",
            email: payload.email
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Impossibile completare l'accesso con Google."
        };
    }
}