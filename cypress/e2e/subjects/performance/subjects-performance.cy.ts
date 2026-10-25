import '../../../support/subjects-commands';
/** Rendimiento: umbrales holgados (el back en Render puede tardar en despertar). */
describe('Asignaturas — Rendimiento', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;
  let token: string;

  before(() => {
    cy.createAccount().then((a) => {
      token = a.token;
      cy.createSubject(token);
    });
  });

  it('GET /subjects responde en menos de 3 s', () => {
    cy.request({ url: `${api()}/subjects`, headers: { Authorization: `Bearer ${token}` } })
      .its('duration').should('be.lessThan', 3000);
  });

  it('GET /subjects/search responde en menos de 3 s', () => {
    cy.request({ url: `${api()}/subjects/search?q=Cien`, headers: { Authorization: `Bearer ${token}` } })
      .its('duration').should('be.lessThan', 3000);
  });

  it('La lista de asignaturas carga en menos de 8 s (navegación completa)', () => {
    const t0 = Date.now();
    cy.visitAs(token);
    cy.get('mat-card.subject-card').should('exist').then(() => {
      expect(Date.now() - t0).to.be.lessThan(8000);
    });
  });

  it('5 consultas seguidas mantienen un promedio < 3 s', () => {
    const times: number[] = [];
    for (let i = 0; i < 5; i++) {
      cy.request({ url: `${api()}/subjects`, headers: { Authorization: `Bearer ${token}` } })
        .then((r) => times.push(r.duration));
    }
    cy.then(() => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avg).to.be.lessThan(3000);
    });
  });
});
