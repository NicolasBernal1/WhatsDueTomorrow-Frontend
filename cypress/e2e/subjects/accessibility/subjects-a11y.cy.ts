import '../../../support/subjects-commands';
/** Accesibilidad con cypress-axe (WCAG 2.0/2.1 A y AA). */
const opts = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } };

function logViolations(violations: any[]) {
  const rows = violations.map(({ id, impact, help, nodes }) => ({
    id, impact, help, nodos: nodes.map((n: any) => n.target.join(' ')),
  }));
  cy.log(JSON.stringify(rows));
  // Evidencia: queda en cypress/reports/a11y-<hora>.json
  cy.writeFile(`cypress/reports/a11y-${Date.now()}.json`, rows);
}

describe('Asignaturas — Accesibilidad', () => {
  let token: string;
  before(() => {
    cy.createAccount().then((a) => {
      token = a.token;
      cy.createSubject(token, { name: 'Ciencias', professor: 'Marco' });
    });
  });

  it('Lista de asignaturas sin violaciones críticas/serias', () => {
    cy.visitAs(token);
    cy.get('mat-card.subject-card').should('exist');
    cy.injectAxe();
    cy.checkA11y(undefined, { ...opts, includedImpacts: ['critical', 'serious'] }, logViolations);
  });

  it('Modal "Add New Subject" sin violaciones críticas/serias', () => {
    cy.visitAs(token);
    cy.contains('button', /add/i).click();
    cy.contains('h2', 'Add New Subject');
    cy.injectAxe();
    cy.checkA11y(undefined, { ...opts, includedImpacts: ['critical', 'serious'] }, logViolations);
  });

  it('Detalle de asignatura sin violaciones críticas/serias', () => {
    cy.visitAs(token);
    cy.contains('mat-card.subject-card', 'Ciencias').click();
    cy.get('mat-card.subject-header').should('exist');
    cy.injectAxe();
    cy.checkA11y(undefined, { ...opts, includedImpacts: ['critical', 'serious'] }, logViolations);
  });

  it('El buscador es operable con teclado', () => {
    cy.visitAs(token);
    cy.get('#subject-search').focus().should('be.focused').type('Cien');
  });
});
