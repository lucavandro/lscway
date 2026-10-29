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

  it('normalizes timetable data in v1 relational format and caches it', async () => {
    const mockV1Response = {
      data: '2026-10-15',
      giorno: 4,
      timetable: { id: 'tt_1', nome: 'Orario Definitivo' },
      classes: [
        { id: '1A', nome: '1A' },
        { id: '1B.', nome: '1B.' }
      ],
      teachers: [
        { id: 'T_ROSSI', nome: 'MARIO', cognome: 'ROSSI', shortName: 'ROSSI M.' }
      ],
      rooms: [
        { id: 'A101', codice: 'A101', nome: 'A101' }
      ],
      subjects: [
        { id: 'MATEMATICA', codice: 'MATE', nome: 'MATEMATICA', shortName: 'MAT' },
        { id: 'FISICA', codice: 'FISI', nome: 'FISICA', shortName: null }
      ],
      lessons: [
        {
          id: 'les_1',
          giorno: 1,
          timeSlotId: 'slot_1_1',
          classId: '1A',
          teacherId: 'T_ROSSI',
          roomId: 'A101',
          subjectId: 'MATEMATICA',
          isPotenziamento: false,
          isRicevimento: false
        },
        {
          id: 'les_2',
          giorno: 1,
          timeSlotId: 'slot_1_2',
          classId: '1A',
          teacherId: 'T_ROSSI',
          roomId: 'A101',
          subjectId: 'sub_potenziamento',
          isPotenziamento: true,
          isRicevimento: false
        },
        {
          id: 'les_3',
          giorno: 1,
          timeSlotId: 'slot_1_3',
          classId: '1A',
          teacherId: 'T_ROSSI',
          roomId: 'A101',
          subjectId: 'sub_ricevimento',
          isPotenziamento: false,
          isRicevimento: true
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockV1Response
    });

    const result = await getData(mockFetch);
    expect(result).toBeDefined();
    expect(result.__normalized).toBe(true);

    // Classes cleaned
    expect(result.classi).toEqual(['1A']);
    expect(result.docenti).toEqual(['ROSSI MARIO']);
    expect(result.aule).toEqual(['A101']);

    // Lesson 0: regular lesson
    expect(result.data[0].day).toBe('LUN');
    expect(result.data[0].ora).toBe('08:00');
    expect(result.data[0].classe).toBe('1A');
    expect(result.data[0].docente).toBe('ROSSI MARIO');
    expect(result.data[0].docente_abbr).toBe('ROSSI M');
    expect(result.data[0].materia).toBe('MAT');
    expect(result.data[0].aula).toBe('A101');

    // Lesson 1: potenziamento -> materia POT, empty aula and classe
    expect(result.data[1].day).toBe('LUN');
    expect(result.data[1].ora).toBe('08:55');
    expect(result.data[1].materia).toBe('POT');
    expect(result.data[1].aula).toBe('');
    expect(result.data[1].classe).toBe('');

    // Lesson 2: ricevimento -> materia RIC, empty aula
    expect(result.data[2].day).toBe('LUN');
    expect(result.data[2].ora).toBe('09:50');
    expect(result.data[2].materia).toBe('RIC');
    expect(result.data[2].aula).toBe('');

    // Index lookup attached
    expect(result._index.byClass['1A']).toBeDefined();
    expect(result._index.byTeacher['ROSSI MARIO']).toHaveLength(3);
    expect(result._index.byAula['A101']).toHaveLength(1);

    // Store is updated
    expect(get(timetableData)).toEqual(result);
  });

  it('normalizes substitutions and indexes for both substitute and substituted teacher', async () => {
    const mockV1WithSubs = {
      data: '2026-10-29',
      giorno: 4,
      timetable: { id: 'tt_1', nome: 'Orario Definitivo' },
      classes: [{ id: '4E', nome: '4E' }],
      teachers: [
        { id: 'VIGLIOTTIG', shortName: 'VIGLIOTTI G.' },
        { id: 'SANZARIE', shortName: 'SANZARI E.' }
      ],
      rooms: [{ id: 'A101', codice: 'A101' }],
      subjects: [{ id: 'SCIENZE', shortName: 'SCIE' }],
      lessons: [
        {
          id: 'les_sub_1',
          giorno: 4,
          timeSlotId: 'slot_4_1',
          classId: '4E',
          teacherId: 'VIGLIOTTIG',
          roomId: 'A101',
          subjectId: 'SCIENZE',
          isSubstitution: true,
          tipologia: 'sostituto',
          originalTeacherId: 'SANZARIE'
        }
      ]
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockV1WithSubs
    });

    const result = await getData(mockFetch);
    expect(result).toBeDefined();
    expect(result.data).toHaveLength(1);

    const subLesson = result.data[0];
    expect(subLesson.isSubstitution).toBe(true);
    expect(subLesson.tipologia).toBe('sostituto');
    expect(subLesson.originalTeacherId).toBe('SANZARIE');
    expect(subLesson.docente).toBe('VIGLIOTTI G');
    expect(subLesson.docente_abbr).toBe('VIGLIOTTI G');
    expect(subLesson.docenteOriginale).toBe('SANZARI E');
    expect(subLesson.docenteOriginaleAbbr).toBe('SANZARI E');

    // Dual indexing: both substitute and original teacher can see the lesson
    expect(result._index.byTeacher['VIGLIOTTI G']).toContainEqual(subLesson);
    expect(result._index.byTeacher['SANZARI E']).toContainEqual(subLesson);
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
