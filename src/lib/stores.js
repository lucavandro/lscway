// src/stores/content.js
import { writable } from 'svelte/store'

// Get the value out of storage on load.
const stored = localStorage['user:email']

export const userEmail = writable(stored !== 'undefined' && stored ? stored : '')

userEmail.subscribe(value => localStorage.setItem('user:email', value))