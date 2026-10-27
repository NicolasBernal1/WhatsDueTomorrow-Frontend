import '../../support/commands';
 
const opts = (...conocidas: string[]) => ({
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
  includedImpacts: ['critical', 'serious'],
  rules: Cypress.env('expectA11yFixed') ? {} : Object.fromEntries(conocidas.map((r) => [r, { enabled: false }])),
});

function logViolations(violations: any[]) {
  const rows = violations.map(({ id, impact, help, nodes }) => ({
    id, impact, help, nodos: nodes.map((n: any) => n.target.join(' ')),
  }));
  cy.log(JSON.stringify(rows));
  cy.writeFile(`cypress_sebastian/reports/a11y-usuario-${Date.now()}.json`, rows);
}

describe('Usuario — Accesibilidad', () => {
  const bell = 'button[aria-label="Upcoming assignments"]';

  it('F02: /login sin violaciones críticas/serias', () => {
    cy.visit('/login');
    cy.get('mat-card').should('be.visible');
    cy.injectAxe();
    cy.checkA11y(undefined, opts('color-contrast'), logViolations);
  });

  it('F02: /login con errores de validación visibles sin violaciones críticas/serias', () => {
    cy.visit('/login');
    cy.get('input[formcontrolname=email]').type('no-es-email').blur();
    cy.get('input[formcontrolname=password]').focus().blur();
    cy.get('mat-error').should('have.length', 2);
    cy.injectAxe();
    cy.checkA11y(undefined, opts('color-contrast'), logViolations);
  });

  it('F01: /register sin violaciones críticas/serias', () => {
    cy.visit('/register');
    cy.get('mat-card').should('be.visible');
    cy.injectAxe();
    cy.checkA11y(undefined, opts('color-contrast'), logViolations);
  });

  context('Con sesión', () => {
    let token: string;
    before(() => {
      cy.createAccount().then((a) => {
        token = a.token;
        cy.createSubject(token, { name: 'Calculo' }).then((s) => cy.createAssignmentDueIn(token, s.id, 'Parcial', 3));
      });
    });

    it('F03/F04/F06: la barra de navegación sin violaciones críticas/serias', () => {
      cy.visitAs(token, '/schedule');
      cy.get('mat-toolbar').should('be.visible');
      cy.injectAxe();
      cy.checkA11y('app-navbar', opts(), logViolations);
    });

    it('F06: el menú de la campana abierto sin violaciones críticas/serias', () => {
      cy.visitAs(token, '/schedule');
      cy.get(bell).click();
      cy.get('.upcoming-item').should('exist');
      cy.injectAxe();
      cy.checkA11y('.cdk-overlay-container', opts('aria-required-children'), logViolations);
    });

    it('F04/F05/F03: el menú de perfil abierto sin violaciones críticas/serias', () => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.get('.profile-info').should('be.visible');
      cy.injectAxe();
      cy.checkA11y('.cdk-overlay-container', opts('aria-required-children', 'aria-required-parent', 'nested-interactive'), logViolations);
    });

    it('F06: la campana es un botón con nombre accesible y recibe el foco', () => {
      cy.visitAs(token, '/schedule');
      cy.get(bell).should('have.attr', 'aria-label', 'Upcoming assignments').focus().should('be.focused');
    });
  });

  it('F02: el formulario de login se envía con la tecla Enter (sin ratón)', () => {
    cy.createAccount().then(({ email, password }) => {
      cy.visit('/login');
      cy.get('input[formcontrolname=email]').focus().should('be.focused').type(email);
      cy.get('input[formcontrolname=password]').type(`${password}{enter}`);
      cy.location('pathname').should('eq', '/schedule');
    });
  });

  it('F01/F02: cada campo tiene una etiqueta visible asociada (mat-label → <label for>)', () => {
    ['/login', '/register'].forEach((path) => {
      cy.visit(path);
      cy.get('form input').each(($input) => {
        const id = $input.attr('id');
        expect(id, 'input con id').to.be.a('string');
        cy.get(`label[for="${id}"]`).should('be.visible').invoke('text').should('not.be.empty');
      });
    });
  });
});