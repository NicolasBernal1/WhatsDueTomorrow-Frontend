import '../../support/commands';
/**
 * UI — F01..F06 de punta a punta: front real + backend real (sin stubs).
 * Títulos en estilo Gherkin (Dado/Cuando/Entonces).
 */
describe('Usuario — Flujos F01–F06', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;
  const uniqueEmail = () => `cy.seb.${Date.now()}${Cypress._.random(999)}@test.com`;
  const bell = 'button[aria-label="Upcoming assignments"]';

  it('F01: Dado un visitante, cuando se registra con datos válidos, entonces entra a /schedule con la sesión iniciada', () => {
    cy.intercept('POST', '**/auth/register').as('register');
    cy.intercept('POST', '**/auth/login').as('login');
    cy.visit('/register');
    cy.get('input[formcontrolname=name]').type('Ana Gomez');
    cy.get('input[formcontrolname=email]').type(uniqueEmail());
    cy.get('input[formcontrolname=password]').type('Cypress#123', { log: false });
    cy.get('button[type=submit]').click();
    cy.wait('@register').its('response.statusCode').should('eq', 201);
    cy.wait('@login').its('response.statusCode').should('eq', 201); // Nest: @Post sin @HttpCode responde 201
    cy.location('pathname').should('eq', '/schedule');
    cy.window().its('localStorage.token').should('be.a', 'string').and('not.be.empty');
  });

  it('F02: Dado un estudiante registrado, cuando inicia sesión, entonces llega a /schedule y ve la barra de navegación', () => {
    cy.createAccount().then(({ email, password }) => {
      cy.loginByUI(email, password);
      cy.location('pathname').should('eq', '/schedule');
      cy.get('mat-toolbar').should('contain.text', "What's Due Tomorrow?");
      cy.get(bell).should('be.visible');
    });
  });

  it('F03: Dado un estudiante con sesión, cuando cierra sesión, entonces vuelve a /login y ya no puede entrar a /schedule', () => {
    cy.createAccount().then(({ token }) => {
      cy.visitAs(token);
      cy.openProfileMenu();
      cy.contains('button', 'Log Out').click();
      cy.location('pathname').should('eq', '/login');
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
      cy.get('mat-toolbar').should('not.exist');
      cy.visit('/schedule');
      cy.location('pathname').should('eq', '/login');
    });
  });

  it('F04: Dado un estudiante con sesión, cuando abre su perfil, entonces ve su nombre y su correo', () => {
    cy.createAccount().then(({ token, email }) => {
      cy.intercept('GET', '**/users/profile').as('profile');
      cy.visitAs(token);
      cy.openProfileMenu();
      cy.wait('@profile').its('response.statusCode').should('eq', 200);
      cy.get('.profile-info h3').should('have.text', 'Cypress Tester');
      cy.get('.profile-info p').should('have.text', email);
    });
  });

  it('F05: Dado un estudiante con sesión, cuando cambia su contraseña, entonces se cierra la sesión y solo vale la nueva', () => {
    cy.createAccount().then(({ token, email, password }) => {
      const nueva = 'Nueva#456';
      cy.visitAs(token);
      cy.openProfileMenu();
      cy.contains('mat-form-field', 'Current password').find('input').type(password, { log: false });
      cy.contains('button', 'Verify Password').click();
      cy.get('.verified-message').should('contain.text', 'Current password verified');
      cy.contains('mat-form-field', 'New password').find('input').type(nueva, { log: false });
      cy.contains('button', 'Change Password').click();
      cy.contains('.mat-mdc-snack-bar-label', 'Password changed successfully.');
      cy.location('pathname').should('eq', '/login');

      cy.request({ method: 'POST', url: `${api()}/auth/login`, body: { email, password }, failOnStatusCode: false })
        .its('status').should('eq', 401);
      cy.loginByUI(email, nueva);
      cy.location('pathname').should('eq', '/schedule');
    });
  });

  it('F06: Dado una tarea que vence en 3 horas, cuando el estudiante entra, entonces la campana la cuenta y la muestra', () => {
    cy.createAccount().then(({ token }) => {
      cy.createSubject(token, { name: 'Calculo' }).then((s) => {
        cy.createAssignmentDueIn(token, s.id, 'Taller de Calculo', 3);
      });
      cy.visitAs(token);
      cy.get(`${bell} .mat-badge-content`).should('have.text', '1');
      cy.get(bell).click();
      cy.get('.upcoming-content h4').should('have.text', 'Due soon');
      cy.get('.upcoming-item').should('have.length', 1).first().within(() => {
        cy.get('strong').should('have.text', 'Taller de Calculo');
        cy.get('span').should('contain.text', 'Calculo ·');
      });
    });
  });

  it('F06: Dado tareas a 2 h, 30 h, 60 h y una vencida, entonces la campana solo muestra las 2 dentro de 48 h', () => {
    cy.createAccount().then(({ token }) => {
      cy.createSubject(token, { name: 'Fisica' }).then((s) => {
        cy.createAssignmentDueIn(token, s.id, 'En 2 horas', 2);
        cy.createAssignmentDueIn(token, s.id, 'En 30 horas', 30);
        cy.createAssignmentDueIn(token, s.id, 'En 60 horas', 60);
        cy.createAssignmentDueIn(token, s.id, 'Vencida', -5);
      });
      cy.visitAs(token);
      cy.get(`${bell} .mat-badge-content`).should('have.text', '2');
      cy.get(bell).click();
      cy.get('.upcoming-item strong').then(($t) => {
        expect([...$t].map((e) => e.textContent)).to.deep.eq(['En 2 horas', 'En 30 horas']);
      });
    });
  });
});