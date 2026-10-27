import '../../support/commands';

describe('Asignaturas — API', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;
  let auth: { Authorization: string };

  before(() => {
    cy.createAccount().then((a) => (auth = { Authorization: `Bearer ${a.token}` }));
  });

  it('POST /subjects crea una materia (200/201) y aparece en el listado', () => {
    cy.request({ method: 'POST', url: `${api()}/subjects`, headers: auth,
      body: { name: 'API Mat', professor: 'Prof API', credits: 3, color: '#3f51b5' } })
      .then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        expect(res.body).to.have.property('message');
      });
    cy.request({ url: `${api()}/subjects`, headers: auth }).then((res) => {
      const list = res.body?.data ?? res.body;
      const s = list.find((x: any) => x.name === 'API Mat');
      expect(s).to.include({ professor: 'Prof API', credits: 3 });
    });
  });

  it('GET /subjects devuelve una lista', () => {
    cy.request({ url: `${api()}/subjects`, headers: auth }).then((res) => {
      expect(res.status).to.eq(200);
      const list = res.body?.data ?? res.body;
      expect(list).to.be.an('array').and.not.be.empty;
    });
  });

  it('GET /subjects/search?q= filtra por nombre', () => {
    cy.request({ url: `${api()}/subjects/search?q=API`, headers: auth }).then((res) => {
      expect(res.status).to.eq(200);
      const list = res.body?.data ?? res.body;
      expect(list.length).to.be.greaterThan(0);
    });
  });

  it('PATCH /subjects/:id actualiza y DELETE /subjects/:id elimina', () => {
    cy.createSubject(auth.Authorization.replace('Bearer ', ''), { name: 'Tmp', professor: 'Tmp', credits: 2 })
      .then((sub: any) => {
        const id = sub.id;
        cy.request({ method: 'PATCH', url: `${api()}/subjects/${id}`, headers: auth, body: { name: 'Tmp2' } })
          .its('status').should('be.oneOf', [200, 204]);
        cy.request({ method: 'DELETE', url: `${api()}/subjects/${id}`, headers: auth })
          .its('status').should('be.oneOf', [200, 204]);
        cy.request({ url: `${api()}/subjects/${id}`, headers: auth, failOnStatusCode: false })
          .its('status').should('be.oneOf', [404, 400]);
      });
  });

  it('POST /subjects con créditos fuera de rango es rechazado (4xx)', () => {
    cy.request({ method: 'POST', url: `${api()}/subjects`, headers: auth, failOnStatusCode: false,
      body: { name: 'X', professor: 'Y', credits: 99999, color: '#3f51b5' } })
      .its('status').should('be.within', 400, 499);
  });
});
