import '../../support/commands';

describe('Usuario — Regresión', () => {
  const bell = 'button[aria-label="Upcoming assignments"]';
  const badge = `${bell} .mat-badge-content`;

  it('Flujo completo: registrarse → campana → perfil → cambiar contraseña → iniciar sesión → cerrar sesión', () => {
    const email = `cy.reg.${Date.now()}@test.com`;
    const nueva = 'Nueva#456';

    // F01
    cy.visit('/register');
    cy.get('input[formcontrolname=name]').type('Ana Gomez');
    cy.get('input[formcontrolname=email]').type(email);
    cy.get('input[formcontrolname=password]').type('Cypress#123');
    cy.get('button[type=submit]').click();
    cy.location('pathname').should('eq', '/schedule');

    // F06: sin tareas → insignia oculta; con una tarea en 3 h → 1
    cy.get(badge).should('not.be.visible');
    cy.window().its('localStorage.token').then((token: string) => {
      cy.createSubject(token, { name: 'Calculo', professor: 'Marco' }).then((s) =>
        cy.createAssignmentDueIn(token, s.id, 'Parcial', 3));
    });
    cy.reload();
    cy.get(badge).should('have.text', '1');

    // F04
    cy.openProfileMenu();
    cy.get('.profile-info h3').should('have.text', 'Ana Gomez');
    cy.get('.profile-info p').should('have.text', email);

    // F05 → cierra sesión sola
    cy.contains('mat-form-field', 'Current password').find('input').type('Cypress#123');
    cy.contains('button', 'Verify Password').click();
    cy.contains('mat-form-field', 'New password').find('input').type(nueva);
    cy.contains('button', 'Change Password').click();
    cy.location('pathname').should('eq', '/login');

    // F02 con la nueva contraseña: la campana conserva la tarea
    cy.loginByUI(email, nueva);
    cy.location('pathname').should('eq', '/schedule');
    cy.get(badge).should('have.text', '1');

    // F03
    cy.openProfileMenu();
    cy.contains('button', 'Log Out').click();
    cy.location('pathname').should('eq', '/login');
    cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
  });

  it('F02/F03: la sesión sobrevive a recargar la página y solo se pierde al cerrar sesión', () => {
    cy.createAccount().then(({ email, password }) => {
      cy.loginByUI(email, password);
      cy.location('pathname').should('eq', '/schedule');
      cy.reload();
      cy.location('pathname').should('eq', '/schedule');
      cy.get('mat-toolbar').should('be.visible');
      cy.openProfileMenu();
      cy.contains('button', 'Log Out').click();
      cy.reload();
      cy.location('pathname').should('eq', '/login');
    });
  });

  it('F05: tras un intento con la contraseña incorrecta, el reintento con la correcta funciona', () => {
    cy.createAccount().then(({ token, password }) => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      const actual = () => cy.contains('mat-form-field', 'Current password').find('input');
      actual().type('incorrecta');
      cy.contains('button', 'Verify Password').click();
      cy.contains('.error-message', 'Incorrect password');
      actual().clear().type(password);
      cy.contains('button', 'Verify Password').click();
      cy.get('.verified-message').should('exist');
      cy.contains('.error-message', 'Incorrect password').should('not.exist');
    });
  });

  it('F03/F04/F06: al cambiar de cuenta no quedan datos de la anterior (perfil ni campana)', () => {
    cy.createAccount().then((ana) => {
      cy.createSubject(ana.token, { name: 'Calculo' }).then((s) => cy.createAssignmentDueIn(ana.token, s.id, 'De Ana', 3));
      cy.createAccount().then((beto) => {
        cy.loginByUI(ana.email, ana.password);
        cy.get(badge).should('have.text', '1');
        cy.openProfileMenu();
        cy.get('.profile-info p').should('have.text', ana.email);
        cy.contains('button', 'Log Out').click();

        cy.loginByUI(beto.email, beto.password);
        cy.location('pathname').should('eq', '/schedule');
        cy.get(badge).should('not.be.visible');
        cy.openProfileMenu();
        cy.get('.profile-info p').should('have.text', beto.email);
      });
    });
  });
});