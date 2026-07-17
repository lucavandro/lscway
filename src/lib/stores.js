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


userEmail.subscribe((value) => {
    const username = value ? value.split('@')[0] : null;
    if(username){
        isTeacher.set(username && !username.includes('.'));
    }
})
export const notificationPermission = writable(false);

if (typeof window !== 'undefined') {
    userEmail.subscribe((value) => {
        if (value) {
            window.localStorage.setItem('userEmail', value);
        } else {
            window.localStorage.removeItem('userEmail');
        }
    });
}



