import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from '../../src/app/pages/login/login.component';

/** F02 · Iniciar sesión — el componente aislado, con el backend simulado por cy.intercept. */
describe('LoginComponent (F02)', () => {
  const email = () => cy.get('input[formcontrolname=email]');
  const password = () => cy.get('input[formcontrolname=password]');
  const submit = () => cy.get('button[type=submit]');

  beforeEach(() => {
    cy.mount(LoginComponent, {
      providers: [provideHttpClient(), provideRouter([{ path: '**', children: [] }])],
    }).then(({ fixture }) => cy.spy(fixture.debugElement.injector.get(Router), 'navigate').as('navigate'));
  });

  it('muestra el título y el botón "Log In" deshabilitado al inicio', () => {
    cy.contains('h2', 'Log In');
    submit().should('be.disabled').and('contain.text', 'Log In');
  });

  it('marca los campos obligatorios y el correo mal formado', () => {
    email().focus().blur();
    password().focus().blur();
    cy.contains('mat-error', 'Email is required');
    cy.contains('mat-error', 'Password is required');
    email().type('no-es-email').blur();
    cy.contains('mat-error', 'Email must be a valid email address');
    submit().should('be.disabled');
  });

  it('habilita "Log In" con datos válidos', () => {
    email().type('ana@test.com');
    password().type('Cypress#123');
    submit().should('not.be.disabled');
  });

  it('con credenciales válidas guarda el token y navega a /schedule', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 201,
      body: { status: 200, message: 'Logged in successfully', data: { token: 'token.de.prueba', user: { id: 1, name: 'Ana', email: 'ana@test.com' } } },
    }).as('login');
    email().type('ana@test.com');
    password().type('Cypress#123');
    submit().click();
    cy.wait('@login').its('request.body').should('deep.eq', { email: 'ana@test.com', password: 'Cypress#123' });
    cy.window().its('localStorage.token').should('eq', 'token.de.prueba');
    cy.get('@navigate').should('have.been.calledWith', ['/schedule']);
  });

  it('con credenciales inválidas avisa "Invalid Credentials" y no navega', () => {
    cy.window().then((win) => cy.stub(win, 'alert').as('alert'));
    cy.intercept('POST', '**/auth/login', { statusCode: 401, body: { message: 'Incorrect password' } });
    email().type('ana@test.com');
    password().type('mala');
    submit().click();
    cy.get('@alert').should('have.been.calledWith', 'Invalid Credentials');
    cy.get('@navigate').should('not.have.been.called');
  });

  it('tiene el enlace "Register now!" hacia /register', () => {
    cy.contains('a', 'Register now!').should('have.attr', 'href', '/register');
  });
});