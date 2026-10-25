const reglas: any = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } };

describe('Accesibilidad automática con axe: horario y clases', () => {
  let token: string;
  let subjectId: number;
  beforeEach(() => {
    cy.registerStudent('Alicia Accesibilidad').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then((s) => { subjectId = s.id; });
    cy.then(() => cy.seedClass(token, subjectId, 'monday', '08:00', '09:00'));
  });

  it('comprueba el horario con una clase', () => {
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y('[data-cy=schedule-grid]', reglas);
  });

  it('comprueba la sección de próxima clase', () => {
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y('[data-cy=next-class]', reglas);
  });

  it('comprueba el modal de agregar clase', () => {
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=add-class-btn]').click();
    cy.get('[data-cy=class-modal]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y('[data-cy=class-modal]', reglas);
  });

  it('comprueba el encabezado del detalle de la asignatura', () => {
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=subject-title]').should('have.text', 'Cálculo');
    cy.injectAxe();
    cy.checkA11y('[data-cy=subject-details]', reglas);
  });
});
