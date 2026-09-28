import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UrgentRadarComponent } from './urgent-radar.component';
import { AssignmentService } from '../../services/assignment.service';
import { UrgentAlertService } from '../../services/urgent-alert.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { Should, fluent } from '../../common/fluent-assertions';

describe('UrgentRadarComponent (F21 — Alertas y Radar de Entregas Urgentes)', () => {
  let component: UrgentRadarComponent;
  let fixture: ComponentFixture<UrgentRadarComponent>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let urgentAlertServiceMock: jasmine.SpyObj<UrgentAlertService>;

  const mockAssignment: AssignmentResponseCompDto = {
    id: 101,
    title: 'Proyecto Final V&V',
    description: 'Entrega de informe y pruebas unitarias',
    dueDate: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), // Vence en 6 horas
    subjectId: 10,
    subjectName: 'Verificación y Validación',
    reminderMinutes: 30,
  };

  beforeEach(async () => {
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', ['getUrgentAssignments']);
    urgentAlertServiceMock = jasmine.createSpyObj('UrgentAlertService', ['start', 'requestPermission']);

    assignmentServiceMock.getUrgentAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [mockAssignment] })
    );
    urgentAlertServiceMock.requestPermission.and.resolveTo('granted');

    await TestBed.configureTestingModule({
      imports: [UrgentRadarComponent],
      providers: [
        { provide: AssignmentService, useValue: assignmentServiceMock },
        { provide: UrgentAlertService, useValue: urgentAlertServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(UrgentRadarComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(UrgentRadarComponent);
    component = fixture.componentInstance;
  });

  it('debe inicializarse correctamente y activar el servicio de alertas (UrgentAlertService.start)', () => {
    fixture.detectChanges();
    component.Should().NotBeNull();
    Should(urgentAlertServiceMock.start).HaveBeenCalled();
  });

  // ─── TABLA 5: CAMINOS BÁSICOS INDEPENDIENTES (CFG FRONTEND F21) ─────────────

  // Camino P1: 1-2-3-9-10-14-15-16-20 (Fallo HTTP / Resiliencia ante error de API)
  it('Camino P1 (1-2-3-9-10-14-15-16-20): debe manejar el fallo HTTP de la API desactivando loading y vaciando listas', () => {
    // Arrange
    assignmentServiceMock.getUrgentAssignments.and.returnValue(
      throwError(() => new Error('Error 500: Server unavailable'))
    );

    // Act
    (component as any).loadUrgentAssignments();

    // Assert (Fluent Assertions)
    component.assignments.Should().BeEmpty();
    component.urgentAssignments.Should().BeEmpty();
    component.loading.Should().BeFalse();
  });

  // Camino P2: 1-2-3-9-10-14-15-16-19-9-10-11-12-13-15-16-20 (Reintento interactivo exitoso tras error inicial)
  it('Camino P2 (1-2-3-9-10-14-15-16-19-9-10-11-12-13-15-16-20): debe recuperarse tras reintento poblando entregas urgentes', () => {
    // Arrange - Primer intento con error
    assignmentServiceMock.getUrgentAssignments.and.returnValue(
      throwError(() => new Error('Fallo de conexión inicial'))
    );
    (component as any).loadUrgentAssignments();
    component.assignments.Should().BeEmpty();

    // Act - Segundo intento exitoso (Reintentar)
    assignmentServiceMock.getUrgentAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [mockAssignment] })
    );
    (component as any).loadUrgentAssignments();

    // Assert (Fluent Assertions)
    component.assignments.Should().HaveCount(1);
    component.urgentAssignments.Should().HaveCount(1);
    component.loading.Should().BeFalse();
  });

  // Camino P3: 1-2-3-9-10-11-12-15-16-20 (Caso borde: lista vacía de urgencias)
  it('Camino P3 (1-2-3-9-10-11-12-15-16-20): debe gestionar respuesta 200 OK con array vacío sin alarmas activas', () => {
    // Arrange
    assignmentServiceMock.getUrgentAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [] })
    );

    // Act
    (component as any).loadUrgentAssignments();

    // Assert (Fluent Assertions)
    component.assignments.Should().BeEmpty();
    component.urgentAssignments.Should().BeEmpty();
    component.loading.Should().BeFalse();
  });

  // Camino P4: 1-2-3-9-10-11-12-13-15-16-20 (Flujo nominal con entregas urgentes activas)
  it('Camino P4 (1-2-3-9-10-11-12-13-15-16-20): debe poblar entregas urgentes y computar cuentas regresivas activas', () => {
    // Arrange & Act
    fixture.detectChanges();
    (component as any).loadUrgentAssignments();

    // Assert (Fluent Assertions con encadenamiento)
    component.assignments.Should().HaveCount(1);
    component.urgentAssignments.Should().HaveCount(1);
    component.urgentAssignments[0].countdown.Should().NotBe('Vencida').And.Contain('h');
    component.loading.Should().BeFalse();
  });

  // Camino P5: 1-2-3-9-10-11-12-13-15-16-17-20 (Inspección de atributos de entrega urgente)
  it('Camino P5 (1-2-3-9-10-11-12-13-15-16-17-20): debe mantener la información descriptiva de asignatura y entrega en la tarjeta', () => {
    // Arrange & Act
    fixture.detectChanges();
    (component as any).loadUrgentAssignments();

    // Assert (Fluent Assertions)
    const item = component.urgentAssignments[0];
    item.Should().NotBeNull().And.BeDefined();
    item.title.Should().Be('Proyecto Final V&V');
    item.subjectName.Should().Be('Verificación y Validación');
    item.reminderMinutes!.Should().Be(30);
  });

  // Camino P6: 1-2-3-9-10-11-12-13-15-16-18-20 (Transición de estado: habilitación de notificaciones web)
  it('Camino P6 (1-2-3-9-10-11-12-13-15-16-18-20): debe actualizar notificationMessage según los permisos de notificaciones', async () => {
    // Caso 1: Concedido
    urgentAlertServiceMock.requestPermission.and.resolveTo('granted');
    await component.enableNotifications();
    component.notificationMessage.Should().Be('Las alertas web están activadas.');

    // Caso 2: No soportado
    urgentAlertServiceMock.requestPermission.and.resolveTo('unsupported');
    await component.enableNotifications();
    component.notificationMessage.Should().Be('Este navegador no admite alertas web.');

    // Caso 3: Denegado
    urgentAlertServiceMock.requestPermission.and.resolveTo('denied');
    await component.enableNotifications();
    component.notificationMessage.Should().Be('No se concedió permiso para mostrar alertas.');
  });

  // Camino P7: 1-2-3-4-5-6-3-9-10-11-12-13-15-16-20 (Entrega vencida: diffHours < 0)
  it('Camino P7 (1-2-3-4-5-6-3-9-10-11-12-13-15-16-20): debe identificar entrega vencida y excluirla de las pendientes activas', () => {
    // Arrange: tarea con dueDate en el pasado (hace 2 horas)
    const overdueAssignment: AssignmentResponseCompDto = {
      ...mockAssignment,
      id: 102,
      dueDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    };
    component.assignments = [overdueAssignment];

    // Act
    (component as any).updateCountdowns();

    // Assert (Fluent Assertions)
    Should((component as any).getCountdown(overdueAssignment.dueDate)).Be('Vencida');
    component.urgentAssignments.Should().BeEmpty();
  });

  // Camino P8: 1-2-3-4-5-7-8-3-9-10-11-12-13-15-16-20 (Ventana crítica: 0 <= diffHours <= 12)
  it('Camino P8 (1-2-3-4-5-7-8-3-9-10-11-12-13-15-16-20): debe formatear cuenta regresiva en horas y minutos para ventana crítica (<= 12h)', () => {
    // Arrange: tarea con vencimiento en exactamente 3 horas y 15 minutos
    const approachingAssignment: AssignmentResponseCompDto = {
      ...mockAssignment,
      id: 103,
      dueDate: new Date(Date.now() + (3 * 3600 + 15 * 60) * 1000).toISOString(),
    };
    component.assignments = [approachingAssignment];

    // Act
    (component as any).updateCountdowns();

    // Assert (Fluent Assertions)
    component.urgentAssignments.Should().HaveCount(1);
    component.urgentAssignments[0].countdown.Should().Match(/^[23]\s*h\s*\d+\s*min$/);
  });

  // Camino P9: 1-2-3-4-5-7-3-9-10-11-12-13-15-16-20 (Ventana urgente moderada: 12 < diffHours <= 24)
  it('Camino P9 (1-2-3-4-5-7-3-9-10-11-12-13-15-16-20): debe procesar entrega en ventana moderada (entre 12h y 24h)', () => {
    // Arrange: tarea con vencimiento en 20 horas
    const moderateAssignment: AssignmentResponseCompDto = {
      ...mockAssignment,
      id: 104,
      dueDate: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    };
    component.assignments = [moderateAssignment];

    // Act
    (component as any).updateCountdowns();

    // Assert (Fluent Assertions)
    component.urgentAssignments.Should().HaveCount(1);
    component.urgentAssignments[0].countdown.Should().Match(/^(19|20)\s*h\s*\d+\s*min$/);
  });

  // ─── LIMPIEZA DE RECURSOS (ngOnDestroy) ──────────────────────────────────────
  it('debe desuscribirse de todos los temporizadores al destruir el componente', () => {
    fixture.detectChanges();
    const refreshSub = (component as any).refreshSubscription;
    const countdownSub = (component as any).countdownSubscription;

    refreshSub.closed.Should().BeFalse();
    countdownSub.closed.Should().BeFalse();

    component.ngOnDestroy();

    refreshSub.closed.Should().BeTrue();
    countdownSub.closed.Should().BeTrue();
  });
});
