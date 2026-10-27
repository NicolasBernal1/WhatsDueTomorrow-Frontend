/**
 * ==============================================================================
 * DATOS MOCK DETERMINISTAS PARA REGRESIÓN VISUAL (ARGOS CI)
 * ==============================================================================
 * Estos datos garantizan que la interfaz renderice exactamente el mismo contenido
 * en cada ejecución, evitando diferencias de píxeles debidas a datos volátiles.
 */

export const MOCK_USER = {
  id: 1,
  name: 'Estudiante Prueba',
  email: 'estudiante.test@correo.com',
};

export const MOCK_SUBJECTS = [
  {
    id: 10,
    name: 'Diseño de Software',
    professor: 'Dr. Turing',
    credits: 4,
    color: '#3f51b5',
  },
  {
    id: 20,
    name: 'Sistemas Operativos',
    professor: 'Ing. Lovelace',
    credits: 4,
    color: '#009688',
  },
  {
    id: 30,
    name: 'Bases de Datos',
    professor: 'Dr. Codd',
    credits: 3,
    color: '#ff9800',
  },
  {
    id: 40,
    name: 'Redes y Telecomunicaciones',
    professor: 'Dra. Hamilton',
    credits: 4,
    color: '#e91e63',
  },
];

export const MOCK_CLASSES = [
  {
    id: 1,
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    subject: MOCK_SUBJECTS[0],
  },
  {
    id: 2,
    dayOfWeek: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    subject: MOCK_SUBJECTS[1],
  },
  {
    id: 3,
    dayOfWeek: 'Wednesday',
    startTime: '14:00',
    endTime: '16:00',
    subject: MOCK_SUBJECTS[2],
  },
  {
    id: 4,
    dayOfWeek: 'Friday',
    startTime: '16:00',
    endTime: '18:00',
    subject: MOCK_SUBJECTS[3],
  },
];

export const MOCK_URGENT_ASSIGNMENTS = [
  {
    id: 101,
    title: 'Informe de Arquitectura de Software',
    description: 'Documento C4 con decisiones ADR',
    dueDate: '2026-10-26T14:00:00.000Z',
    subjectId: 10,
    subjectName: 'Diseño de Software',
    reminderMinutes: 120,
    countdown: '2h 00m',
  },
  {
    id: 102,
    title: 'Laboratorio de Concurrencia',
    description: 'Implementación con semáforos y mutex',
    dueDate: '2026-10-26T18:00:00.000Z',
    subjectId: 20,
    subjectName: 'Sistemas Operativos',
    reminderMinutes: 60,
    countdown: '6h 00m',
  },
];

export const MOCK_ACADEMIC_LOAD = {
  baja: {
    totalCredits: 9,
    status: 'baja',
    subjectsCount: 3,
    weeklyClassHours: 9,
    weeklyAutonomousHours: 18,
    totalWeeklyHours: 27,
  },
  balanceada: {
    totalCredits: 15,
    status: 'balanceada',
    subjectsCount: 5,
    weeklyClassHours: 15,
    weeklyAutonomousHours: 30,
    totalWeeklyHours: 45,
  },
  sobrecarga: {
    totalCredits: 22,
    status: 'sobrecarga',
    subjectsCount: 7,
    weeklyClassHours: 22,
    weeklyAutonomousHours: 44,
    totalWeeklyHours: 66,
  },
};

export const MOCK_GRADE_SUMMARIES = {
  normal: {
    currentAverage: 4.25,
    currentContribution: 2.55,
    totalWeight: 60.0,
    remainingWeight: 40.0,
    requiredGrade: 1.13,
    isAttainable: true,
    weightExceeded: false,
  },
  weightExceeded: {
    currentAverage: 3.8,
    currentContribution: 4.56,
    totalWeight: 120.0,
    remainingWeight: -20.0,
    requiredGrade: 0.0,
    isAttainable: true,
    weightExceeded: true,
  },
  unreachable: {
    currentAverage: 1.5,
    currentContribution: 1.2,
    totalWeight: 80.0,
    remainingWeight: 20.0,
    requiredGrade: 9.0, // Imposible alcanzar 3.0 con 5.0 máx
    isAttainable: false,
    weightExceeded: false,
  },
};
