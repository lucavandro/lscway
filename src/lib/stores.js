// src/stores/content.js
import { writable } from 'svelte/store'
import { validateEmail } from './utils';

// Get the value out of storage on load.
let stored = localStorage.getItem('user:email');
if (!validateEmail(stored)) {
  localStorage.removeItem('user:email');
  stored = null;
}

export const userEmail = writable(stored);
export const notificationPermission = writable(false);

userEmail.subscribe(value => {
  if (validateEmail(value)) {
    localStorage.setItem('user:email', value);
  } else {
    localStorage.removeItem('user:email');
  }
});

export const loadUserFromStorage = () => {
  let stored = localStorage.getItem('user:email');
  if (!validateEmail(stored)) {
    localStorage.removeItem('user:email');
    stored = null;
  }
  userEmail.set(stored);
}


