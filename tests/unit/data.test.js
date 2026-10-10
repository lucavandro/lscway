import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getData, googleAuth } from '$lib/data.js';
import { userEmail, timetableData } from '$lib/stores.js';
import { get } from 'svelte/store';

describe('data module', () => {
  beforeEach(() => {
    localStorage.clear();
    userEmail.set(null);
    timetableData.set(null);
  });

  it('normalizes timetable data and caches it', async () => {
    const mockApiResponse = {
      classi: ['1A', '1A.', '2B*'],
      docenti: ['ROSSI MARIO'],
      aule: ['A101'],
      data: [
        { day: 'LUN', ora: '08:00', classe: '1A.', docente: 'ROSSI MARIO', materia: 'MAT', aula: 'A101' },
        { day: 'LUN', ora: '08:55', classe: '2B*', docente: 'ROSSI MARIO', materia: 'POT', aula: 'A101' },
        { day: 'LUN', ora: '09:50', classe: '1A', docente: 'ROSSI MARIO', materia: 'sub_ricevimento', aula: 'A101' }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });

    const result = await getData(mockFetch);
    expect(result).toBeDefined();
    expect(result.__normalized).toBe(true);

    // Classes with dots/asterisks removed from classi array
    expect(result.classi).toEqual(['1A']);

    // Data rows cleaned:
    // Row 0: classe '1A.' -> '1A'
    expect(result.data[0].classe).toBe('1A');

    // Row 1: materia 'POT' -> aula and classe cleared
    expect(result.data[1].materia).toBe('POT');
    expect(result.data[1].aula).toBe('');
    expect(result.data[1].classe).toBe('');

    // Row 2: materia 'sub_ricevimento' -> 'RIC', aula cleared
    expect(result.data[2].materia).toBe('RIC');
    expect(result.data[2].aula).toBe('');

    // O(1) lookup indexes are attached and non-enumerable
    expect(result._index).toBeDefined();
    expect(result._index.byClass['1A']).toHaveLength(2);
    expect(result._index.byTeacher['ROSSI MARIO']).toHaveLength(3);
    expect(result._index.byAula['A101']).toHaveLength(1);
    expect(Object.keys(result)).not.toContain('_index');

    // Store is updated
    expect(get(timetableData)).toEqual(result);
  });

  it('rejects Google OAuth credential with non-school domain', async () => {
    // Generate a mock JWT for an unauthorized domain (e.g. gmail.com)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      email: 'utente@gmail.com',
      email_verified: true
    }));
    const fakeToken = `${header}.${payload}.signature`;

    const authResult = await googleAuth(fakeToken);
    expect(authResult.success).toBe(false);
    expect(authResult.message).toContain('@lscortese.com');
  });

  it('rejects Google OAuth credential when unverified', async () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      email: 'prof@lscortese.com',
      email_verified: false
    }));
    const fakeToken = `${header}.${payload}.signature`;

    const authResult = await googleAuth(fakeToken);
    expect(authResult.success).toBe(false);
    expect(authResult.message).toContain('non è verificata');
  });

  it('accepts valid Google OAuth credential with @lscortese.com', async () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      email: 'docente@lscortese.com',
      email_verified: true
    }));
    const fakeToken = `${header}.${payload}.signature`;

    const authResult = await googleAuth(fakeToken);
    expect(authResult.success).toBe(true);
    expect(authResult.email).toBe('docente@lscortese.com');
    expect(get(userEmail)).toBe('docente@lscortese.com');
  });
});
