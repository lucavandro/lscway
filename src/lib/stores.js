// src/stores/content.js
import { writable } from 'svelte/store'

// Get the value out of storage on load.
const stored = localStorage.getItem('user:email')

export const userEmail = writable(stored )

userEmail.subscribe(value => localStorage.setItem('user:email', value))

export const loadUserFromStorage = () => {
  const stored = localStorage.getItem('user:email')
  userEmail.set(stored)
}