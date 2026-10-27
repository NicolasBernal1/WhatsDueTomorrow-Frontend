import '../../support/commands';

describe('Usuario — Seguridad (API)', () => {
  const api = () => (Cypress.env('apiUrl') || 'https://whatsduetomorrow-backed.onrender.com') as string;
  const email = () => `cy.seb.sec.${Date.now()}${Cypress._.random(999)}@test.com`;
  const pedir = (method: string, path: string, body?: object, token?: string) =>
    cy.request({
      method, url: `${api()}${path}`, body, failOnStatusCode: false,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const leerPayload = (token: string) => JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

  context('Autenticación', () => {
    ([
      ['GET', '/users/profile'],
      ['PATCH', '/auth/verify-password', { password: 'x' }],
      ['PATCH', '/auth/change-password', { currentPassword: 'x', newPassword: 'y' }],
      ['GET', '/assignments/upcoming'],
    ] as [string, string, object?][]).forEach(([method, path, body]) => {
      it(`${method} ${path} sin token responde 401`, () => {
        pedir(method, path, body).its('status').should('eq', 401);
      });
    });

    it('Un token con la firma alterada responde 401', () => {
      cy.createAccount().then(({ token }) => {
        const [h, p, s] = token.split('.');
        const alterado = `${h}.${p}.${s.slice(0, -4)}${s.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA'}`;
        pedir('GET', '/users/profile', undefined, alterado).its('status').should('eq', 401);
      });
    });

    it('Un token con alg "none" (sin firma) responde 401', () => {
      cy.createAccount().then(({ token }) => {
        const sinFirma = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(leerPayload(token))}.`;
        pedir('GET', '/users/profile', undefined, sinFirma).its('status').should('eq', 401);
      });
    });

    it('Un token con otro "sub" pero la firma original responde 401 (no se puede suplantar)', () => {
      cy.createAccount().then(({ token }) => {
        const [h, , s] = token.split('.');
        const payload = leerPayload(token);
        const suplantado = `${h}.${b64url({ ...payload, sub: payload.sub + 1 })}.${s}`;
        pedir('GET', '/users/profile', undefined, suplantado).its('status').should('eq', 401);
      });
    });
  });

  context('Exposición de datos e inyección', () => {
    it('Ninguna respuesta de registro, login o perfil incluye la contraseña ni su hash', () => {
      const e = email();
      const password = 'Cypress#123';
      const sinSecretos = (body: unknown) => {
        const txt = JSON.stringify(body);
        expect(txt).not.to.match(/password/i);
        expect(txt).not.to.match(/\$2[aby]\$/); // prefijo de un hash bcrypt
      };
      pedir('POST', '/auth/register', { name: 'Ana Gomez', email: e, password }).its('body').then(sinSecretos);
      pedir('POST', '/auth/login', { email: e, password }).then((res) => {
        sinSecretos(res.body);
        pedir('GET', '/users/profile', undefined, res.body.data.token).its('body').then(sinSecretos);
      });
    });

    it('Asignación masiva: campos extra como "role" o "id" en el registro se rechazan con 400', () => {
      const base = { name: 'Ana Gomez', email: email(), password: 'Cypress#123' };
      [{ role: 'admin' }, { id: 1 }].forEach((extra) => {
        pedir('POST', '/auth/register', { ...base, ...extra }).then((res) => {
          expect(res.status).to.eq(400);
          expect(res.body.message.join(' ')).to.match(/should not exist/);
        });
      });
    });

    it('Inyección SQL en el login no autentica ni rompe el servidor', () => {
      cy.createAccount().then((a) => {
        [
          { email: a.email, password: "' OR '1'='1" },
          { email: "admin'--@test.com", password: 'x' },
          { email: "' OR 1=1 --", password: 'x' },
        ].forEach((body) => {
          pedir('POST', '/auth/login', body).then((res) => {
            expect(res.status, JSON.stringify(body)).to.be.within(400, 499);
            expect(res.body).not.to.have.nested.property('data.token');
          });
        });
      });
    });

    it('XSS en el registro: un nombre con <script> se rechaza con 400', () => {
      pedir('POST', '/auth/register', { name: '<script>alert(1)</script>', email: email(), password: 'x' })
        .its('status').should('eq', 400);
    });
  });

  context('Aislamiento entre usuarios', () => {
    it('Las tareas próximas y el perfil de un usuario no son visibles con el token de otro', () => {
      cy.createAccount().then((ana) => {
        cy.createSubject(ana.token, { name: 'Privada' }).then((s) => cy.createAssignmentDueIn(ana.token, s.id, 'Secreta', 3));
        cy.createAccount().then((intruso) => {
          pedir('GET', '/assignments/upcoming', undefined, intruso.token).its('body.data').should('deep.eq', []);
          pedir('GET', '/users/profile', undefined, intruso.token).its('body.data.email').should('eq', intruso.email);
        });
      });
    });
  });

  context('Brechas conocidas (omitidas salvo --env expectAuthHardening=true)', () => {
    beforeEach(function () {
      if (String(Cypress.env('expectAuthHardening')) !== 'true') this.skip();
    });

    it('BRECHA F05: tras cambiar la contraseña el token anterior debería quedar revocado', () => {
      cy.createAccount().then((a) => {
        pedir('PATCH', '/auth/change-password', { currentPassword: a.password, newPassword: 'Nueva#456' }, a.token);
        pedir('GET', '/users/profile', undefined, a.token).its('status').should('eq', 401);
      });
    });

    it('BRECHA F01: una contraseña débil ("a") debería rechazarse', () => {
      pedir('POST', '/auth/register', { name: 'Ana Gomez', email: email(), password: 'a' }).its('status').should('eq', 400);
    });

    it('BRECHA F02: el login no debería revelar si un correo existe (mismo código para ambos errores)', () => {
      cy.createAccount().then((a) => {
        pedir('POST', '/auth/login', { email: a.email, password: 'mala' }).then((existe) => {
          pedir('POST', '/auth/login', { email: email(), password: 'mala' }).its('status').should('eq', existe.status);
        });
      });
    });

    it('BRECHA F02: tras 10 intentos fallidos el login debería limitarse (429)', () => {
      cy.createAccount().then((a) => {
        Cypress._.times(10, () => pedir('POST', '/auth/login', { email: a.email, password: 'mala' }));
        pedir('POST', '/auth/login', { email: a.email, password: 'mala' }).its('status').should('eq', 429);
      });
    });
  });
});