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

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let urgentAlertServiceMock: jasmine.SpyObj<UrgentAlertService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [
      'logout', 'deleteAccount', 'getProfile', 'verifyPassword', 'changePassword', 'updateProfile',
    ]);
    notificationServiceMock = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', ['getUpcomingAssignments']);
    urgentAlertServiceMock = jasmine.createSpyObj('UrgentAlertService', ['start']);
    // ngOnInit llama a loadUpcomingAssignments() automáticamente, así que el
    // mock necesita un valor por defecto ANTES de fixture.detectChanges().
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleDropdown', () => {
    it('should toggle dropDownOpened from false to true', () => {
      expect(component.dropDownOpened).toBeFalse();
      component.toggleDropdown();
      expect(component.dropDownOpened).toBeTrue();
    });

    it('should toggle dropDownOpened from true back to false', () => {
      component.dropDownOpened = true;
      component.toggleDropdown();
      expect(component.dropDownOpened).toBeFalse();
    });
  });

  describe('logout', () => {
    it('should call authService.logout and navigate to /login', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.logout();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('delete account flow', () => {
    it('requestDeleteAccount should set pendingDeleteConfirmation to true', () => {
      component.requestDeleteAccount();
      expect(component.pendingDeleteConfirmation).toBeTrue();
    });

    it('cancelDeleteAccount should set pendingDeleteConfirmation back to false without calling deleteAccount', () => {
      component.pendingDeleteConfirmation = true;
      component.cancelDeleteAccount();
      expect(component.pendingDeleteConfirmation).toBeFalse();
      expect(authServiceMock.deleteAccount).not.toHaveBeenCalled();
    });

    it('confirmDelete should call deleteAccount and then logout', () => {
      const navigateSpy = spyOn(router, 'navigate');
      authServiceMock.deleteAccount.and.returnValue(
        of({ status: 204, message: 'Account deleted' })
      );

      component.confirmDelete();

      expect(authServiceMock.deleteAccount).toHaveBeenCalled();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      expect(component.pendingDeleteConfirmation).toBeFalse();
    });

    it('confirmDelete should log the error when deleteAccount fails', () => {
      spyOn(console, 'error');
      authServiceMock.deleteAccount.and.returnValue(throwError(() => ({ status: 500 })));

      component.confirmDelete();

      expect(console.error).toHaveBeenCalled();
      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });
  });

  describe('loadProfile', () => {
    it('should store the profile data returned by the backend', () => {
      const mockProfile = { id: 1, name: 'Test User', email: 'test@example.com' };
      authServiceMock.getProfile.and.returnValue(of({ status: 200, message: 'ok', data: mockProfile }));

      component.loadProfile();

      expect(component.user).toEqual(mockProfile);
    });

    it('should notify an error when the backend rejects the request', () => {
      spyOn(console, 'error');
      authServiceMock.getProfile.and.returnValue(throwError(() => ({ status: 401 })));

      component.loadProfile();

      expect(notificationServiceMock.error).toHaveBeenCalledWith('Could not load your profile');
      expect(component.user).toBeUndefined();
    });
  });

  describe('verifyPassword', () => {
    it('should do nothing when the password field is empty', () => {
      component.password = '';
      component.verifyPassword();
      expect(authServiceMock.verifyPassword).not.toHaveBeenCalled();
    });

    it('should set passwordError=true when verification fails', () => {
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
    });
  });

  describe('changePassword', () => {
    it('should do nothing when the password was not verified yet', () => {
      component.passwordVerified = false;
      component.newPassword = 'Nueva123';
      component.changePassword();
      expect(authServiceMock.changePassword).not.toHaveBeenCalled();
    });

    it('should log the error and reset changingPassword when the update fails', () => {
      spyOn(console, 'error');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      authServiceMock.changePassword.and.returnValue(throwError(() => ({ status: 401 })));

      component.changePassword();

      expect(console.error).toHaveBeenCalled();
      expect(component.changingPassword).toBeFalse();
    });

    it('should notify success and logout when the update succeeds', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      authServiceMock.changePassword.and.returnValue(of({ status: 200, message: 'ok' }));

      component.changePassword();

      expect(notificationServiceMock.success).toHaveBeenCalledWith('Password changed successfully.');
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('loadUpcomingAssignments', () => {
    it('should be called automatically on ngOnInit', () => {
      // El beforeEach ya dispara ngOnInit vía fixture.detectChanges().
      expect(assignmentServiceMock.getUpcomingAssignments).toHaveBeenCalled();
    });

    it('should store the upcoming assignments returned by the backend', () => {
      const mockUpcoming = [
        { id: 1, title: 'Ensayo', description: '', dueDate: '2026-01-01T10:00:00', subjectId: 5, subjectName: 'Historia' },
      ];
      assignmentServiceMock.getUpcomingAssignments.and.returnValue(
        of({ status: 200, message: 'ok', data: mockUpcoming }),
      );

      component.loadUpcomingAssignments();

      expect(component.upcomingAssignments).toEqual(mockUpcoming);
    });

    it('should keep the list empty when there is nothing due soon', () => {
      assignmentServiceMock.getUpcomingAssignments.and.returnValue(
        of({ status: 200, message: 'No upcoming assignments', data: [] }),
      );

      component.loadUpcomingAssignments();

      expect(component.upcomingAssignments).toEqual([]);
    });

    it('should log the error and keep the previous list when the request fails', () => {
      spyOn(console, 'error');
      assignmentServiceMock.getUpcomingAssignments.and.returnValue(throwError(() => ({ status: 500 })));

      component.loadUpcomingAssignments();

      expect(console.error).toHaveBeenCalled();
      expect(component.upcomingAssignments).toEqual([]);
    });
  });
});