import { clicYMedir, medirRenderAlCargar, presupuesto } from '../../support/performance';

describe('Rendimiento del horario con datos reales', () => {
  let token: string;
  let subjectId: number;
  const CLASES = 15;

  before(() => {
    cy.registerStudent('Alicia Rendimiento').then((s) => { token = s.token; });
    cy.then(() => cy.seedSubject(token, 'Cálculo', 'Gómez')).then((s) => { subjectId = s.id; });
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((dia) => {
      ['08', '10', '12'].forEach((h) => cy.then(() => cy.seedClass(token, subjectId, dia, `${h}:00`, `${Number(h) + 1}:00`.padStart(5, '0'))));
    });
  });

  it('pinta el horario con 15 clases dentro del presupuesto', () => {
    cy.visit('/schedule', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('token', token);
        medirRenderAlCargar(win, '__horarioMs', '[data-cy=class-card]', CLASES);
      },
    });
    cy.get('[data-cy=class-card]').should('have.length', CLASES);
    cy.window().its('__horarioMs').should('be.lessThan', presupuesto(8000));
  });

  it('abre el detalle de la asignatura en menos de 3 s desde el clic', () => {
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', CLASES);
    cy.get('[data-cy=class-card]').first().then(($c) => {
      clicYMedir($c, '__detalleMs', (doc) => !!doc.querySelector('[data-cy=subject-title]')?.textContent?.includes('Cálculo'));
    });
    cy.window().its('__detalleMs').should('be.lessThan', presupuesto(3000));
  });

  it('detecta un cruce en el modal en menos de 500 ms con 15 clases', () => {
    cy.visitAs(token, `/subjects/${subjectId}`);
    cy.get('[data-cy=add-class-btn]').click();
    cy.choose('class-day', 'Monday');
    cy.choose('class-start', '08:00');
    cy.choose('class-end', '09:00');
    cy.get('[data-cy=class-save]').then(($s) => {
      clicYMedir($s, '__cruceMs', (doc) => !!doc.querySelector('[data-cy=class-error]'));
    });
    cy.window().its('__cruceMs').should('be.lessThan', presupuesto(500));
    cy.get('[data-cy=class-error]').should('contain.text', 'overlaps');
  });

  it('el horario hace una sola petición de clases al cargar', () => {
    cy.intercept('GET', '**/subjects/classes').as('classes');
    cy.visitAs(token, '/schedule');
    cy.get('[data-cy=class-card]').should('have.length', CLASES);
    cy.get('@classes.all').should('have.length', 1);
  });
});
