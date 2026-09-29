import { writable } from 'svelte/store';

/**
 * Current effective active theme: 'light' | 'dark'
 */
export const theme = writable('light');

/**
 * User stored preference: 'system' | 'light' | 'dark'
 */
export const themePreference = writable('system');

let initialized = false;
let mediaQueryList = null;

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDOM(effectiveTheme) {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', effectiveTheme);
  document.documentElement.style.colorScheme = effectiveTheme;

  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) {
    colorSchemeMeta.content = effectiveTheme;
  }

  // Update theme-color meta tags
  const themeColorLight = document.querySelector('meta[name="theme-color"][media*="light"]');
  const themeColorDark = document.querySelector('meta[name="theme-color"][media*="dark"]');
  if (themeColorLight && themeColorDark) {
    // Both exist, but if user manually selected theme, sync them or let browser match
  }
}

/**
 * Initializes the theme system.
 * Call this inside +layout.svelte onMount.
 */
export function initTheme() {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') {
    themePreference.set(saved);
    theme.set(saved);
    applyThemeToDOM(saved);
  } else {
    themePreference.set('system');
    const systemTheme = mediaQueryList.matches ? 'dark' : 'light';
    theme.set(systemTheme);
    applyThemeToDOM(systemTheme);
  }

  // Listen to system theme changes when user preference is 'system'
  const handleSystemChange = (e) => {
    let currentPref;
    themePreference.subscribe((v) => (currentPref = v))();
    if (currentPref === 'system') {
      const nextSystem = e.matches ? 'dark' : 'light';
      theme.set(nextSystem);
      applyThemeToDOM(nextSystem);
    }
  };

  if (mediaQueryList.addEventListener) {
    mediaQueryList.addEventListener('change', handleSystemChange);
  } else if (mediaQueryList.addListener) {
    mediaQueryList.addListener(handleSystemChange);
  }
}

/**
 * Toggles between light and dark theme, storing the user's choice in localStorage.
 */
export function toggleTheme() {
  if (typeof window === 'undefined') return;

  let currentEffective;
  theme.subscribe((v) => (currentEffective = v))();

  const next = currentEffective === 'dark' ? 'light' : 'dark';

  localStorage.setItem('theme', next);
  themePreference.set(next);
  theme.set(next);
  applyThemeToDOM(next);
}

/**
 * Sets explicit preference ('light', 'dark', or 'system').
 */
export function setTheme(pref) {
  if (typeof window === 'undefined') return;

  if (pref === 'system') {
    localStorage.removeItem('theme');
    themePreference.set('system');
    const systemTheme = getSystemTheme();
    theme.set(systemTheme);
    applyThemeToDOM(systemTheme);
  } else if (pref === 'light' || pref === 'dark') {
    localStorage.setItem('theme', pref);
    themePreference.set(pref);
    theme.set(pref);
    applyThemeToDOM(pref);
  }
}
