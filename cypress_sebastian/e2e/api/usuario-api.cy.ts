import '../../support/commands';
/**
 * API — contrato de los endpoints de F01..F06.
 * Nota: Nest responde HTTP 201 a todo @Post sin @HttpCode, aunque el cuerpo del login diga status 200.
 */
describe('Usuario — API', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;
  const email = () => `cy.seb.api.${Date.now()}${Cypress._.random(999)}@test.com`;
  const pedir = (method: string, path: string, body?: object, token?: string) =>
    cy.request({
      method, url: `${api()}${path}`, body, failOnStatusCode: false,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  context('F01 · POST /auth/register', () => {
    it('201: crea el usuario y devuelve id, name y email (nunca la contraseña)', () => {
      const e = email();
      pedir('POST', '/auth/register', { name: 'Ana Gomez', email: e, password: 'Cypress#123' }).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body).to.include({ status: 201, message: 'User registered successfully' });
        expect(res.body.data).to.have.all.keys('id', 'name', 'email');
        expect(res.body.data).to.include({ name: 'Ana Gomez', email: e });
      });
    });

    it('409: el correo ya existe', () => {
      cy.createAccount().then((a) => {
        pedir('POST', '/auth/register', { name: 'Otra Persona', email: a.email, password: 'x' })
          .its('status').should('eq', 409);
      });
    });

    ([
      ['nombre con números', { name: 'Juan123', email: 'ok@test.com', password: 'x' }, 'name must contain only letters and spaces'],
      ['correo mal formado', { name: 'Ana', email: 'no-es-email', password: 'x' }, 'email must be an email'],
      ['sin contraseña', { name: 'Ana', email: 'ok@test.com' }, 'password should not be empty'],
      ['nombre vacío', { name: '', email: 'ok@test.com', password: 'x' }, 'name should not be empty'],
    ] as const).forEach(([caso, body, msg]) => {
      it(`400: ${caso}`, () => {
        pedir('POST', '/auth/register', body).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.message).to.include(msg);
        });
      });
    });

    it('Acepta nombres con tildes, ñ, guion y apóstrofo', () => {
      pedir('POST', '/auth/register', { name: "María-José O'Neil Ñuñez", email: email(), password: 'x' })
        .its('status').should('eq', 201);
    });
  });

  context('F02 · POST /auth/login', () => {
    it('201: devuelve un JWT de 1 día con sub y email, y los datos del usuario', () => {
      cy.createAccount().then((a) => {
        pedir('POST', '/auth/login', { email: a.email, password: a.password }).then((res) => {
          expect(res.status).to.eq(201);
          expect(res.body).to.include({ status: 200, message: 'Logged in successfully' });
          expect(res.body.data.user).to.have.all.keys('id', 'name', 'email');
          const parts = res.body.data.token.split('.');
          expect(parts, 'JWT con 3 partes').to.have.length(3);
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          expect(payload).to.include({ email: a.email, sub: res.body.data.user.id });
          expect(payload.exp - payload.iat, 'vigencia en segundos').to.eq(86400);
        });
      });
    });

    it('401: contraseña incorrecta', () => {
      cy.createAccount().then((a) => {
        pedir('POST', '/auth/login', { email: a.email, password: 'incorrecta' }).then((res) => {
          expect(res.status).to.eq(401);
          expect(res.body.message).to.eq('Incorrect password');
        });
      });
    });

    it('404: el usuario no existe', () => {
      pedir('POST', '/auth/login', { email: email(), password: 'x' }).its('status').should('eq', 404);
    });

    it('400: correo mal formado o campos vacíos', () => {
      pedir('POST', '/auth/login', { email: 'no-es-email', password: 'x' }).its('status').should('eq', 400);
      pedir('POST', '/auth/login', {}).its('status').should('eq', 400);
    });
  });

  context('F04 · GET /users/profile', () => {
    it('200: devuelve id, name y email del dueño del token', () => {
      cy.createAccount().then((a) => {
        pedir('GET', '/users/profile', undefined, a.token).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.message).to.eq('User profile retrieved successfully');
          expect(res.body.data).to.have.all.keys('id', 'name', 'email');
          expect(res.body.data).to.include({ name: 'Cypress Tester', email: a.email });
        });
      });
    });
  });

  context('F05 · PATCH /auth/verify-password y /auth/change-password', () => {
    it('verify-password: 200 con la correcta, 401 con otra, 400 vacía', () => {
      cy.createAccount().then((a) => {
        pedir('PATCH', '/auth/verify-password', { password: a.password }, a.token).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.message).to.eq('Password verified successfully');
        });
        pedir('PATCH', '/auth/verify-password', { password: 'otra' }, a.token).its('status').should('eq', 401);
        pedir('PATCH', '/auth/verify-password', {}, a.token).its('status').should('eq', 400);
      });
    });

    it('change-password: 200 y después solo vale la nueva contraseña', () => {
      cy.createAccount().then((a) => {
        pedir('PATCH', '/auth/change-password', { currentPassword: a.password, newPassword: 'Nueva#456' }, a.token)
          .then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body.message).to.eq('Password updated successfully');
          });
        pedir('POST', '/auth/login', { email: a.email, password: a.password }).its('status').should('eq', 401);
        pedir('POST', '/auth/login', { email: a.email, password: 'Nueva#456' }).its('status').should('eq', 201);
      });
    });

    it('change-password: 401 si la actual es incorrecta (y la contraseña no cambia)', () => {
      cy.createAccount().then((a) => {
        pedir('PATCH', '/auth/change-password', { currentPassword: 'mala', newPassword: 'Nueva#456' }, a.token)
          .its('status').should('eq', 401);
        pedir('POST', '/auth/login', { email: a.email, password: a.password }).its('status').should('eq', 201);
      });
    });

    it('change-password: 400 si falta newPassword o currentPassword', () => {
      cy.createAccount().then((a) => {
        pedir('PATCH', '/auth/change-password', { currentPassword: a.password }, a.token).its('status').should('eq', 400);
        pedir('PATCH', '/auth/change-password', { newPassword: 'x' }, a.token).its('status').should('eq', 400);
      });
    });
  });

  context('F06 · GET /assignments/upcoming', () => {
    it('200 sin tareas: data vacía y mensaje "No upcoming assignments"', () => {
      cy.createAccount().then((a) => {
        pedir('GET', '/assignments/upcoming', undefined, a.token).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body).to.deep.include({ message: 'No upcoming assignments', data: [] });
        });
      });
    });

    it('200 con tareas: trae los campos del contrato, ordenadas por fecha ascendente', () => {
      cy.createAccount().then((a) => {
        cy.createSubject(a.token, { name: 'Fisica' }).then((s) => {
          cy.createAssignmentDueIn(a.token, s.id, 'Segunda', 30);
          cy.createAssignmentDueIn(a.token, s.id, 'Primera', 2);
          pedir('GET', '/assignments/upcoming', undefined, a.token).then((res) => {
            expect(res.body.message).to.eq('Upcoming assignments retrieved successfully');
            const list = res.body.data;
            expect(list.map((x: any) => x.title)).to.deep.eq(['Primera', 'Segunda']);
            expect(list[0]).to.include.all.keys('id', 'title', 'description', 'dueDate', 'subjectId', 'subjectName');
            expect(list[0]).to.include({ subjectId: s.id, subjectName: 'Fisica' });
          });
        });
      });
    });
  });
});