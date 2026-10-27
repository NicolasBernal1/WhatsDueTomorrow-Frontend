/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      createAccount(): Chainable<{ email: string; password: string; token: string }>;
      createSubject(token: string, s?: Partial<{ name: string; professor: string; credits: number; color: string }>): Chainable<any>;
      createAssignmentDueIn(token: string, subjectId: number, title: string, hours: number): Chainable<void>;
      visitAs(token: string, path?: string): Chainable<void>;
      loginByUI(email: string, password: string): Chainable<void>;
      openProfileMenu(): Chainable<void>;
    }
  }
}

const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;

Cypress.Commands.add('createAccount', () => {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `cy.seb.${id}@test.com`;
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

Cypress.Commands.add('createAssignmentDueIn', (token, subjectId, title, hours) => {
  const dueDate = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  cy.request({
    method: 'POST',
    url: `${api()}/assignments/subject/${subjectId}`,
    headers: { Authorization: `Bearer ${token}` },
    body: { title, dueDate },
  });
});

Cypress.Commands.add('visitAs', (token, path = '/subjects') => {
  cy.visit(path, { onBeforeLoad: (win) => win.localStorage.setItem('token', token) });
});

Cypress.Commands.add('loginByUI', (email, password) => {
  cy.visit('/login');
  cy.get('input[formcontrolname=email]').type(email);
  cy.get('input[formcontrolname=password]').type(password);
  cy.get('button[type=submit]').click();
});

Cypress.Commands.add('openProfileMenu', () => {
  cy.contains('button', 'Profile').click();
});

export {};
