export interface Student { token: string; email: string; }
export interface SeededSubject { id: number; name: string; professor: string; }
export interface SeededClass { id: number; dayOfWeek: string; startTime: string; endTime: string; }

declare global {
  namespace Cypress {
    interface Chainable {
      registerStudent(name?: string): Chainable<Student>;
      seedSubject(token: string, name: string, professor: string): Chainable<SeededSubject>;
      seedClass(token: string, subjectId: number, dayOfWeek: string, startTime: string, endTime: string): Chainable<SeededClass>;
      visitAs(token: string, path: string): Chainable<void>;
      choose(dataCy: string, option: string): Chainable<void>;
    }
  }
}

const apiUrl = (): string => Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com';

Cypress.Commands.add('registerStudent', (name = 'Estudiante Cypress') => {
  const email = `cy.${Date.now()}${Math.floor(Math.random() * 100000)}@example.com`;
  const password = 'Password123!';
  return cy.request('POST', `${apiUrl()}/auth/register`, { name, email, password })
    .then(() => cy.request('POST', `${apiUrl()}/auth/login`, { email, password }))
    .then(({ body }) => ({ token: body.data.token as string, email }));
});

Cypress.Commands.add('seedSubject', (token, name, professor) =>
  cy.request({ method: 'POST', url: `${apiUrl()}/subjects`, headers: { Authorization: `Bearer ${token}` }, body: { name, professor } })
    .then(() => cy.request({ url: `${apiUrl()}/subjects`, headers: { Authorization: `Bearer ${token}` } }))
    .then(({ body }) => body.data.find((s: SeededSubject) => s.name === name) as SeededSubject));

Cypress.Commands.add('seedClass', (token, subjectId, dayOfWeek, startTime, endTime) =>
  cy.request({ method: 'POST', url: `${apiUrl()}/subjects/classes`, headers: { Authorization: `Bearer ${token}` }, body: { dayOfWeek, startTime, endTime, subjectId } })
    .then(() => cy.request({ url: `${apiUrl()}/subjects/classes`, headers: { Authorization: `Bearer ${token}` } }))
    .then(({ body }) => {
      const rows = body.data.filter((c: SeededClass & { subject: SeededSubject }) =>
        c.subject.id === subjectId && c.dayOfWeek === dayOfWeek && c.startTime.startsWith(startTime));
      return rows[rows.length - 1] as SeededClass;
    }));

Cypress.Commands.add('visitAs', (token, path) => {
  cy.visit(path, { onBeforeLoad: (win) => win.localStorage.setItem('token', token) });
});

Cypress.Commands.add('choose', (dataCy, option) => {
  cy.get(`[data-cy=${dataCy}]`).click();
  cy.contains('mat-option', new RegExp(`^\\s*${option}\\s*$`)).click();
});

export {};
