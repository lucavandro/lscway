import { describe, it, expect, beforeEach } from 'vitest';
import {
  userEmail,
  isTeacher,
  isLoading,
  isMenuOpen,
  notificationsEnabled,
  tableFontScale,
  increaseTableFontScale,
  decreaseTableFontScale,
  resetTableFontScale,
  TABLE_FONT_SCALE_MIN,
  TABLE_FONT_SCALE_MAX,
  TABLE_FONT_SCALE_DEFAULT
} from '$lib/stores.js';
import { get } from 'svelte/store';

describe('stores module', () => {
  beforeEach(() => {
    localStorage.clear();
    userEmail.set(null);
    isLoading.set(false);
    isMenuOpen.set(false);
    resetTableFontScale();
  });

  it('determines teacher status based on email prefix', () => {
    // Teacher: no dot in local part
    userEmail.set('rossi@lscortese.com');
    expect(get(isTeacher)).toBe(true);

    // Student: contains dot in local part
    userEmail.set('mario.rossi@lscortese.com');
    expect(get(isTeacher)).toBe(false);

    // Cleared/null email
    userEmail.set(null);
    expect(get(isTeacher)).toBe(false);
  });

  it('syncs userEmail with localStorage', () => {
    userEmail.set('docente1@lscortese.com');
    expect(localStorage.getItem('userEmail')).toBe('docente1@lscortese.com');

    userEmail.set(null);
    expect(localStorage.getItem('userEmail')).toBeNull();
  });

  it('manages font scale within valid bounds', () => {
    expect(get(tableFontScale)).toBe(TABLE_FONT_SCALE_DEFAULT);

    increaseTableFontScale();
    expect(get(tableFontScale)).toBe(1.1);

    decreaseTableFontScale();
    expect(get(tableFontScale)).toBe(1.0);

    // Test upper bound with repeated increments
    for (let i = 0; i < 10; i++) {
      increaseTableFontScale();
    }
    expect(get(tableFontScale)).toBe(TABLE_FONT_SCALE_MAX);

    // Test lower bound with repeated decrements
    for (let i = 0; i < 20; i++) {
      decreaseTableFontScale();
    }
    expect(get(tableFontScale)).toBe(TABLE_FONT_SCALE_MIN);

    resetTableFontScale();
    expect(get(tableFontScale)).toBe(TABLE_FONT_SCALE_DEFAULT);
  });

  it('toggles menu state and loading state', () => {
    isMenuOpen.set(true);
    expect(get(isMenuOpen)).toBe(true);

    isMenuOpen.set(false);
    expect(get(isMenuOpen)).toBe(false);

    isLoading.set(true);
    expect(get(isLoading)).toBe(true);
  });
});
