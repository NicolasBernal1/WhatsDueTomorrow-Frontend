import '../../support/commands';

describe('Usuario — Seguridad (Front)', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;

  it('XSS en la campana: un título con HTML se muestra como texto y no se ejecuta', () => {
    const payload = '<img src=x onerror="window.__xss=1">Tarea';
    cy.createAccount().then(({ token }) => {
      cy.createSubject(token, { name: 'Calculo' }).then((s) => cy.createAssignmentDueIn(token, s.id, payload, 3));
      cy.visitAs(token, '/schedule');
      cy.get('button[aria-label="Upcoming assignments"]').click();
      cy.get('.upcoming-item strong').should('have.text', payload);
      cy.get('.upcoming-item img').should('not.exist');
      cy.window().its('__xss').should('be.undefined');
    });
  });

  it('Sin sesión, las rutas privadas redirigen a /login', () => {
    ['/schedule', '/subjects', '/assignments', '/urgent-radar'].forEach((path) => {
      cy.visit(path);
      cy.location('pathname').should('eq', '/login');
    });
  });

  it('Con sesión, /login y /register redirigen a /schedule', () => {
    cy.createAccount().then(({ token }) => {
      ['/login', '/register'].forEach((path) => {
        cy.visitAs(token, path);
        cy.location('pathname').should('eq', '/schedule');
      });
    });
  });

  it('F03: Tras cerrar sesión, "Atrás" no devuelve al área privada', () => {
    cy.createAccount().then(({ token }) => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.contains('button', 'Log Out').click();
      cy.location('pathname').should('eq', '/login');
      cy.go('back');
      cy.location('pathname').should('eq', '/login');
      cy.get('mat-toolbar').should('not.exist');
    });
  });

  it('Un token inventado en localStorage no obtiene datos: el perfil responde 401', () => {
    cy.intercept('GET', '**/users/profile').as('profile');
    cy.visitAs('token.inventado.123', '/schedule');
    cy.openProfileMenu();
    cy.wait('@profile').its('response.statusCode').should('eq', 401);
    cy.get('.profile-info').should('not.exist');
  });

  it('BRECHA F03: tras "Log Out" el token debería dejar de funcionar en el servidor', function () {
    if (Cypress.env('expectAuthHardening') !== true) this.skip();
    cy.createAccount().then(({ token }) => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.contains('button', 'Log Out').click();
      cy.request({ url: `${api()}/users/profile`, headers: { Authorization: `Bearer ${token}` }, failOnStatusCode: false })
        .its('status').should('eq', 401);
    });
  });
});