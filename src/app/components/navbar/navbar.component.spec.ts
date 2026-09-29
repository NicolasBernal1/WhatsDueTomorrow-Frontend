import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as chai from 'chai';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AssignmentService } from '../../services/assignment.service';
import { UrgentAlertService } from '../../services/urgent-alert.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';

// Fluent Assertions (chai) para los asserts de VALORES/ESTADO del componente.
// Las verificaciones de spies (toHaveBeenCalled / toHaveBeenCalledWith) se
// dejan con el `expect` nativo de Jasmine.
const chaiExpect = chai.expect;

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
    // Assert
    chaiExpect(component).to.exist;
  });

  describe('toggleDropdown', () => {
    it('should toggle dropDownOpened from false to true', () => {
      // Arrange
      chaiExpect(component.dropDownOpened).to.be.false;

      // Act
      component.toggleDropdown();

      // Assert
      chaiExpect(component.dropDownOpened).to.be.true;
    });

    it('should toggle dropDownOpened from true back to false', () => {
      // Arrange
      component.dropDownOpened = true;

      // Act
      component.toggleDropdown();

      // Assert
      chaiExpect(component.dropDownOpened).to.be.false;
    });
  });

  // ─── Cerrar Sesión ────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should call authService.logout and navigate to /login', () => {
      // Arrange
      const navigateSpy = spyOn(router, 'navigate');

      // Act
      component.logout();

      // Assert
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('delete account flow', () => {
    it('requestDeleteAccount should set pendingDeleteConfirmation to true', () => {
      // Act
      component.requestDeleteAccount();

      // Assert
      chaiExpect(component.pendingDeleteConfirmation).to.be.true;
    });

    it('cancelDeleteAccount should set pendingDeleteConfirmation back to false without calling deleteAccount', () => {
      // Arrange
      component.pendingDeleteConfirmation = true;

      // Act
      component.cancelDeleteAccount();

      // Assert
      chaiExpect(component.pendingDeleteConfirmation).to.be.false;
      expect(authServiceMock.deleteAccount).not.toHaveBeenCalled();
    });

    it('confirmDelete should call deleteAccount and then logout', () => {
      // Arrange
      const navigateSpy = spyOn(router, 'navigate');
      authServiceMock.deleteAccount.and.returnValue(
        of({ status: 204, message: 'Account deleted' })
      );

      // Act
      component.confirmDelete();

      // Assert
      expect(authServiceMock.deleteAccount).toHaveBeenCalled();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      chaiExpect(component.pendingDeleteConfirmation).to.be.false;
    });

    it('confirmDelete should log the error when deleteAccount fails', () => {
      // Arrange
      spyOn(console, 'error');
      authServiceMock.deleteAccount.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      component.confirmDelete();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });
  });

  // ─── Consultar Perfil ─────────────────────────────────────────────────────

  describe('loadProfile', () => {
    it('should store the profile data returned by the backend', () => {
      // Arrange
      const mockProfile = { id: 1, name: 'Test User', email: 'test@example.com' };
      authServiceMock.getProfile.and.returnValue(of({ status: 200, message: 'ok', data: mockProfile }));

      // Act
      component.loadProfile();

      // Assert
      chaiExpect(component.user).to.deep.equal(mockProfile);
    });

    it('should notify an error when the backend rejects the request', () => {
      // Arrange
      spyOn(console, 'error');
      authServiceMock.getProfile.and.returnValue(throwError(() => ({ status: 401 })));

      // Act
      component.loadProfile();

      // Assert
      expect(notificationServiceMock.error).toHaveBeenCalledWith('Could not load your profile');
      chaiExpect(component.user).to.be.undefined;
    });
  });

  describe('profile editing', () => {
    beforeEach(() => {
      component.user = { id: 1, name: 'Ana', email: 'ana@test.com' };
    });

    it('startEditingProfile should enter edit mode pre-filled with the current user data', () => {
      // Act
      component.startEditingProfile();

      // Assert
      chaiExpect(component.editingProfile).to.be.true;
      chaiExpect(component.editName).to.equal('Ana');
      chaiExpect(component.editEmail).to.equal('ana@test.com');
    });

    it('cancelEditingProfile should exit edit mode without saving', () => {
      // Arrange
      component.editingProfile = true;

      // Act
      component.cancelEditingProfile();

      // Assert
      chaiExpect(component.editingProfile).to.be.false;
      expect(authServiceMock.updateProfile).not.toHaveBeenCalled();
    });

    it('saveProfile should do nothing when editName is empty', () => {
      // Arrange
      component.editName = '';
      component.editEmail = 'ana@test.com';

      // Act
      component.saveProfile();

      // Assert
      expect(authServiceMock.updateProfile).not.toHaveBeenCalled();
    });

    it('saveProfile should do nothing when editEmail is empty', () => {
      // Arrange
      component.editName = 'Ana';
      component.editEmail = '';

      // Act
      component.saveProfile();

      // Assert
      expect(authServiceMock.updateProfile).not.toHaveBeenCalled();
    });

    it('saveProfile should update the user and exit edit mode on success', () => {
      // Arrange
      const updatedUser = { id: 1, name: 'Ana Nueva', email: 'ananueva@test.com' };
      component.editName = 'Ana Nueva';
      component.editEmail = 'ananueva@test.com';
      component.editingProfile = true;
      authServiceMock.updateProfile.and.returnValue(of({ status: 200, message: 'ok', data: updatedUser }));

      // Act
      component.saveProfile();

      // Assert
      expect(authServiceMock.updateProfile).toHaveBeenCalledWith({ name: 'Ana Nueva', email: 'ananueva@test.com' });
      chaiExpect(component.user).to.deep.equal(updatedUser);
      chaiExpect(component.editingProfile).to.be.false;
      chaiExpect(component.savingProfile).to.be.false;
      expect(notificationServiceMock.success).toHaveBeenCalledWith('Profile updated successfully.');
    });

    it('saveProfile should notify "already in use" on 409', () => {
      // Arrange
      component.editName = 'Ana';
      component.editEmail = 'existente@test.com';
      authServiceMock.updateProfile.and.returnValue(throwError(() => ({ status: 409 })));

      // Act
      component.saveProfile();

      // Assert
      expect(notificationServiceMock.error).toHaveBeenCalledWith('That email is already in use');
      chaiExpect(component.savingProfile).to.be.false;
    });

    it('saveProfile should notify a generic error on any other failure', () => {
      // Arrange
      component.editName = 'Ana';
      component.editEmail = 'ana@test.com';
      authServiceMock.updateProfile.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      component.saveProfile();

      // Assert
      expect(notificationServiceMock.error).toHaveBeenCalledWith('Could not update your profile');
      chaiExpect(component.savingProfile).to.be.false;
    });
  });

  // ─── Cambiar Contraseña ───────────────────────────────────────────────────

  describe('resetPasswordState', () => {
    it('should reset all password-related fields to their initial values', () => {
      // Arrange
      component.password = 'algo';
      component.newPassword = 'otra_cosa';
      component.passwordVerified = true;
      component.passwordError = true;
      component.changingPassword = true;

      // Act
      component.resetPasswordState();

      // Assert
      chaiExpect(component.password).to.equal('');
      chaiExpect(component.newPassword).to.equal('');
      chaiExpect(component.passwordVerified).to.be.false;
      chaiExpect(component.passwordError).to.be.false;
      chaiExpect(component.changingPassword).to.be.false;
    });
  });

  describe('verifyPassword', () => {
    it('should do nothing when the password field is empty', () => {
      // Arrange
      component.password = '';

      // Act
      component.verifyPassword();

      // Assert
      expect(authServiceMock.verifyPassword).not.toHaveBeenCalled();
    });

    it('should set passwordError=true when verification fails', () => {
      // Arrange
      component.password = 'incorrecta';
      authServiceMock.verifyPassword.and.returnValue(throwError(() => ({ status: 401 })));

      // Act
      component.verifyPassword();

      // Assert
      chaiExpect(component.passwordVerified).to.be.false;
      chaiExpect(component.passwordError).to.be.true;
    });

    it('should set passwordVerified=true when verification succeeds', () => {
      // Arrange
      component.password = 'correcta123';
      authServiceMock.verifyPassword.and.returnValue(of({ status: 200, message: 'ok' }));

      // Act
      component.verifyPassword();

      // Assert
      chaiExpect(component.passwordVerified).to.be.true;
    });
  });

  describe('changePassword', () => {
    it('should do nothing when the password was not verified yet', () => {
      // Arrange
      component.passwordVerified = false;
      component.newPassword = 'Nueva123';

      // Act
      component.changePassword();

      // Assert
      expect(authServiceMock.changePassword).not.toHaveBeenCalled();
    });

    it('should log the error and reset changingPassword when the update fails', () => {
      // Arrange
      spyOn(console, 'error');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      authServiceMock.changePassword.and.returnValue(throwError(() => ({ status: 401 })));

      // Act
      component.changePassword();

      // Assert
      expect(console.error).toHaveBeenCalled();
      chaiExpect(component.changingPassword).to.be.false;
    });

    it('should notify success and logout when the update succeeds', () => {
      // Arrange
      const navigateSpy = spyOn(router, 'navigate');
      component.passwordVerified = true;
      component.password = 'correcta123';
      component.newPassword = 'Nueva123';
      authServiceMock.changePassword.and.returnValue(of({ status: 200, message: 'ok' }));

      // Act
      component.changePassword();

      // Assert
      expect(notificationServiceMock.success).toHaveBeenCalledWith('Password changed successfully.');
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('loadUpcomingAssignments', () => {
    it('should be called automatically on ngOnInit', () => {
      // Assert
      // El beforeEach ya dispara ngOnInit vía fixture.detectChanges() (Arrange+Act
      // ya ocurrieron ahí); esta prueba solo confirma el resultado.
      expect(assignmentServiceMock.getUpcomingAssignments).toHaveBeenCalled();
    });

    it('should store the upcoming assignments returned by the backend', () => {
      // Arrange
      const mockUpcoming = [
        { id: 1, title: 'Ensayo', description: '', dueDate: '2026-01-01T10:00:00', subjectId: 5, subjectName: 'Historia' },
      ];
      assignmentServiceMock.getUpcomingAssignments.and.returnValue(
        of({ status: 200, message: 'ok', data: mockUpcoming }),
      );

      // Act
      component.loadUpcomingAssignments();

      // Assert
      chaiExpect(component.upcomingAssignments).to.deep.equal(mockUpcoming);
    });

    it('should keep the list empty when there is nothing due soon', () => {
      // Arrange
      assignmentServiceMock.getUpcomingAssignments.and.returnValue(
        of({ status: 200, message: 'No upcoming assignments', data: [] }),
      );

      // Act
      component.loadUpcomingAssignments();

      // Assert
      chaiExpect(component.upcomingAssignments).to.deep.equal([]);
    });

    it('should log the error and keep the previous list when the request fails', () => {
      // Arrange
      spyOn(console, 'error');
      assignmentServiceMock.getUpcomingAssignments.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      component.loadUpcomingAssignments();

      // Assert
      expect(console.error).toHaveBeenCalled();
      chaiExpect(component.upcomingAssignments).to.deep.equal([]);
    });
  });
});