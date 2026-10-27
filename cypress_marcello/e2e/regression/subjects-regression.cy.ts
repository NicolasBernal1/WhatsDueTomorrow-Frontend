import '../../support/commands';

describe('Asignaturas — Regresión (flujo completo)', () => {
  it('Ciclo de vida de una asignatura sin romper las demás funciones', () => {
    cy.on('window:confirm', () => true);
    cy.createAccount().then(({ token }) => {
      cy.visitAs(token);
      cy.get('p.empty').should('exist');

      // Crear
      cy.contains('button', /add/i).click();
      cy.get('input[formcontrolname=name]').type('Regresion');
      cy.get('input[formcontrolname=professor]').type('Profe');
      cy.get('input[formcontrolname=credits]').clear().type('3');
      cy.get('button[type=submit]').click();
      cy.contains('mat-card.subject-card', 'Regresion').should('exist');

      // Buscar
      cy.get('#subject-search').type('Regre');
      cy.get('mat-card.subject-card').should('have.length', 1);
      cy.get('#subject-search').clear();

      // Detalle
      cy.contains('mat-card.subject-card', 'Regresion').click();
      cy.get('mat-card.subject-header mat-card-title').should('contain.text', 'Regresion');
      cy.go('back');

      // Editar
      cy.contains('mat-card.subject-card', 'Regresion').rightclick();
      cy.get('.context-menu').contains('button', 'Edit').click();
      cy.get('input[formcontrolname=name]').clear().type('Regresion2');
      cy.get('button[type=submit]').click();
      cy.contains('mat-card.subject-card', 'Regresion2').should('exist');

      // Eliminar
      cy.contains('mat-card.subject-card', 'Regresion2').rightclick();
      cy.get('.context-menu').contains('button', 'Delete').click();
      cy.get('p.empty').should('exist');
    });
  });

  it('Regresión: un error de la API al listar muestra el aviso "Error getting subjects"', () => {
    cy.createAccount().then(({ token }) => {
      cy.intercept('GET', 'https://whatsduetomorrow-backed.onrender.com/subjects', { statusCode: 500, body: {} }).as('fail');
      const alertStub = cy.stub().as('alert');
      cy.on('window:alert', alertStub);
      cy.visitAs(token);
      cy.wait('@fail');
      cy.get('@alert').should('have.been.calledWith', 'Error getting subjects');
    });
  });
});
