describe('Regresión: editar clase', () => {
  let token: string;
  beforeEach(() => {
    cy.registerStudent('Alicia Editar').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then(({ id }) => cy.seedClass(token, id, 'monday', '08:00', '09:00'));
    cy.intercept('PATCH', '**/subjects/classes/*').as('editClass');
  });
  const abrirEdicion = () => {
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').first().trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=menu-edit]').click();
  };

  it('cambia el día y la hora de la clase y se conserva al recargar', () => {
    abrirEdicion();
    cy.get('[data-cy=class-modal-title]').should('have.text', 'Edit Class Schedule');
    cy.choose('class-day', 'Thursday');
    cy.choose('class-start', '14:00');
    cy.choose('class-end', '15:00');
    cy.get('[data-cy=class-save]').click();
    cy.wait('@editClass').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body).to.deep.equal({ dayOfWeek: 'thursday', startTime: '14:00', endTime: '15:00' });
    });
    cy.get('[data-cy=class-modal]').should('not.exist');
    cy.get('[data-cy=class-time]').should('contain.text', '14:00').and('not.contain.text', '08:00');
    cy.reload();
    cy.get('[data-cy=class-card]').should('have.length', 1);
    cy.get('[data-cy=class-time]').should('contain.text', '14:00');
  });

  it('abre el modal con los valores actuales de la clase', () => {
    abrirEdicion();
    cy.get('[data-cy=class-day]').should('contain.text', 'Monday');
    cy.get('[data-cy=class-start]').should('contain.text', '08:00').and('not.contain.text', '08:00:00');
    cy.get('[data-cy=class-end]').should('contain.text', '09:00');
  });

  it('guardar sin cambios no se considera un cruce con la propia clase', () => {
    abrirEdicion();
    cy.get('[data-cy=class-save]').click();
    cy.wait('@editClass').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=class-modal]').should('not.exist');
  });

  it('cancelar la edición no modifica la clase', () => {
    abrirEdicion();
    cy.choose('class-day', 'Friday');
    cy.get('[data-cy=class-cancel]').click();
    cy.get('[data-cy=class-modal]').should('not.exist');
    cy.get('@editClass.all').should('have.length', 0);
    cy.get('[data-cy=class-time]').should('contain.text', '08:00');
  });
});
