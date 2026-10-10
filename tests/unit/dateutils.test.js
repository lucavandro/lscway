import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  weekdays,
  hours,
  getHourNum,
  getDay,
  isChristmasPeriod,
  getSchoolHour,
  clockStore
} from '$lib/dateutils.js';
import { get } from 'svelte/store';

describe('dateutils module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defines 5 weekdays and 8 schedule hours', () => {
    expect(weekdays).toEqual(['LUN', 'MAR', 'MER', 'GIO', 'VEN']);
    expect(hours).toHaveLength(8);
    expect(hours[0]).toBe('08:00');
    expect(hours[7]).toBe('14:25');
  });

  it('calculates lesson hour number correctly during school time', () => {
    // 08:30 (during 1st hour 08:00 - 08:55)
    vi.setSystemTime(new Date(2026, 9, 12, 8, 30, 0)); // Monday 12 Oct 2026
    expect(getHourNum()).toBe(1);

    // 09:10 (during 2nd hour 08:55 - 09:50)
    vi.setSystemTime(new Date(2026, 9, 12, 9, 10, 0));
    expect(getHourNum()).toBe(2);

    // 14:00 (during 7th hour 13:30 - 14:25)
    vi.setSystemTime(new Date(2026, 9, 12, 14, 0, 0));
    expect(getHourNum()).toBe(7);

    // 14:30 (during 8th hour 14:25 - 15:25)
    vi.setSystemTime(new Date(2026, 9, 12, 14, 30, 0));
    expect(getHourNum()).toBe(8);

    // 07:30 (before school) -> 0
    vi.setSystemTime(new Date(2026, 9, 12, 7, 30, 0));
    expect(getHourNum()).toBe(0);

    // 17:00 (after school) -> 0
    vi.setSystemTime(new Date(2026, 9, 12, 17, 0, 0));
    expect(getHourNum()).toBe(0);
  });

  it('returns day abbreviations correctly', () => {
    // 2026-10-12 is Monday
    vi.setSystemTime(new Date(2026, 9, 12, 10, 0, 0));
    expect(getDay()).toBe('LUN');

    // 2026-10-17 is Saturday
    vi.setSystemTime(new Date(2026, 9, 17, 10, 0, 0));
    expect(getDay()).toBe('SAB');

    // 2026-10-18 is Sunday
    vi.setSystemTime(new Date(2026, 9, 18, 10, 0, 0));
    expect(getDay()).toBe('DOM');
  });

  it('detects Christmas period', () => {
    // 24 December
    expect(isChristmasPeriod(new Date(2026, 11, 24))).toBe(true);
    // 31 December
    expect(isChristmasPeriod(new Date(2026, 11, 31))).toBe(true);
    // 4 January
    expect(isChristmasPeriod(new Date(2026, 0, 4))).toBe(true);
    // 15 October (regular school day)
    expect(isChristmasPeriod(new Date(2026, 9, 15))).toBe(false);
  });

  it('determines school hour text label', () => {
    // Weekend -> Fuori orario
    vi.setSystemTime(new Date(2026, 9, 18, 10, 0, 0)); // Sunday
    expect(getSchoolHour()).toBe('Fuori orario');

    // Christmas period -> Fuori orario
    vi.setSystemTime(new Date(2026, 11, 25, 10, 0, 0));
    expect(getSchoolHour()).toBe('Fuori orario');

    // Monday 08:30 -> I ora
    vi.setSystemTime(new Date(2026, 9, 12, 8, 30, 0));
    expect(getSchoolHour()).toBe('I ora');

    // Monday 10:00 -> III ora
    vi.setSystemTime(new Date(2026, 9, 12, 10, 0, 0));
    expect(getSchoolHour()).toBe('III ora');
  });

  it('provides clockStore with day, hourNum and schoolHour', () => {
    vi.setSystemTime(new Date(2026, 9, 12, 8, 30, 0));
    const state = get(clockStore);
    expect(state).toHaveProperty('day');
    expect(state).toHaveProperty('hourNum');
    expect(state).toHaveProperty('schoolHour');
    expect(state).toHaveProperty('isChristmas');
  });
});
