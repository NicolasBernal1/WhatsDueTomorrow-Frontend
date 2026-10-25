describe('Flujo de referencia para Cypress Studio', () => {
  it('agrega una clase a una asignatura y verifica que aparece en el horario', () => {
    cy.registerStudent('Alicia Studio').then(({ token }) => {
      cy.seedSubject(token, 'Cálculo', 'Gómez').then(({ id }) => {
        cy.visitAs(token, `/subjects/${id}`);
        cy.get('[data-cy=add-class-btn]').click();
        cy.choose('class-day', 'Tuesday');
        cy.choose('class-start', '14:00');
        cy.choose('class-end', '15:00');
        cy.get('[data-cy=class-save]').click();
        cy.visitAs(token, '/schedule');
        cy.get('[data-cy=class-name]').should('have.text', 'Cálculo');
      });
    });
  });
});
