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



