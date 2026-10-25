describe('Formulario de clase: validación y menú contextual', () => {
  let token: string;
  let subjectId: number;
  beforeEach(() => {
    cy.registerStudent('Alicia Formulario').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then((s) => { subjectId = s.id; });
    cy.intercept('POST', '**/subjects/classes').as('addClass');
  });
  const abrirModal = () => {
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=add-class-btn]').click();
  };

  it('informa que la hora de fin debe ser mayor que la de inicio', () => {
    abrirModal();
    cy.choose('class-day', 'Tuesday');
    cy.choose('class-start', '15:00');
    cy.choose('class-end', '14:00');
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'End time must be greater than start time.');
    cy.get('[data-cy=class-modal]').should('be.visible');
    cy.get('@addClass.all').should('have.length', 0);
  });

  it('rechaza una hora de fin igual a la de inicio', () => {
    abrirModal();
    cy.choose('class-start', '10:00');
    cy.choose('class-end', '10:00');
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'End time must be greater');
    cy.get('@addClass.all').should('have.length', 0);
  });

  it('informa el cruce con otra clase del mismo día', () => {
    cy.seedClass(token, subjectId, 'monday', '09:00', '10:00');
    abrirModal();
    cy.choose('class-day', 'Monday');
    cy.choose('class-start', '08:00');
    cy.choose('class-end', '10:00');
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'This class overlaps with another class in your schedule.');
    cy.get('@addClass.all').should('have.length', 0);
  });

  it('detecta el cruce también con clases de otra asignatura', () => {
    cy.seedSubject(token, 'Física', 'Pérez').then(({ id }) => cy.seedClass(token, id, 'monday', '09:00', '11:00'));
    abrirModal();
    cy.choose('class-day', 'Monday');
    cy.choose('class-start', '10:00');
    cy.choose('class-end', '12:00');
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('contain.text', 'overlaps');
  });

  it('permite corregir el error y guardar', () => {
    abrirModal();
    cy.choose('class-start', '15:00');
    cy.choose('class-end', '14:00');
    cy.get('[data-cy=class-save]').click();
    cy.get('[data-cy=class-error]').should('have.length', 1);
    cy.choose('class-end', '16:00');
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClass').its('response.statusCode').should('eq', 201);
    cy.get('[data-cy=class-error]').should('not.exist');
  });

  it('cancela y cierra el modal sin crear la clase', () => {
    abrirModal();
    cy.choose('class-day', 'Friday');
    cy.get('[data-cy=class-cancel]').click();
    cy.get('[data-cy=class-modal]').should('not.exist');
    cy.get('@addClass.all').should('have.length', 0);
  });

  it('muestra Edit y Delete en el menú contextual y lo cierra al hacer clic fuera', () => {
    cy.seedClass(token, subjectId, 'monday', '08:00', '09:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').first().trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=menu-edit]').should('have.text', 'Edit');
    cy.get('[data-cy=menu-delete]').should('have.text', 'Delete');
    cy.get('[data-cy=next-class]').click({ force: true });
    cy.get('[data-cy=context-menu]').should('not.exist');
    cy.get('[data-cy=class-modal]').should('not.exist');
  });

  it('bloquea el scroll mientras el modal de edición está abierto', () => {
    cy.seedClass(token, subjectId, 'monday', '08:00', '09:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').first().trigger('contextmenu', { clientX: 300, clientY: 300 });
    cy.get('[data-cy=menu-edit]').click();
    cy.get('body').should('have.css', 'overflow', 'hidden');
    cy.get('[data-cy=class-cancel]').click();
    cy.get('body').should('not.have.css', 'overflow', 'hidden');
  });
});
