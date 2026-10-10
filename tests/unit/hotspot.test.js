import { describe, it, expect } from 'vitest';
import { hotspot } from '$lib/hotspot.js';

describe('hotspot module', () => {
  it('contains valid hotspot passwords for classrooms', () => {
    expect(typeof hotspot).toBe('object');
    expect(Object.keys(hotspot).length).toBeGreaterThan(30);

    // General docenti hotspot
    expect(hotspot).toHaveProperty('NINOCORTESE');
    expect(hotspot['NINOCORTESE']).toBe('N1n0$d0cent1');

    // Sample classrooms across wings A, B, C
    expect(hotspot).toHaveProperty('A101');
    expect(hotspot).toHaveProperty('B204');
    expect(hotspot).toHaveProperty('C101');

    // All values must be non-empty strings
    for (const [room, pwd] of Object.entries(hotspot)) {
      expect(typeof room).toBe('string');
      expect(typeof pwd).toBe('string');
      expect(pwd.length).toBeGreaterThan(3);
    }
  });
});
