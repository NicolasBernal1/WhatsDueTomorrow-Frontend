import '../../support/commands';
/**
 * UI — validaciones, mensajes, estados de botones y responsive de F01..F06.
 * Donde el estado depende del servidor (errores, lista de la campana) se usa cy.intercept
 * para que la prueba sea determinista.
 */
describe('Usuario — Validaciones de UI', () => {
  const bell = 'button[aria-label="Upcoming assignments"]';
  const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

  context('F01 · Registrar estudiante', () => {
    beforeEach(() => cy.visit('/register'));

    it('Dado el formulario vacío, cuando toca los campos, entonces ve los tres "required" y el botón bloqueado', () => {
      ['name', 'email', 'password'].forEach((f) => cy.get(`input[formcontrolname=${f}]`).focus().blur());
      cy.contains('mat-error', 'Name is required');
      cy.contains('mat-error', 'Email is required');
      cy.contains('mat-error', 'Password is required');
      cy.get('button[type=submit]').should('be.disabled');
    });

    it('Dado datos mal formados, entonces ve el error de nombre y el de correo', () => {
      cy.get('input[formcontrolname=name]').type('12345').blur();
      cy.get('input[formcontrolname=email]').type('no-es-email').blur();
      cy.contains('mat-error', 'Name must contain at least one letter');
      cy.contains('mat-error', 'Email must be a valid email address');
      cy.get('button[type=submit]').should('be.disabled');
    });

    it('Dado un correo ya registrado, cuando envía, entonces ve "This email is already in use" y sigue en /register', () => {
      cy.createAccount().then(({ email }) => {
        cy.get('input[formcontrolname=name]').type('Ana Gomez');
        cy.get('input[formcontrolname=email]').type(email);
        cy.get('input[formcontrolname=password]').type('Cypress#123');
        cy.on('window:alert', (msg) => expect(msg).to.eq('This email is already in use'));
        cy.get('button[type=submit]').click();
        cy.location('pathname').should('eq', '/register');
      });
    });

    it('Dado un nombre con números ("Juan123"), el front lo deja enviar pero el servidor lo rechaza: ve "Invalid data"', () => {
      // El front solo exige "al menos una letra"; el backend exige "solo letras y espacios".
      cy.get('input[formcontrolname=name]').type('Juan123');
      cy.get('input[formcontrolname=email]').type(`cy.ui.${Date.now()}@test.com`);
      cy.get('input[formcontrolname=password]').type('Cypress#123');
      cy.get('button[type=submit]').should('not.be.disabled');
      cy.on('window:alert', (msg) => expect(msg).to.eq('Invalid data'));
      cy.get('button[type=submit]').click();
      cy.location('pathname').should('eq', '/register');
    });

    it('El enlace "Log in" lleva a /login', () => {
      cy.contains('a', 'Log in').click();
      cy.location('pathname').should('eq', '/login');
    });
  });

  context('F02 · Iniciar sesión', () => {
    beforeEach(() => cy.visit('/login'));

    it('Dado el formulario vacío, entonces el botón "Log In" está bloqueado y ve "Email is required"', () => {
      cy.get('input[formcontrolname=email]').focus().blur();
      cy.contains('mat-error', 'Email is required');
      cy.get('button[type=submit]').should('be.disabled').and('contain.text', 'Log In');
    });

    it('Dado una contraseña incorrecta, entonces ve "Invalid Credentials", sigue en /login y no guarda token', () => {
      cy.createAccount().then(({ email }) => {
        cy.on('window:alert', (msg) => expect(msg).to.eq('Invalid Credentials'));
        cy.loginByUI(email, 'incorrecta');
        cy.location('pathname').should('eq', '/login');
        cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
      });
    });

    it('El enlace "Register now!" lleva a /register', () => {
      cy.contains('a', 'Register now!').click();
      cy.location('pathname').should('eq', '/register');
    });
  });

  context('F04 / F05 · Perfil y cambio de contraseña', () => {
    let token: string;
    beforeEach(() => cy.createAccount().then((a) => (token = a.token)));

    it('F04: Dado que el perfil falla en el servidor, entonces ve el aviso "Could not load your profile"', () => {
      cy.intercept('GET', '**/users/profile', { statusCode: 500, body: {} });
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.contains('.mat-mdc-snack-bar-label', 'Could not load your profile');
      cy.get('.profile-info').should('not.exist');
    });

    it('F05: "Verify Password" está bloqueado hasta escribir la contraseña actual', () => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.contains('button', 'Verify Password').should('be.disabled');
      cy.contains('mat-form-field', 'Current password').find('input').type('algo');
      cy.contains('button', 'Verify Password').should('not.be.disabled');
    });

    it('F05: Dado una contraseña actual incorrecta, entonces ve "Incorrect password" y no aparece "New password"', () => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.contains('mat-form-field', 'Current password').find('input').type('incorrecta');
      cy.contains('button', 'Verify Password').click();
      cy.contains('.error-message', 'Incorrect password');
      cy.contains('mat-form-field', 'New password').should('not.exist');
    });

    it('F05: Tras verificar, "Change Password" está bloqueado hasta escribir la nueva', () => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.contains('mat-form-field', 'Current password').find('input').type('Cypress#123');
      cy.contains('button', 'Verify Password').click();
      cy.contains('button', 'Change Password').should('be.disabled');
      cy.contains('mat-form-field', 'New password').find('input').type('Nueva#456');
      cy.contains('button', 'Change Password').should('not.be.disabled');
    });

    it('F05: Al cerrar y reabrir el menú, el formulario de contraseña vuelve a su estado inicial', () => {
      cy.visitAs(token, '/schedule');
      cy.openProfileMenu();
      cy.contains('mat-form-field', 'Current password').find('input').type('Cypress#123');
      cy.contains('button', 'Verify Password').click();
      cy.get('.verified-message').should('exist');
      cy.get('body').type('{esc}');
      cy.get('.profile-content').should('not.exist');
      cy.openProfileMenu();
      cy.get('.verified-message').should('not.exist');
      cy.contains('mat-form-field', 'Current password').find('input').should('have.value', '');
    });
  });

  context('F06 · Campana de tareas próximas', () => {
    let token: string;
    beforeEach(() => cy.createAccount().then((a) => (token = a.token)));

    it('Dado que no hay tareas próximas, la insignia está oculta y el menú dice "Nothing due in the next 48 hours"', () => {
      cy.intercept('GET', '**/assignments/upcoming', { status: 200, message: 'No upcoming assignments', data: [] });
      cy.visitAs(token, '/schedule');
      cy.get(`${bell} .mat-badge-content`).should('not.be.visible');
      cy.get(bell).click();
      cy.get('.empty-message').should('contain.text', 'Nothing due in the next 48 hours');
      cy.get('.upcoming-item').should('not.exist');
    });

    it('Dado tres tareas próximas, la insignia muestra 3 y cada fila tiene título y "materia · fecha"', () => {
      const data = [
        { id: 1, title: 'Taller de Calculo', description: '', dueDate: inHours(2), subjectId: 1, subjectName: 'Calculo' },
        { id: 2, title: 'Quiz de Fisica', description: '', dueDate: inHours(20), subjectId: 2, subjectName: 'Fisica' },
        { id: 3, title: 'Ensayo', description: '', dueDate: inHours(40), subjectId: 3, subjectName: 'Historia' },
      ];
      cy.intercept('GET', '**/assignments/upcoming', { status: 200, message: 'ok', data });
      cy.visitAs(token, '/schedule');
      cy.get(`${bell} .mat-badge-content`).should('be.visible').and('have.text', '3');
      cy.get(bell).click();
      cy.get('.upcoming-item').should('have.length', 3).each(($row, i) => {
        cy.wrap($row).find('strong').should('have.text', data[i].title);
        cy.wrap($row).find('span').invoke('text').should('match', new RegExp(`^${data[i].subjectName} · .+`));
      });
    });

    it('Dado que el endpoint falla, la app no se rompe: la insignia queda oculta', () => {
      cy.intercept('GET', '**/assignments/upcoming', { statusCode: 500, body: {} });
      cy.visitAs(token, '/schedule');
      cy.get('mat-toolbar').should('be.visible');
      cy.get(`${bell} .mat-badge-content`).should('not.be.visible');
    });
  });

  context('Responsive (375 × 812)', () => {
    beforeEach(() => cy.viewport(375, 812));

    it('Login y registro caben sin scroll horizontal', () => {
      ['/login', '/register'].forEach((path) => {
        cy.visit(path);
        cy.get('mat-card').should('be.visible');
        cy.document().then((doc) => {
          expect(doc.documentElement.scrollWidth, `ancho de ${path}`).to.be.at.most(doc.documentElement.clientWidth);
        });
      });
    });

    it('En móvil siguen accesibles la campana y el perfil (la etiqueta "Profile" se oculta)', () => {
      cy.createAccount().then(({ token }) => {
        cy.visitAs(token, '/schedule');
        cy.get(bell).should('be.visible');
        cy.get('.profile-label').should('not.be.visible');
        cy.get('mat-icon').contains('account_circle').should('be.visible');
      });
    });
  });
});