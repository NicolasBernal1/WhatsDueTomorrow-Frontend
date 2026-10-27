import '../../support/commands';
describe('Asignaturas — E2E UI', () => {
  let token: string;

  beforeEach(() => {
    cy.createAccount().then((acc) => {
      token = acc.token;
    });
  });

  it('F07: Dado un usuario sin materias, cuando abre /subjects, entonces ve el mensaje vacío', () => {
    cy.visitAs(token);
    cy.get('p.empty').should('contain.text', 'You have no subjects yet');
  });

  it('F07: Dado un usuario con una materia, cuando abre /subjects, entonces ve su tarjeta con créditos', () => {
    cy.createSubject(token, { name: 'Ciencias', professor: 'Marco', credits: 4 });
    cy.visitAs(token);
    cy.get('mat-card.subject-card').should('have.length', 1).first().within(() => {
      cy.get('h3').should('have.text', 'Ciencias');
      cy.contains('Marco');
      cy.get('span.credit-badge').should('contain.text', '4 cr.');
    });
  });

  it('F08: Dado una materia, cuando hace clic en su tarjeta, entonces ve el detalle', () => {
    cy.createSubject(token, { name: 'Ciencias', professor: 'Marco' });
    cy.visitAs(token);
    cy.contains('mat-card.subject-card', 'Ciencias').click();
    cy.location('pathname').should('match', /\/subjects\/[\w-]+$/);
    cy.get('mat-card.subject-header mat-card-title').should('contain.text', 'Ciencias');
    cy.get('mat-card.subject-header mat-card-subtitle').should('contain.text', 'Marco');
  });

  it('F09: Dado el formulario, cuando ingresa datos válidos y guarda, entonces la materia aparece', () => {
    cy.visitAs(token);
    cy.contains('button', /add/i).click();
    cy.contains('h2', 'Add New Subject').should('be.visible');
    cy.get('input[formcontrolname=name]').type('Ciencias');
    cy.get('input[formcontrolname=professor]').type('Marco');
    cy.get('input[formcontrolname=credits]').clear().type('4');
    cy.get('button[type=submit]').should('not.be.disabled').click();
    cy.contains('mat-card.subject-card', 'Ciencias').should('contain.text', 'Marco');
  });

  it('F09: Dado el formulario, cuando ingresa datos inválidos, entonces ve los errores y no puede guardar', () => {
    cy.visitAs(token);
    cy.contains('button', /add/i).click();
    cy.get('input[formcontrolname=name]').type('431251351').blur();
    cy.get('input[formcontrolname=professor]').type('14515').blur();
    cy.get('input[formcontrolname=credits]').clear().type('33145135').blur();
    cy.contains('Name must contain at least one letter');
    cy.contains('Professor must contain at least one letter');
    cy.contains(/Credits must be a whole number between 1 and 12|Los créditos deben ser un entero entre 1 y 12/);
    cy.get('button[type=submit]').should('be.disabled');
  });

  it('F10: Dado una materia, cuando la edita con clic derecho, entonces se actualizan sus datos', () => {
    cy.createSubject(token, { name: 'Ciencias', professor: 'Marco' });
    cy.visitAs(token);
    cy.contains('mat-card.subject-card', 'Ciencias').rightclick();
    cy.get('.context-menu').contains('button', 'Edit').click();
    cy.contains('h2', 'Edit Subject');
    cy.get('input[formcontrolname=name]').clear().type('Maths');
    cy.get('input[formcontrolname=professor]').clear().type('Sebastian');
    cy.get('button[type=submit]').click();
    cy.contains('mat-card.subject-card', 'Maths').should('contain.text', 'Sebastian');
    cy.contains('mat-card.subject-card', 'Ciencias').should('not.exist');
  });

  it('F11: Dado una materia, cuando la elimina y confirma, entonces desaparece de la lista', () => {
    cy.createSubject(token, { name: 'Matematicas', professor: 'Marcello' });
    cy.visitAs(token);
    cy.on('window:confirm', (msg) => {
      expect(msg).to.equal('Delete subject?');
      return true;
    });
    cy.contains('mat-card.subject-card', 'Matematicas').rightclick();
    cy.get('.context-menu').contains('button', 'Delete').click();
    cy.contains('mat-card.subject-card', 'Matematicas').should('not.exist');
  });

  it('F11: Dado una materia, cuando cancela la confirmación, entonces la materia permanece', () => {
    cy.createSubject(token, { name: 'Matematicas', professor: 'Marcello' });
    cy.visitAs(token);
    cy.on('window:confirm', () => false);
    cy.contains('mat-card.subject-card', 'Matematicas').rightclick();
    cy.get('.context-menu').contains('button', 'Delete').click();
    cy.contains('mat-card.subject-card', 'Matematicas').should('exist');
  });

  it('Búsqueda: Dado dos materias, cuando busca "Ciencias", entonces solo ve esa', () => {
    cy.createSubject(token, { name: 'Ciencias', professor: 'Marco' });
    cy.createSubject(token, { name: 'Historia', professor: 'Lucia' });
    cy.visitAs(token);
    cy.intercept('GET', '**/subjects/search*').as('search');
    cy.get('#subject-search').type('Ciencias');
    cy.wait('@search');
    cy.get('mat-card.subject-card').should('have.length', 1).and('contain.text', 'Ciencias');
  });

  it('Búsqueda: Dado un término inexistente, entonces ve el mensaje vacío', () => {
    cy.visitAs(token);
    cy.get('#subject-search').type('zzzz-no-existe');
    cy.get('p.empty').should('contain.text', 'You have no subjects yet');
    cy.get('mat-card.subject-card').should('not.exist');
  });
});
