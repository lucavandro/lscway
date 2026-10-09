// src/stores/content.js
import { writable } from 'svelte/store'

const getInitialUserEmail = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem('userEmail');
};

export const userEmail = writable(getInitialUserEmail());
export const isTeacher = writable(false);
export const isLoading = writable(false);
export const isMenuOpen = writable(false);
export const timetableData = writable(null);


userEmail.subscribe((value) => {
    const username = value ? value.split('@')[0] : null;
    if(username){
        isTeacher.set(username && !username.includes('.'));
    } else {
        isTeacher.set(false);
    }
})
export const notificationPermission = writable(false);

const getInitialNotificationsEnabled = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    const saved = window.localStorage.getItem('notifications_enabled');
    if (saved !== null) {
        if (saved === 'true') {
            if ('Notification' in window && Notification.permission === 'denied') {
                return false;
            }
            return true;
        }
        return false;
    }
    return 'Notification' in window && Notification.permission === 'granted';
};

export const notificationsEnabled = writable(getInitialNotificationsEnabled());

if (typeof window !== 'undefined') {
    notificationsEnabled.subscribe((value) => {
        window.localStorage.setItem('notifications_enabled', value ? 'true' : 'false');
    });
}

if (typeof window !== 'undefined') {
    userEmail.subscribe((value) => {
        if (value) {
            window.localStorage.setItem('userEmail', value);
        } else {
            window.localStorage.removeItem('userEmail');
        }
    });
}

export const TABLE_FONT_SCALE_MIN = 0.7;
export const TABLE_FONT_SCALE_MAX = 1.4;
export const TABLE_FONT_SCALE_STEP = 0.1;
export const TABLE_FONT_SCALE_DEFAULT = 1;

function normalizeFontScale(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return TABLE_FONT_SCALE_DEFAULT;
    const clamped = Math.min(TABLE_FONT_SCALE_MAX, Math.max(TABLE_FONT_SCALE_MIN, parsed));
    return Math.round(clamped * 100) / 100;
}

const getInitialTableFontScale = () => {
    if (typeof window === 'undefined') {
        return TABLE_FONT_SCALE_DEFAULT;
    }
    const saved = window.localStorage.getItem('table_font_scale');
    if (saved !== null) {
        return normalizeFontScale(saved);
    }
    return TABLE_FONT_SCALE_DEFAULT;
};

export const tableFontScale = writable(getInitialTableFontScale());

if (typeof window !== 'undefined') {
    tableFontScale.subscribe((value) => {
        const normalized = normalizeFontScale(value);
        window.localStorage.setItem('table_font_scale', String(normalized));
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--table-font-scale', String(normalized));
        }
    });
}

export function increaseTableFontScale() {
    tableFontScale.update((current) => normalizeFontScale(current + TABLE_FONT_SCALE_STEP));
}

export function decreaseTableFontScale() {
    tableFontScale.update((current) => normalizeFontScale(current - TABLE_FONT_SCALE_STEP));
}

export function resetTableFontScale() {
    tableFontScale.set(TABLE_FONT_SCALE_DEFAULT);
}
