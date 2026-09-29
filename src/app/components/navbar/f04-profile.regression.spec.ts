import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AssignmentService } from '../../services/assignment.service';
import { UrgentAlertService } from '../../services/urgent-alert.service';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Should } from '../../common/fluent-assertions';


describe('F04 Regression Suite: Consultar Perfil (Frontend)', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;

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
    fixture.detectChanges();
  });

 
  describe('Invariante de Regresión 1: Fidelidad del dato de perfil cargado', () => {
    it('debe asignar component.user exactamente igual al data devuelto por el backend', () => {
      const mockProfile = { id: 1, name: 'Test User', email: 'test@example.com' };
      authServiceMock.getProfile.and.returnValue(of({ status: 200, message: 'ok', data: mockProfile }));

      component.loadProfile();

      component.user!.Should().BeEquivalentTo(mockProfile);
    });
  });


  describe('Invariante de Regresión 2: Estado limpio ante fallo de carga', () => {
    it('debe mantener component.user en undefined y notificar el error si la petición falla', () => {
      spyOn(console, 'error');
      authServiceMock.getProfile.and.returnValue(throwError(() => ({ status: 401 })));

      component.loadProfile();

      Should(component.user).BeUndefined();
      Should(notificationServiceMock.error).HaveBeenCalledWith('Could not load your profile');
    });
  });

 
  describe('Invariante de Regresión 3: El modo edición siempre arranca con los datos vigentes', () => {
    it('debe pre-llenar editName/editEmail con el usuario actual, no con valores previos', () => {
      component.user = { id: 1, name: 'Ana', email: 'ana@test.com' };
      component.editName = 'basura_previa';
      component.editEmail = 'basura_previa@test.com';

      component.startEditingProfile();

      component.editName.Should().Be('Ana');
      component.editEmail.Should().Be('ana@test.com');
      component.editingProfile.Should().BeTrue();
    });
  });
});