describe('Regresión: agregar clase', () => {
  let token: string;
  let subjectId: number;
  beforeEach(() => {
    cy.registerStudent('Alicia Agregar').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then((s) => { subjectId = s.id; });
    cy.intercept('POST', '**/subjects/classes').as('addClass');
  });

  it('agrega una clase desde los detalles de la asignatura y la ve en el horario', () => {
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=add-class-btn]').click();
    cy.get('[data-cy=class-modal-title]').should('have.text', 'Add Class Schedule');
    cy.choose('class-day', 'Tuesday');
    cy.choose('class-start', '14:00');
    cy.choose('class-end', '15:00');
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClass').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body).to.deep.equal({ dayOfWeek: 'tuesday', startTime: '14:00', endTime: '15:00', subjectId });
    });
    cy.get('[data-cy=class-modal]').should('not.exist');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', 1);
    cy.get('[data-cy=class-name]').should('have.text', 'Cálculo');
    cy.get('[data-cy=class-time]').should('contain.text', '14:00').and('contain.text', '15:00');
  });

  it('permite varias clases en la misma asignatura', () => {
    cy.seedClass(token, subjectId, 'monday', '08:00', '09:00');
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=add-class-btn]').click();
    cy.choose('class-day', 'Wednesday');
    cy.choose('class-start', '10:00');
    cy.choose('class-end', '11:00');
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClass').its('response.statusCode').should('eq', 201);
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', 2);
    cy.get('[data-cy=class-name]').each(($n) => expect($n.text()).to.eq('Cálculo'));
  });

  it('guarda con los valores por defecto del modal (lunes 06:00 - 08:00)', () => {
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=add-class-btn]').click();
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClass').its('request.body').should('deep.equal', { dayOfWeek: 'monday', startTime: '06:00', endTime: '08:00', subjectId });
  });

  it('acepta una clase que empieza justo cuando termina otra', () => {
    cy.seedClass(token, subjectId, 'monday', '09:00', '10:00');
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=add-class-btn]').click();
    cy.choose('class-day', 'Monday');
    cy.choose('class-start', '10:00');
    cy.choose('class-end', '11:00');
    cy.get('[data-cy=class-save]').click();
    cy.wait('@addClass').its('response.statusCode').should('eq', 201);
  });
});
