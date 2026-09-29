import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UrgentRadarComponent } from './urgent-radar.component';
import { UrgentAlertService } from '../../services/urgent-alert.service';
import { AssignmentService } from '../../services/assignment.service';
import { NotificationService } from '../../services/notification.service';
import { AssignmentResponseCompDto } from '../../models/assignment-response-comp.dto';
import { Should } from '../../common/fluent-assertions';

/**
 * ============================================================================
 * SUITE DE PRUEBAS DE REGRESIÓN — F21: ALERTAS Y RADAR DE ENTREGAS URGENTES
 * ============================================================================
 * Objetivo de Regresión:
 * Garantizar que cambios futuros en la gestión de temporizadores (RxJS timer),
 * manipulación de fechas en navegador, integración con la API Notification,
 * o persistencia en localStorage no rompan los contratos de alerta ni
 * generen fugas de memoria, spam de alertas o estados de carga colgados en la UI.
 */
describe('F21 Regression Suite: Alertas y Radar de Entregas Urgentes (Frontend)', () => {
  let component: UrgentRadarComponent;
  let fixture: ComponentFixture<UrgentRadarComponent>;
  let alertService: UrgentAlertService;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let notificationConstructorSpy: jasmine.Spy;
  let originalNotification: any;

  const mockItem1: AssignmentResponseCompDto = {
    id: 101,
    title: 'Informe de Arquitectura',
    description: 'Diagramas C4 y decisiones ADR',
    dueDate: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // Vence en 2 horas
    subjectId: 10,
    subjectName: 'Diseño de Software',
    reminderMinutes: 180, // Recordatorio 3 horas antes (ventana activa)
  };

  const mockItem2: AssignmentResponseCompDto = {
    id: 102,
    title: 'Laboratorio de Concurrencia',
    description: 'Hilos y semáforos',
    dueDate: new Date(Date.now() + 5 * 3600 * 1000).toISOString(), // Vence en 5 horas
    subjectId: 20,
    subjectName: 'Sistemas Operativos',
    reminderMinutes: 30, // Recordatorio 30 minutos antes (aún no en ventana)
  };

  beforeEach(async () => {
    localStorage.clear();
    originalNotification = (window as any).Notification;

    const mockNotificationFn: any = function (title: string, options: any) {
      return { title, options };
    };
    mockNotificationFn.permission = 'granted';
    mockNotificationFn.requestPermission = jasmine
      .createSpy('requestPermission')
      .and.resolveTo('granted');
    notificationConstructorSpy = jasmine
      .createSpy('NotificationConstructor', mockNotificationFn)
      .and.callThrough();
    Object.assign(notificationConstructorSpy, mockNotificationFn);

    (window as any).Notification = notificationConstructorSpy;

    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAllAssignments',
      'getUrgentAssignments',
    ]);
    notificationServiceMock = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
    ]);

    assignmentServiceMock.getAllAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [mockItem1, mockItem2] })
    );
    assignmentServiceMock.getUrgentAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [mockItem1] })
    );

    await TestBed.configureTestingModule({
      imports: [UrgentRadarComponent],
      providers: [
        UrgentAlertService,
        { provide: AssignmentService, useValue: assignmentServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(UrgentRadarComponent, '<div></div>')
      .compileComponents();

    alertService = TestBed.inject(UrgentAlertService);
    fixture = TestBed.createComponent(UrgentRadarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    (window as any).Notification = originalNotification;
    localStorage.clear();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 1: Idempotencia y Prevención de Alertas Duplicadas (Anti-Spam)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 1: Idempotencia en Alertas de Escritorio (localStorage)', () => {
    it('no debe disparar múltiples notificaciones para la misma entrega en ciclos repetidos de verificación', () => {
      // Act: Primer pase de verificación
      (alertService as any).notifyDueAssignments([mockItem1]);

      Should(notificationConstructorSpy).HaveBeenCalledTimes(1);
      const expectedStorageKey = `urgent-alert-${mockItem1.id}-${new Date(mockItem1.dueDate).getTime()}`;
      Should(localStorage.getItem(expectedStorageKey)).Be('sent');

      // Act: Múltiples pases subsiguientes con la misma entrega
      (alertService as any).notifyDueAssignments([mockItem1]);
      (alertService as any).notifyDueAssignments([mockItem1]);
      (alertService as any).notifyDueAssignments([mockItem1]);

      // Assert: El conteo de llamadas debe mantenerse estrictamente en 1 (sin spam)
      Should(notificationConstructorSpy).HaveBeenCalledTimes(1);
    });

    it('debe notificar independientemente cada entrega distinta según su propia clave en almacenamiento', () => {
      const anotherActiveItem: AssignmentResponseCompDto = {
        ...mockItem2,
        id: 103,
        dueDate: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        reminderMinutes: 30,
      };

      (alertService as any).notifyDueAssignments([mockItem1, anotherActiveItem]);

      Should(notificationConstructorSpy).HaveBeenCalledTimes(2);
      const key1 = `urgent-alert-${mockItem1.id}-${new Date(mockItem1.dueDate).getTime()}`;
      const key2 = `urgent-alert-${anotherActiveItem.id}-${new Date(anotherActiveItem.dueDate).getTime()}`;
      Should(localStorage.getItem(key1)).Be('sent');
      Should(localStorage.getItem(key2)).Be('sent');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 2: Aritmética Temporal y Límites de la Ventana de Notificación
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 2: Delimitación de Ventana [reminderAt, dueAt)', () => {
    it('debe activar la notificación exactamente en reminderAt y dentro de la ventana', () => {
      const fixedNow = 1_700_000_000_000;
      spyOn(Date, 'now').and.returnValue(fixedNow);

      // Entrega exactamente al inicio de la ventana: dueAt = fixedNow + 30m, reminderMinutes = 30m
      const exactBoundaryItem: AssignmentResponseCompDto = {
        ...mockItem1,
        id: 201,
        dueDate: new Date(fixedNow + 30 * 60_000).toISOString(),
        reminderMinutes: 30,
      };

      (alertService as any).notifyDueAssignments([exactBoundaryItem]);
      Should(notificationConstructorSpy).HaveBeenCalledTimes(1);
    });

    it('no debe activar notificación si falta 1 milisegundo para entrar a la ventana de aviso', () => {
      const fixedNow = 1_700_000_000_000;
      spyOn(Date, 'now').and.returnValue(fixedNow);

      // dueAt = fixedNow + 30m + 1ms, reminderMinutes = 30m -> reminderAt = fixedNow + 1ms > fixedNow
      const justBeforeBoundaryItem: AssignmentResponseCompDto = {
        ...mockItem1,
        id: 202,
        dueDate: new Date(fixedNow + 30 * 60_000 + 1).toISOString(),
        reminderMinutes: 30,
      };

      (alertService as any).notifyDueAssignments([justBeforeBoundaryItem]);
      Should(notificationConstructorSpy).NotHaveBeenCalled();
    });

    it('no debe activar notificación si la entrega ya ha vencido (now >= dueAt)', () => {
      const fixedNow = 1_700_000_000_000;
      spyOn(Date, 'now').and.returnValue(fixedNow);

      // Tarea vencida hace 1 milisegundo
      const expiredItem: AssignmentResponseCompDto = {
        ...mockItem1,
        id: 203,
        dueDate: new Date(fixedNow - 1).toISOString(),
        reminderMinutes: 60,
      };

      (alertService as any).notifyDueAssignments([expiredItem]);
      Should(notificationConstructorSpy).NotHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 3: Compatibilidad de Navegadores y Degradación Segura
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 3: Degradación Segura cuando Notification no está soportado', () => {
    it('debe manejar la ausencia de window.Notification sin lanzar excepciones y marcar "unsupported"', async () => {
      delete (window as any).Notification;

      // Servicio
      const permission = await alertService.requestPermission();
      permission.Should().Be('unsupported');

      expect(() => alertService.start()).not.toThrow();
      Should((alertService as any).monitoring).BeUndefined();

      // Componente
      await component.enableNotifications();
      component.notificationMessage.Should().Be('Este navegador no admite alertas web.');
    });

    it('no debe disparar alertas si Notification.permission es "denied"', () => {
      (window as any).Notification.permission = 'denied';

      (alertService as any).notifyDueAssignments([mockItem1]);

      Should(notificationConstructorSpy).NotHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 4: Clasificación del Radar y Filtrado de Vencidas
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 4: Clasificación y Filtrado en Radar (updateCountdowns)', () => {
    it('debe excluir entregas vencidas y formatear correctamente horas y minutos restantes', () => {
      const fixedNow = 1_700_000_000_000;
      spyOn(Date, 'now').and.returnValue(fixedNow);

      const activeIn2Hours: AssignmentResponseCompDto = {
        ...mockItem1,
        id: 301,
        dueDate: new Date(fixedNow + (2 * 3600 + 15 * 60) * 1000).toISOString(), // 2 h 15 min
      };

      const activeIn45Minutes: AssignmentResponseCompDto = {
        ...mockItem1,
        id: 302,
        dueDate: new Date(fixedNow + 45 * 60 * 1000).toISOString(), // 0 h 45 min
      };

      const pastExpired: AssignmentResponseCompDto = {
        ...mockItem1,
        id: 303,
        dueDate: new Date(fixedNow - 1000).toISOString(), // Vencida
      };

      component.assignments = [activeIn2Hours, activeIn45Minutes, pastExpired];

      (component as any).updateCountdowns();

      // Solo deben quedar las 2 activas no vencidas
      component.urgentAssignments.Should().HaveCount(2);
      component.urgentAssignments[0].countdown.Should().Be('2 h 15 min');
      component.urgentAssignments[1].countdown.Should().Be('0 h 45 min');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 5: Ciclo de Vida y Prevención de Fugas de Memoria (ngOnDestroy)
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 5: Limpieza de Suscripciones en ngOnDestroy', () => {
    it('debe desuscribir todas las suscripciones periódicas al desmontar el componente para evitar fugas', () => {
      fixture.detectChanges();

      const refreshSub = (component as any).refreshSubscription;
      const countdownSub = (component as any).countdownSubscription;

      Should(refreshSub).NotBeNull().And.BeDefined();
      Should(countdownSub).NotBeNull().And.BeDefined();
      refreshSub.closed.Should().BeFalse();
      countdownSub.closed.Should().BeFalse();

      // Destrucción del componente
      component.ngOnDestroy();

      refreshSub.closed.Should().BeTrue();
      countdownSub.closed.Should().BeTrue();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 6: Resiliencia de UI y Recuperación tras Falla de Red
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 6: Resiliencia de UI y Recuperación de Estado tras Error 500', () => {
    it('debe desactivar loading y vaciar la lista ante error HTTP, y recuperar la UI en el siguiente éxito', () => {
      // Intento 1: Error HTTP de servidor
      assignmentServiceMock.getUrgentAssignments.and.returnValue(
        throwError(() => new Error('Error 500: Fallo de base de datos'))
      );

      (component as any).loadUrgentAssignments();

      component.loading.Should().BeFalse();
      component.assignments.Should().BeEmpty();
      component.urgentAssignments.Should().BeEmpty();

      // Intento 2: Recuperación de red con datos
      assignmentServiceMock.getUrgentAssignments.and.returnValue(
        of({ status: 200, message: 'OK', data: [mockItem1] })
      );

      (component as any).loadUrgentAssignments();

      component.loading.Should().BeFalse();
      component.assignments.Should().HaveCount(1);
      component.urgentAssignments.Should().HaveCount(1);
    });
  });
});
