import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { NavbarComponent } from '../../src/app/components/navbar/navbar.component';
import { UrgentAlertService } from '../../src/app/services/urgent-alert.service';

/**
 * NavbarComponent — F03 Cerrar sesión, F04 Consultar perfil, F05 Cambiar contraseña y F06 Campana (48 h).
 * El backend se simula con cy.intercept; el aviso de tareas urgentes (de otra funcionalidad) se desactiva.
 */
describe('NavbarComponent (F03–F06)', () => {
  const bell = 'button[aria-label="Upcoming assignments"]';
  const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
  const tareas = [
    { id: 1, title: 'Taller de Calculo', description: '', dueDate: inHours(2), subjectId: 1, subjectName: 'Calculo' },
    { id: 2, title: 'Quiz de Fisica', description: '', dueDate: inHours(30), subjectId: 2, subjectName: 'Fisica' },
  ];

  const montar = (upcoming: unknown[] = []) => {
    cy.intercept('GET', '**/assignments/upcoming', { statusCode: 200, body: { status: 200, message: 'ok', data: upcoming } }).as('upcoming');
    cy.intercept('GET', '**/users/profile', {
      statusCode: 200, body: { status: 200, message: 'User profile retrieved successfully', data: { id: 7, name: 'Ana Gomez', email: 'ana@test.com' } },
    }).as('profile');
    cy.mount(NavbarComponent, {
      providers: [
        provideHttpClient(), provideRouter([{ path: '**', children: [] }]),
        { provide: UrgentAlertService, useValue: { start: () => undefined } },
      ],
    }).then(({ fixture }) => cy.spy(fixture.debugElement.injector.get(Router), 'navigate').as('navigate'));
    cy.wait('@upcoming');
  };
  const abrirPerfil = () => {
    cy.contains('button', 'Profile').click();
    cy.wait('@profile');
    cy.get('.profile-content').should('be.visible');
  };
  const actual = () => cy.contains('mat-form-field', 'Current password').find('input');

  beforeEach(() => localStorage.setItem('token', 'token.de.prueba'));

  context('F06 · Campana', () => {
    it('sin tareas: la insignia está oculta y el menú dice "Nothing due in the next 48 hours"', () => {
      montar([]);
      cy.get(bell).should('have.class', 'mat-badge-hidden');
      cy.get(bell).click();
      cy.get('.upcoming-content h4').should('have.text', 'Due soon');
      cy.get('.empty-message').should('contain.text', 'Nothing due in the next 48 hours');
    });

    it('con 2 tareas: la insignia muestra 2 y cada fila tiene título y "materia · fecha"', () => {
      montar(tareas);
      cy.get(`${bell} .mat-badge-content`).should('have.text', '2');
      cy.get(bell).click();
      cy.get('.upcoming-item').should('have.length', 2).each(($row, i) => {
        cy.wrap($row).find('strong').should('have.text', tareas[i].title);
        cy.wrap($row).find('span').invoke('text').should('match', new RegExp(`^${tareas[i].subjectName} · .+`));
      });
    });

    it('si el endpoint falla, no se rompe y la insignia queda oculta', () => {
      cy.intercept('GET', '**/assignments/upcoming', { statusCode: 500, body: {} }).as('upcoming');
      cy.mount(NavbarComponent, {
        providers: [provideHttpClient(), provideRouter([]), { provide: UrgentAlertService, useValue: { start: () => undefined } }],
      });
      cy.wait('@upcoming');
      cy.get('mat-toolbar').should('be.visible');
      cy.get(bell).should('have.class', 'mat-badge-hidden');
    });
  });

  context('F04 · Perfil', () => {
    it('al abrir "Profile" pide el perfil y muestra nombre y correo', () => {
      montar();
      abrirPerfil();
      cy.get('.profile-info h3').should('have.text', 'Ana Gomez');
      cy.get('.profile-info p').should('have.text', 'ana@test.com');
    });

    it('si el perfil falla, avisa "Could not load your profile"', () => {
      montar();
      cy.intercept('GET', '**/users/profile', { statusCode: 500, body: {} }).as('profile');
      abrirPerfil();
      cy.contains('Could not load your profile');
      cy.get('.profile-info').should('not.exist');
    });
  });

  context('F05 · Cambiar contraseña', () => {
    it('"Verify Password" está deshabilitado hasta escribir la contraseña actual', () => {
      montar();
      abrirPerfil();
      cy.contains('button', 'Verify Password').should('be.disabled');
      actual().type('algo');
      cy.contains('button', 'Verify Password').should('not.be.disabled');
    });

    it('contraseña actual incorrecta: muestra "Incorrect password" y no deja escribir la nueva', () => {
      montar();
      cy.intercept('PATCH', '**/auth/verify-password', { statusCode: 401, body: { message: 'Incorrect password' } });
      abrirPerfil();
      actual().type('mala');
      cy.contains('button', 'Verify Password').click();
      cy.contains('.error-message', 'Incorrect password');
      cy.contains('mat-form-field', 'New password').should('not.exist');
    });

    it('verifica, cambia la contraseña, avisa el éxito y cierra la sesión', () => {
      montar();
      cy.intercept('PATCH', '**/auth/verify-password', { statusCode: 200, body: { message: 'Password verified successfully' } }).as('verify');
      cy.intercept('PATCH', '**/auth/change-password', { statusCode: 200, body: { message: 'Password updated successfully' } }).as('change');
      abrirPerfil();
      actual().type('Cypress#123');
      cy.contains('button', 'Verify Password').click();
      cy.wait('@verify').its('request.body').should('deep.eq', { password: 'Cypress#123' });
      cy.get('.verified-message').should('contain.text', 'Current password verified');
      cy.contains('button', 'Change Password').should('be.disabled');
      cy.contains('mat-form-field', 'New password').find('input').type('Nueva#456');
      cy.contains('button', 'Change Password').click();
      cy.wait('@change').its('request.body').should('deep.eq', { currentPassword: 'Cypress#123', newPassword: 'Nueva#456' });
      cy.contains('Password changed successfully.');
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
      cy.get('@navigate').should('have.been.calledWith', ['/login']);
    });
  });

  context('F03 · Cerrar sesión', () => {
    it('"Log Out" borra el token y navega a /login', () => {
      montar();
      abrirPerfil();
      cy.contains('button', 'Log Out').click();
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
      cy.get('@navigate').should('have.been.calledWith', ['/login']);
    });
  });
});