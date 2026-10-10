import { describe, it, expect, beforeEach, vi } from 'vitest';
import { theme, themePreference, toggleTheme } from '$lib/theme.js';
import { get } from 'svelte/store';

describe('theme module', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  it('toggles between light and dark themes', () => {
    theme.set('light');
    themePreference.set('light');

    toggleTheme();
    expect(get(theme)).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    toggleTheme();
    expect(get(theme)).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
