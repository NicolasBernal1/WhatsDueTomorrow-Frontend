describe('Regresión: ver horario', () => {
  let token: string;
  beforeEach(() => cy.registerStudent('Alicia Horario').then((s) => { token = s.token; }));

  it('muestra los siete días y las clases reales del estudiante', () => {
    cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => {
      cy.seedClass(token, id, 'monday', '08:00', '09:00');
      cy.seedClass(token, id, 'wednesday', '10:00', '11:00');
    });
    cy.intercept('GET', '**/subjects/classes').as('classes');
    cy.visitAs(token, '/schedule');
    cy.wait('@classes').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=day-header]').should('have.length', 7);
    cy.get('[data-cy=class-card]').should('have.length', 2);
    cy.get('[data-cy=class-name]').first().should('have.text', 'Cálculo');
    cy.get('[data-cy=class-professor]').first().should('have.text', 'Gómez');
    cy.get('[data-cy=class-time]').first().should('contain.text', '08:00').and('contain.text', '09:00');
  });

  it('muestra el horario vacío cuando no hay clases', () => {
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=day-header]').should('have.length', 7);
    cy.get('[data-cy=class-card]').should('not.exist');
  });

  it('ocupa dos celdas una clase de dos horas', () => {
    cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => cy.seedClass(token, id, 'monday', '08:00', '10:00'));
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', 2);
  });

  it('no muestra las clases de otro estudiante', () => {
    cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => cy.seedClass(token, id, 'monday', '08:00', '09:00'));
    cy.registerStudent('Bruno Horario').then((otro) => {
      cy.visitAs(otro.token, '/schedule');
      cy.get('[data-cy=day-header]').should('have.length', 7);
      cy.get('[data-cy=class-card]').should('not.exist');
    });
  });

  it('marca solo la clase en curso con la insignia Now', () => {
    cy.clock(new Date(2026, 9, 21, 10, 30).getTime(), ['Date']); // miércoles 10:30
    cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => {
      cy.seedClass(token, id, 'wednesday', '10:00', '11:00');
      cy.seedClass(token, id, 'wednesday', '14:00', '15:00');
    });
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', 2);
    cy.get('[data-cy=now-badge]').should('have.length', 1).and('have.text', 'Now');
  });

  it('avisa con una alerta cuando el backend rechaza el token', () => {
    const alerta = cy.stub().as('alerta');
    cy.on('window:alert', alerta);
    cy.intercept('GET', '**/subjects/classes').as('classes');
    cy.visitAs('token-invalido', '/schedule');
    cy.wait('@classes').its('response.statusCode').should('eq', 401);
    cy.get('@alerta').should('have.been.calledWith', 'Error getting classes');
    cy.get('[data-cy=class-card]').should('not.exist');
  });
});
