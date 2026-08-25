import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from '../src/app/components/navbar/navbar.component';
import { AuthService } from '../src/app/services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// ════════════════════════════════════════════════════════════════════════════
// CAMBIAR CONTRASEÑA — verifyPassword() + changePassword()
// Tabla de caminos FE-5 · nodos 1-12 · decisiones en 4, 9
// ════════════════════════════════════════════════════════════════════════════

describe('NavbarComponent · cambiar contraseña', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'verifyPassword',
      'changePassword',
      'logout',
    ]);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Paso 1: verifyPassword() — decisión en el nodo 4 ────────────────────────

  describe('verifyPassword', () => {
    it('should do nothing (guard) when the password field is empty', () => {
      component.password = '';
      component.verifyPassword();
      expect(authServiceMock.verifyPassword).not.toHaveBeenCalled();
    });

    it('P1 (1-2-3-4(No)-5-12): should set passwordError=true when verification fails', () => {
      component.password = 'incorrecta';
      authServiceMock.verifyPassword.and.returnValue(throwError(() => ({ status: 401 })));

      component.verifyPassword();

      expect(component.passwordVerified).toBeFalse();
      expect(component.passwordError).toBeTrue();
    });

    it('should set passwordVerified=true when verification succeeds', () => {
      component.password = 'correcta123';
      authServiceMock.verifyPassword.and.returnValue(of({ status: 200, message: 'ok' }));

      component.verifyPassword();

      expect(component.passwordVerified).toBeTrue();
      expect(component.passwordError).toBeFalse();
    });
  });

  // ─── Paso 2: changePassword() — decisión en el nodo 9 ────────────────────────

  describe('changePassword', () => {
    it('should do nothing (guard) when the password was not verified yet', () => {
      component.passwordVerified = false;
      component.newPassword = 'Nueva123';
      component.changePassword();
      expect(authServiceMock.changePassword).not.toHaveBeenCalled();
    });

    it('should do nothing (guard) when newPassword is empty', () => {
      component.passwordVerified = true;
      component.newPassword = '';
      component.changePassword();
      expect(authServiceMock.changePassword).not.toHaveBeenCalled();
    });

    it('P2 (1-2-3-4(Sí)-6-7-8-9(No)-10-12): should log the error and reset changingPassword when the update fails', () => {
      spyOn(console, 'error');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      authServiceMock.changePassword.and.returnValue(throwError(() => ({ status: 401 })));

      component.changePassword();

      expect(authServiceMock.changePassword).toHaveBeenCalledWith({
        currentPassword: 'correcta123',
        newPassword: 'Nueva123',
      });
      expect(console.error).toHaveBeenCalled();
      expect(component.changingPassword).toBeFalse();
    });

    it('P3 (1-2-3-4(Sí)-6-7-8-9(Sí)-11-12): should alert success and logout when the update succeeds', () => {
      spyOn(window, 'alert');
      const navigateSpy = spyOn(router, 'navigate');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      authServiceMock.changePassword.and.returnValue(of({ status: 200, message: 'ok' }));

      component.changePassword();

      expect(window.alert).toHaveBeenCalledWith('Password changed successfully.');
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });
});
