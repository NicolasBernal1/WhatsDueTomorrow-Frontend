import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AssignmentService } from '../../services/assignment.service';
import { UrgentAlertService } from '../../services/urgent-alert.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Should } from '../../common/fluent-assertions';

describe('F05 Regression Suite: Cambiar Contraseña (Frontend)', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'logout', 'deleteAccount', 'getProfile', 'verifyPassword', 'changePassword', 'updateProfile',
    ]);
    notificationServiceMock = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const assignmentServiceMock = jasmine.createSpyObj('AssignmentService', ['getUpcomingAssignments']);
    const urgentAlertServiceMock = jasmine.createSpyObj('UrgentAlertService', ['start']);
    assignmentServiceMock.getUpcomingAssignments.and.returnValue(of({ status: 200, message: 'ok', data: [] }));

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: AssignmentService, useValue: assignmentServiceMock },
        { provide: UrgentAlertService, useValue: urgentAlertServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });


  describe('Invariante de Regresión 1: Puerta obligatoria de verificación previa', () => {
    it('no debe llamar a changePassword si passwordVerified es false', () => {
      component.passwordVerified = false;
      component.newPassword = 'Nueva123';

      component.changePassword();

      Should(authServiceMock.changePassword).NotHaveBeenCalled();
    });

    it('no debe marcar passwordVerified=true si el backend rechaza la contraseña actual', () => {
      component.password = 'incorrecta';
      authServiceMock.verifyPassword.and.returnValue(throwError(() => ({ status: 401 })));

      component.verifyPassword();

      component.passwordVerified.Should().BeFalse();
      component.passwordError.Should().BeTrue();
    });
  });


  describe('Invariante de Regresión 2: Cierre de sesión obligatorio tras cambio exitoso', () => {
    it('debe invocar logout() y navegar a /login inmediatamente después de un cambio exitoso', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      authServiceMock.changePassword.and.returnValue(of({ status: 200, message: 'ok' }));

      component.changePassword();

      Should(notificationServiceMock.success).HaveBeenCalledWith('Password changed successfully.');
      Should(authServiceMock.logout).HaveBeenCalledTimes(1);
      Should(navigateSpy).HaveBeenCalledWith(['/login']);
    });
  });

  
  describe('Invariante de Regresión 3: Sin logout ni spinner colgado ante fallo', () => {
    it('debe resetear changingPassword a false y NO cerrar sesión si el backend rechaza el cambio', () => {
      spyOn(console, 'error');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      component.changingPassword = true;
      authServiceMock.changePassword.and.returnValue(throwError(() => ({ status: 401 })));

      component.changePassword();

      component.changingPassword.Should().BeFalse();
      Should(authServiceMock.logout).NotHaveBeenCalled();
    });
  });
});