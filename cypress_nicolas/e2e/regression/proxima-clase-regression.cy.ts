const miercoles1030 = () => new Date(2026, 9, 21, 10, 30).getTime();

describe('Regresión: ver próxima clase', () => {
  let token: string;
  let calculoId: number;
  let fisicaId: number;
  beforeEach(() => {
    cy.registerStudent('Alicia Proxima').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then((s) => { calculoId = s.id; });
    cy.then(() => cy.seedSubject(token, 'Física', 'Pérez')).then((s) => { fisicaId = s.id; });
  });

  it('muestra la clase más cercana con su profesor y horario', () => {
    cy.clock(miercoles1030(), ['Date']);
    cy.seedClass(token, fisicaId, 'friday', '08:00', '09:00');
    cy.seedClass(token, calculoId, 'thursday', '10:00', '11:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-subject]').should('have.text', 'Cálculo');
    cy.get('[data-cy=next-class-professor]').should('have.text', 'Gómez');
    cy.get('[data-cy=next-class-time]').should('contain.text', 'Tomorrow').and('contain.text', '10:00').and('contain.text', '11:00');
  });

  it('avisa cuando no hay clases programadas', () => {
    cy.clock(miercoles1030(), ['Date']);
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-empty]').should('have.text', 'You do not have more classes.');
    cy.get('[data-cy=next-class-card]').should('not.exist');
  });

  it('etiqueta como Today una clase de hoy que aún no empieza', () => {
    cy.clock(miercoles1030(), ['Date']);
    cy.seedClass(token, calculoId, 'wednesday', '14:00', '15:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-time]').should('contain.text', 'Today').and('contain.text', '14:00');
  });

  it('usa el nombre del día cuando la clase no es hoy ni mañana', () => {
    cy.clock(miercoles1030(), ['Date']);
    cy.seedClass(token, fisicaId, 'saturday', '09:00', '11:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-time]').should('contain.text', 'Saturday');
  });

  it('no toma como próxima la clase que ya está en curso', () => {
    cy.clock(miercoles1030(), ['Date']);
    cy.seedClass(token, calculoId, 'wednesday', '09:00', '11:00');
    cy.seedClass(token, fisicaId, 'thursday', '08:00', '09:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-subject]').should('have.text', 'Física');
    cy.get('[data-cy=now-badge]').should('exist');
  });

  it('elige la más temprana cuando hay dos clases el mismo día', () => {
    cy.clock(miercoles1030(), ['Date']);
    cy.seedClass(token, fisicaId, 'wednesday', '16:00', '17:00');
    cy.seedClass(token, calculoId, 'wednesday', '12:00', '13:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-subject]').should('have.text', 'Cálculo');
    cy.get('[data-cy=next-class-time]').should('contain.text', '12:00');
  });

  it('salta a la semana siguiente cuando ya pasaron las clases de esta semana', () => {
    cy.clock(miercoles1030(), ['Date']);
    cy.seedClass(token, calculoId, 'monday', '08:00', '09:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-subject]').should('have.text', 'Cálculo');
    cy.get('[data-cy=next-class-time]').should('contain.text', 'Monday');
  });

  it('el domingo por la noche la clase del lunes es Tomorrow', () => {
    cy.clock(new Date(2026, 9, 25, 22, 30).getTime(), ['Date']); // domingo 22:30
    cy.seedClass(token, calculoId, 'monday', '06:00', '07:00');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=next-class-time]').should('contain.text', 'Tomorrow').and('contain.text', '06:00');
  });
});
