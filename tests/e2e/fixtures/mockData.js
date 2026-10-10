export const mockTimetableData = {
  classi: ['1A', '2B', '3C'],
  docenti: ['ROSSI MARIO', 'BIANCHI LUIGI'],
  aule: ['A101', 'B204'],
  data: [
    // Lunedì 1A
    { day: 'LUN', ora: '08:00', classe: '1A', docente: 'ROSSI MARIO', materia: 'MAT', aula: 'A101' },
    { day: 'LUN', ora: '08:55', classe: '1A', docente: 'BIANCHI LUIGI', materia: 'ITA', aula: 'A101' },
    { day: 'LUN', ora: '09:50', classe: '1A', docente: 'ROSSI MARIO', materia: 'FIS', aula: 'A101' },
    { day: 'LUN', ora: '10:45', classe: '1A', docente: 'BIANCHI LUIGI', materia: 'STO', aula: 'A101' },
    { day: 'LUN', ora: '11:40', classe: '1A', docente: 'ROSSI MARIO', materia: 'MAT', aula: 'A101' },
    { day: 'LUN', ora: '12:35', classe: '1A', docente: 'BIANCHI LUIGI', materia: 'FIL', aula: 'A101' },
    { day: 'LUN', ora: '13:30', classe: '1A', docente: 'ROSSI MARIO', materia: 'MAT', aula: 'A101' },
    { day: 'LUN', ora: '14:25', classe: '1A', docente: 'BIANCHI LUIGI', materia: 'ITA', aula: 'A101' },

    // Altri giorni per 1A
    { day: 'MAR', ora: '08:00', classe: '1A', docente: 'BIANCHI LUIGI', materia: 'ITA', aula: 'A101' },
    { day: 'MER', ora: '08:00', classe: '1A', docente: 'ROSSI MARIO', materia: 'MAT', aula: 'A101' },
    { day: 'GIO', ora: '08:00', classe: '1A', docente: 'ROSSI MARIO', materia: 'FIS', aula: 'A101' },
    { day: 'VEN', ora: '08:00', classe: '1A', docente: 'BIANCHI LUIGI', materia: 'STO', aula: 'A101' },

    // Docente ROSSI MARIO su 2B
    { day: 'MAR', ora: '08:55', classe: '2B', docente: 'ROSSI MARIO', materia: 'POT', aula: '' },
    { day: 'MER', ora: '09:50', classe: '', docente: 'ROSSI MARIO', materia: 'RIC', aula: '' }
  ]
};

export const mockSubstitutionsData = {
  substitutions: [
    {
      id: 991,
      ora: '08:55',
      data: new Date().toISOString().split('T')[0],
      stato: 'pubblicata',
      classe: '2B',
      aula: 'B204',
      docenteAssente: 'BIANCHI LUIGI',
      note: 'Sostituzione urgente laboratorio',
      presaVisione: { stato: 'inviata' },
      accettato: false
    }
  ]
};
