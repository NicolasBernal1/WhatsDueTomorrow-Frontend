import '../../support/commands';

describe('Usuario — Rendimiento', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  let cuenta: { email: string; password: string; token: string };

  before(() => {
    cy.createAccount().then((a) => {
      cuenta = a;
      cy.createSubject(a.token, { name: 'Calculo' }).then((s) => cy.createAssignmentDueIn(a.token, s.id, 'Parcial', 3));
    });
  });

  it('F01: POST /auth/register responde en menos de 3 s', () => {
    cy.request('POST', `${api()}/auth/register`, {
      name: 'Ana Gomez', email: `cy.seb.perf.${Date.now()}@test.com`, password: 'Cypress#123',
    }).its('duration').should('be.lessThan', 3000);
  });

  it('F02: POST /auth/login responde en menos de 3 s', () => {
    cy.request('POST', `${api()}/auth/login`, { email: cuenta.email, password: cuenta.password })
      .its('duration').should('be.lessThan', 3000);
  });

  it('F04: GET /users/profile responde en menos de 2 s', () => {
    cy.request({ url: `${api()}/users/profile`, headers: auth(cuenta.token) })
      .its('duration').should('be.lessThan', 2000);
  });

  it('F05: PATCH /auth/verify-password responde en menos de 3 s', () => {
    cy.request({ method: 'PATCH', url: `${api()}/auth/verify-password`, headers: auth(cuenta.token), body: { password: cuenta.password } })
      .its('duration').should('be.lessThan', 3000);
  });

  it('F06: GET /assignments/upcoming responde en menos de 2 s', () => {
    cy.request({ url: `${api()}/assignments/upcoming`, headers: auth(cuenta.token) })
      .its('duration').should('be.lessThan', 2000);
  });

  it('F06: 5 consultas seguidas a /assignments/upcoming mantienen un promedio < 2 s', () => {
    const times: number[] = [];
    Cypress._.times(5, () => {
      cy.request({ url: `${api()}/assignments/upcoming`, headers: auth(cuenta.token) }).then((r) => times.push(r.duration));
    });
    cy.then(() => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      cy.log(`promedio: ${Math.round(avg)} ms`);
      expect(avg).to.be.lessThan(2000);
    });
  });

  it('F02: el formulario de login aparece en menos de 5 s', () => {
    const t0 = Date.now();
    cy.visit('/login');
    cy.get('input[formcontrolname=email]').should('be.visible').then(() => {
      expect(Date.now() - t0).to.be.lessThan(5000);
    });
  });

  it('F02 → F06: de enviar el login a ver la campana con su contador pasan menos de 8 s', () => {
    cy.visit('/login');
    cy.get('input[formcontrolname=email]').type(cuenta.email);
    cy.get('input[formcontrolname=password]').type(cuenta.password, { log: false });
    cy.then(() => {
      const t0 = Date.now();
      cy.get('button[type=submit]').click();
      cy.get('button[aria-label="Upcoming assignments"] .mat-badge-content').should('have.text', '1').then(() => {
        expect(Date.now() - t0).to.be.lessThan(8000);
      });
    });
  });

  it('F04: el menú de perfil muestra los datos en menos de 3 s', () => {
    cy.visitAs(cuenta.token);
    cy.get('mat-toolbar').should('be.visible');
    cy.then(() => {
      const t0 = Date.now();
      cy.contains('button', 'Profile').click();
      cy.get('.profile-info p').should('have.text', cuenta.email).then(() => {
        expect(Date.now() - t0).to.be.lessThan(3000);
      });
    });
  });
});