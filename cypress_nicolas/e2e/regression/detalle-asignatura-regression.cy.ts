describe('Regresión: navegar al detalle de la asignatura desde la clase', () => {
  let token: string;
  let calculoId: number;
  let fisicaId: number;
  beforeEach(() => {
    cy.registerStudent('Alicia Detalle').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then((s) => { calculoId = s.id; });
    cy.then(() => cy.seedSubject(token, 'Física', 'Pérez')).then((s) => { fisicaId = s.id; });
    cy.then(() => {
      cy.seedClass(token, calculoId, 'monday', '08:00', '09:00');
      cy.seedClass(token, fisicaId, 'tuesday', '10:00', '11:00');
    });
  });

  it('abre los detalles de la asignatura de la clase seleccionada', () => {
    cy.visitAs(token, '/schedule');
    cy.contains('[data-cy=class-card]', 'Física').click();
    cy.location('pathname').should('eq', `/subjects/${fisicaId}`);
    cy.get('[data-cy=subject-title]').should('have.text', 'Física');
    cy.get('[data-cy=subject-professor]').should('have.text', 'Pérez');
  });

  it('lleva a Cálculo y no a otra asignatura', () => {
    cy.visitAs(token, '/schedule');
    cy.contains('[data-cy=class-card]', 'Cálculo').click();
    cy.location('pathname').should('eq', `/subjects/${calculoId}`);
    cy.get('[data-cy=subject-title]').should('have.text', 'Cálculo');
    cy.get('[data-cy=subject-professor]').should('have.text', 'Gómez');
  });

  it('permite abrir los detalles con Enter sobre la tarjeta enfocada', () => {
    cy.visitAs(token, '/schedule');
    cy.contains('[data-cy=class-card]', 'Cálculo').should('have.attr', 'tabindex', '0').focus().type('{enter}');
    cy.location('pathname').should('eq', `/subjects/${calculoId}`);
  });

  it('el botón atrás devuelve al horario con las clases cargadas', () => {
    cy.visitAs(token, '/schedule');
    cy.contains('[data-cy=class-card]', 'Cálculo').click();
    cy.get('[data-cy=subject-details]').should('be.visible');
    cy.go('back');
    cy.location('pathname').should('eq', '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', 2);
  });

  it('no navega con el clic derecho', () => {
    cy.visitAs(token, '/schedule');
    cy.contains('[data-cy=class-card]', 'Cálculo').trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=context-menu]').should('be.visible');
    cy.location('pathname').should('eq', '/schedule');
  });

  it('abre los detalles desde la tarjeta de la próxima clase', () => {
    cy.clock(new Date(2026, 9, 21, 10, 30).getTime(), ['Date']); // miércoles 10:30
    cy.seedClass(token, calculoId, 'thursday', '10:00', '11:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-details]').click();
    cy.location('pathname').should('eq', `/subjects/${calculoId}`);
    cy.get('[data-cy=subject-title]').should('have.text', 'Cálculo');
  });
});
