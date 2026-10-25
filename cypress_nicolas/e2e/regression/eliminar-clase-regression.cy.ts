describe('Regresión: eliminar clase', () => {
  let token: string;
  let subjectId: number;
  beforeEach(() => {
    cy.registerStudent('Alicia Eliminar').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then((s) => { subjectId = s.id; });
    cy.intercept('DELETE', '**/subjects/classes/*').as('deleteClass');
  });
  const eliminar = (indice = 0) => {
    cy.get('[data-cy=class-card]').eq(indice).trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=menu-delete]').click();
  };

  it('elimina la clase confirmando y no reaparece al recargar', () => {
    cy.seedClass(token, subjectId, 'monday', '08:00', '09:00');
    cy.on('window:confirm', (texto) => { expect(texto).to.eq('Delete Class?'); return true; });
    cy.visitAs(token, '/schedule');
    eliminar();
    cy.wait('@deleteClass').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=class-card]').should('not.exist');
    cy.reload();
    cy.get('[data-cy=day-header]').should('have.length', 7);
    cy.get('[data-cy=class-card]').should('not.exist');
  });

  it('conserva la clase cuando se cancela la confirmación', () => {
    cy.seedClass(token, subjectId, 'monday', '08:00', '09:00');
    cy.on('window:confirm', () => false);
    cy.visitAs(token, '/schedule');
    eliminar();
    cy.get('@deleteClass.all').should('have.length', 0);
    cy.get('[data-cy=class-card]').should('have.length', 1);
    cy.get('[data-cy=context-menu]').should('not.exist');
  });

  it('borra solo la clase elegida cuando la asignatura tiene varias', () => {
    cy.seedClass(token, subjectId, 'monday', '08:00', '09:00');
    cy.seedClass(token, subjectId, 'wednesday', '10:00', '11:00');
    cy.on('window:confirm', () => true);
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', 2);
    eliminar(1);
    cy.wait('@deleteClass').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=class-card]').should('have.length', 1);
    cy.get('[data-cy=class-time]').should('contain.text', '08:00');
  });

  it('actualiza la próxima clase al eliminar la que era la próxima', () => {
    cy.clock(new Date(2026, 9, 21, 10, 30).getTime(), ['Date']); // miércoles 10:30
    cy.seedClass(token, subjectId, 'wednesday', '14:00', '15:00');
    cy.seedSubject(token, 'Física', 'Pérez').then(({ id }) => cy.seedClass(token, id, 'thursday', '08:00', '09:00'));
    cy.on('window:confirm', () => true);
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-subject]').should('have.text', 'Cálculo');
    cy.contains('[data-cy=class-card]', 'Cálculo').trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=menu-delete]').click();
    cy.wait('@deleteClass');
    cy.get('[data-cy=next-class-subject]').should('have.text', 'Física');
  });
});
