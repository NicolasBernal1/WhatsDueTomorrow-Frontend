import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { RegisterComponent } from '../../src/app/pages/register/register.component';

/** F01 · Registrar estudiante — el componente aislado, con el backend simulado por cy.intercept. */
describe('RegisterComponent (F01)', () => {
  const field = (name: 'name' | 'email' | 'password') => cy.get(`input[formcontrolname=${name}]`);
  const submit = () => cy.get('button[type=submit]');
  const fillValid = () => {
    field('name').type('Ana Gomez');
    field('email').type('ana@test.com');
    field('password').type('Cypress#123');
  };

  beforeEach(() => {
    cy.mount(RegisterComponent, {
      providers: [provideHttpClient(), provideRouter([{ path: '**', children: [] }])],
    }).then(({ fixture }) => cy.spy(fixture.debugElement.injector.get(Router), 'navigate').as('navigate'));
    cy.window().then((win) => cy.stub(win, 'alert').as('alert'));
  });

  it('el botón de registro está deshabilitado al inicio y marca los tres campos obligatorios', () => {
    submit().should('be.disabled');
    (['name', 'email', 'password'] as const).forEach((f) => field(f).focus().blur());
    cy.contains('mat-error', 'Name is required');
    cy.contains('mat-error', 'Email is required');
    cy.contains('mat-error', 'Password is required');
  });

  it('valida nombre sin letras y correo mal formado', () => {
    field('name').type('12345').blur();
    field('email').type('no-es-email').blur();
    cy.contains('mat-error', 'Name must contain at least one letter');
    cy.contains('mat-error', 'Email must be a valid email address');
    submit().should('be.disabled');
  });

  it('acepta nombres con tildes y ñ', () => {
    field('name').type('María Ñuñez').blur();
    cy.contains('mat-error', 'Name must contain at least one letter').should('not.exist');
  });

  it('con datos válidos registra, inicia sesión, guarda el token y navega a /schedule', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 201, body: { status: 201, message: 'User registered successfully', data: { id: 1, name: 'Ana Gomez', email: 'ana@test.com' } },
    }).as('register');
    cy.intercept('POST', '**/auth/login', {
      statusCode: 201, body: { status: 200, message: 'Logged in successfully', data: { token: 'token.nuevo', user: { id: 1 } } },
    }).as('login');
    fillValid();
    submit().should('not.be.disabled').click();
    cy.wait('@register').its('request.body').should('deep.eq', { name: 'Ana Gomez', email: 'ana@test.com', password: 'Cypress#123' });
    cy.wait('@login').its('request.body').should('deep.eq', { email: 'ana@test.com', password: 'Cypress#123' });
    cy.window().its('localStorage.token').should('eq', 'token.nuevo');
    cy.get('@navigate').should('have.been.calledWith', ['/schedule']);
  });

  ([
    [409, 'This email is already in use'],
    [400, 'Invalid data'],
    [500, 'An unknown error ocurred'],
  ] as const).forEach(([status, mensaje]) => {
    it(`si el servidor responde ${status}, avisa "${mensaje}" y no navega`, () => {
      cy.intercept('POST', '**/auth/register', { statusCode: status, body: {} });
      fillValid();
      submit().click();
      cy.get('@alert').should('have.been.calledWith', mensaje);
      cy.get('@navigate').should('not.have.been.called');
    });
  });

  it('tiene el enlace "Log in" hacia /login', () => {
    cy.contains('a', 'Log in').should('have.attr', 'href', '/login');
  });
});