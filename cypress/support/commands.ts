// Frontend Custom Cypress Commands for Deployed Vercel App

declare global {
  namespace Cypress {
    interface Chainable {
      loginSession(token?: string, user?: any): Chainable<void>;
      loginByUI(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginSession', (token = 'mock-jwt-token-f21', user = { id: 1, name: 'Estudiante Prueba' }) => {
  cy.window().then((win) => {
    win.localStorage.setItem('token', token);
    win.localStorage.setItem('user', JSON.stringify(user));
  });
});

Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[formControlName="email"]').should('be.visible').type(email);
  cy.get('input[formControlName="password"]').should('be.visible').type(password, { log: false });
  cy.get('button[type="submit"]').click();
});

export {};
