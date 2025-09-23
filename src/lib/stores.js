// src/stores/content.js
import { writable } from 'svelte/store'
import { validateEmail } from './utils';

// Get the value out of storage on load.


export const userEmail = writable(null);
export const notificationPermission = writable(false);



