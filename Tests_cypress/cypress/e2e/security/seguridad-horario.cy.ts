describe('Comprobaciones básicas de acceso y aislamiento del horario', () => {
  let token: string;
  beforeEach(() => cy.registerStudent('Alicia Seguridad').then((s) => { token = s.token; }));

  ['/schedule', '/subjects/1'].forEach((ruta) => {
    it(`redirige a /login sin sesión: ${ruta}`, () => {
      cy.intercept('GET', '**/subjects/classes').as('classes');
      cy.visit(ruta);
      cy.location('pathname').should('eq', '/login');
      cy.get('[data-cy=class-card]').should('not.exist');
      cy.get('@classes.all').should('have.length', 0);
    });
  });

  it('envía el token Bearer al pedir el horario', () => {
    cy.intercept('GET', '**/subjects/classes').as('classes');
    cy.visitAs(token, '/schedule');
    cy.wait('@classes').its('request.headers.authorization').should('eq', `Bearer ${token}`);
  });

  it('rechaza un token inválido sin mostrar clases', () => {
    cy.on('window:alert', () => undefined);
    cy.intercept('GET', '**/subjects/classes').as('classes');
    cy.visitAs('token.falso.123', '/schedule');
    cy.wait('@classes').its('response.statusCode').should('eq', 401);
    cy.get('[data-cy=class-card]').should('not.exist');
  });

  it('muestra como texto un nombre de asignatura con HTML', () => {
    const nombre = '<img src=x onerror="window.__xss=true">';
    cy.seedSubject(token, nombre, 'Gómez').then(({ id }) => cy.seedClass(token, id, 'monday', '08:00', '09:00'));
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-name]').should('have.text', nombre);
    cy.get('[data-cy=class-card] img').should('not.exist');
    cy.window().should('not.have.property', '__xss');
  });

  it('no muestra al estudiante las clases de otro', () => {
    cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => cy.seedClass(token, id, 'monday', '08:00', '09:00'));
    cy.registerStudent('Bruno Seguridad').then((otro) => {
      cy.visitAs(otro.token, '/schedule');
      cy.get('[data-cy=day-header]').should('have.length', 7);
      cy.get('[data-cy=class-card]').should('not.exist');
    });
  });

  it('mantiene la clase si el backend rechaza el borrado de una clase ajena', () => {
    cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => cy.seedClass(token, id, 'monday', '08:00', '09:00')).then(({ id: claseId }) => {
      cy.registerStudent('Bruno Seguridad').then((otro) => {
        cy.request({ method: 'DELETE', url: `${Cypress.env('apiUrl')}/subjects/classes/${claseId}`, headers: { Authorization: `Bearer ${otro.token}` }, failOnStatusCode: false })
          .its('status').should('eq', 404);
      });
    });
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', 1);
  });

  it('el modal solo envía los campos esperados (sin userId ni id)', () => {
    cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => {
      cy.intercept('POST', '**/subjects/classes').as('addClass');
      cy.visitAs(token, `/subjects/${id}`);
      cy.get('[data-cy=add-class-btn]').click();
      cy.get('[data-cy=class-save]').click();
      cy.wait('@addClass').then(({ request }) => {
        expect(request.headers.authorization).to.eq(`Bearer ${token}`);
        expect(Object.keys(request.body).sort()).to.deep.equal(['dayOfWeek', 'endTime', 'startTime', 'subjectId']);
      });
    });
  });
});
