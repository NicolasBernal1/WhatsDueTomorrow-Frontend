import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AssignmentService } from '../../services/assignment.service';
import { UrgentAlertService } from '../../services/urgent-alert.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Should } from '../../common/fluent-assertions';


describe('F03 Regression Suite: Cerrar Sesión (Frontend)', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'logout', 'deleteAccount', 'getProfile', 'verifyPassword', 'changePassword', 'updateProfile',
    ]);
    const notificationServiceMock = jasmine.createSpyObj('NotificationService', ['success', 'error']);
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


  describe('Invariante de Regresión 1: Limpieza de sesión antes de navegar', () => {
    it('debe llamar a authService.logout() y navegar a /login en cada invocación', () => {
      const navigateSpy = spyOn(router, 'navigate');

      component.logout();

      Should(authServiceMock.logout).HaveBeenCalledTimes(1);
      Should(navigateSpy).HaveBeenCalledWith(['/login']);
    });
  });


  describe('Invariante de Regresión 2: confirmDelete cierra sesión tras borrar la cuenta', () => {
    it('debe invocar logout() y navegar a /login después de un borrado exitoso', () => {
      const navigateSpy = spyOn(router, 'navigate');
      authServiceMock.deleteAccount.and.returnValue(of({ status: 204, message: 'Account deleted' }));

      component.confirmDelete();

      Should(authServiceMock.deleteAccount).HaveBeenCalledTimes(1);
      Should(authServiceMock.logout).HaveBeenCalledTimes(1);
      Should(navigateSpy).HaveBeenCalledWith(['/login']);
    });
  });

  
  describe('Invariante de Regresión 3: Cancelar no produce efectos de cierre de sesión', () => {
    it('debe restablecer pendingDeleteConfirmation sin llamar a deleteAccount ni a logout', () => {
      component.pendingDeleteConfirmation = true;

      component.cancelDeleteAccount();

      component.pendingDeleteConfirmation.Should().BeFalse();
      Should(authServiceMock.deleteAccount).NotHaveBeenCalled();
      Should(authServiceMock.logout).NotHaveBeenCalled();
    });
  });
});