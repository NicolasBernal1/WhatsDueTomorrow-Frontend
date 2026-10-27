import '../../support/commands';
describe('Asignaturas — Seguridad', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;

  it('Sin token, GET /subjects responde 401 (rechazo explícito)', () => {
    cy.request({ url: `${api()}/subjects`, failOnStatusCode: false }).its('status').should('eq', 401);
  });

  it('Con token falso, GET /subjects responde 401', () => {
    cy.request({ url: `${api()}/subjects`, failOnStatusCode: false,
      headers: { Authorization: 'Bearer token.falso.123' } }).its('status').should('eq', 401);
  });

  it('Sin sesión, /subjects en el front no muestra datos de materias', () => {
    cy.visit('/subjects');
    cy.get('mat-card.subject-card').should('not.exist');
  });

  it('XSS: un nombre con <script> se muestra como texto y no se ejecuta', () => {
    const payload = '<img src=x onerror="window.__xss=1">Hack';
    cy.createAccount().then(({ token }) => {
      cy.createSubject(token, { name: payload, professor: 'Prof' });
      cy.visitAs(token);
      cy.get('mat-card.subject-card h3').should('contain.text', 'Hack');
      cy.window().its('__xss').should('be.undefined');
    });
  });

  it('Inyección SQL en búsqueda no rompe el servidor (sin 5xx)', () => {
    cy.createAccount().then(({ token }) => {
      cy.request({ url: `${api()}/subjects/search?q=${encodeURIComponent("' OR 1=1; --")}`,
        headers: { Authorization: `Bearer ${token}` }, failOnStatusCode: false })
        .its('status').should('be.lessThan', 500);
    });
  });

  it('IDOR: un usuario no puede leer/editar/borrar la materia de otro (403/404)', function () {
    if (!(Cypress.env('expectIdorFixed') ?? true)) this.skip();
    cy.createAccount().then((owner) => {
      cy.createSubject(owner.token, { name: 'Privada' }).then((s) => {
        cy.createAccount().then((intruder) => {
          const h = { Authorization: `Bearer ${intruder.token}` };
          ['GET', 'PATCH', 'DELETE'].forEach((method) => {
            cy.request({ method, url: `${api()}/subjects/${s.id}`, headers: h,
              body: method === 'PATCH' ? { name: 'Hackeada' } : undefined, failOnStatusCode: false })
              .its('status').should('be.oneOf', [403, 404]);
          });
        });
      });
    });
  });
});
