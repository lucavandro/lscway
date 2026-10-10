import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPrefTeacher,
  setPrefTeacher,
  getPrefClass,
  setPrefClass,
  getPrefClassroom,
  setPrefClassroom,
  validateEmail,
  getTodayDate,
  inclusioneInFondo
} from '$lib/utils.js';

describe('utils module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves preferred teacher, class, and classroom in localStorage', () => {
    expect(getPrefTeacher()).toBeNull();
    setPrefTeacher('ROSSI MARIO');
    expect(getPrefTeacher()).toBe('ROSSI MARIO');

    expect(getPrefClass()).toBeNull();
    setPrefClass('5A');
    expect(getPrefClass()).toBe('5A');

    expect(getPrefClassroom()).toBeNull();
    setPrefClassroom('A101');
    expect(getPrefClassroom()).toBe('A101');
  });

  it('validates official school emails', () => {
    expect(validateEmail('docente@lscortese.com')).toBe(true);
    expect(validateEmail('mario.rossi@lscortese.com')).toBe(true);
    expect(validateEmail('user@gmail.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });

  it('formats today date as YYYY-MM-DD', () => {
    const today = getTodayDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sorts INC and MADISO to the bottom of the list', () => {
    const items = [
      { materia: 'INC', docente: 'Doc A' },
      { materia: 'MAT', docente: 'Doc B' },
      { materia: 'MADISO', docente: 'Doc C' },
      { materia: 'ITA', docente: 'Doc D' }
    ];

    const sorted = [...items].sort(inclusioneInFondo);
    expect(sorted[0].materia).not.toBe('INC');
    expect(sorted[0].materia).not.toBe('MADISO');
    expect(sorted[1].materia).not.toBe('INC');
    expect(sorted[1].materia).not.toBe('MADISO');

    // Last two should be the support/inclusion subjects
    const lastMaterie = [sorted[2].materia, sorted[3].materia];
    expect(lastMaterie).toContain('INC');
    expect(lastMaterie).toContain('MADISO');
  });
});
