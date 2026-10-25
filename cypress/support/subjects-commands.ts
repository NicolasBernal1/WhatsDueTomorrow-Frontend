/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /** Crea un usuario nuevo por API y devuelve { email, password, token }. */
      createAccount(): Chainable<{ email: string; password: string; token: string }>;
      /** Crea una asignatura por API (usa el token dado). */
      createSubject(token: string, s?: Partial<{ name: string; professor: string; credits: number; color: string }>): Chainable<any>;
      /** Visita una ruta del front con la sesión iniciada. */
      visitAs(token: string, path?: string): Chainable<void>;
    }
  }
}

const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;

Cypress.Commands.add('createAccount', () => {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `cy.${id}@test.com`;
  const password = 'Cypress#123';
  return cy
    .request('POST', `${api()}/auth/register`, { name: 'Cypress Tester', email, password })
    .then(() => cy.request('POST', `${api()}/auth/login`, { email, password }))
    .then((res) => {
      const token = res.body?.data?.token ?? res.body?.token ?? res.body?.access_token;
      expect(token, 'token de login').to.be.a('string');
      return { email, password, token };
    });
});

Cypress.Commands.add('createSubject', (token, s = {}) => {
  const body = { name: 'Ciencias', professor: 'Marco', credits: 4, color: '#3f51b5', ...s };
  const headers = { Authorization: `Bearer ${token}` };
  return cy
    .request({ method: 'POST', url: `${api()}/subjects`, headers, body })
    .then(() => cy.request({ url: `${api()}/subjects`, headers }))
    .then((res) => {
      const list = res.body?.data ?? res.body;
      const found = [...list].reverse().find((x: any) => x.name === body.name);
      expect(found, 'materia creada').to.exist;
      return found;
    });
});

Cypress.Commands.add('visitAs', (token, path = '/subjects') => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', token);
    },
  });
});

export {};
