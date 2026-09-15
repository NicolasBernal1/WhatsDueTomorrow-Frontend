import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UrgentAlertService } from './urgent-alert.service';
import { AssignmentService } from './assignment.service';
import { of } from 'rxjs';
import { AssignmentResponseCompDto } from '../models/assignment-response-comp.dto';

describe('UrgentAlertService (F21 — Servicio de Alertas Preventivas de Entregas)', () => {
  let service: UrgentAlertService;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;
  let notificationConstructorSpy: jasmine.Spy;
  let originalNotification: any;

  beforeEach(() => {
    assignmentServiceMock = jasmine.createSpyObj('AssignmentService', [
      'getAllAssignments',
      'getUrgentAssignments',
    ]);
    assignmentServiceMock.getAllAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [] })
    );
    assignmentServiceMock.getUrgentAssignments.and.returnValue(
      of({ status: 200, message: 'OK', data: [] })
    );

    // Guardar referencia original de Notification en window
    originalNotification = (window as any).Notification;

    // Crear mock de Notification
    const mockNotificationFn: any = function (title: string, options: any) {
      return { title, options };
    };
    mockNotificationFn.permission = 'granted';
    mockNotificationFn.requestPermission = jasmine.createSpy('requestPermission').and.resolveTo('granted');
    notificationConstructorSpy = jasmine.createSpy('NotificationConstructor', mockNotificationFn).and.callThrough();
    Object.assign(notificationConstructorSpy, mockNotificationFn);

    (window as any).Notification = notificationConstructorSpy;

    TestBed.configureTestingModule({
      providers: [
        UrgentAlertService,
        { provide: AssignmentService, useValue: assignmentServiceMock },
      ],
    });

    service = TestBed.inject(UrgentAlertService);
    localStorage.clear();
  });

  afterEach(() => {
    // Restaurar Notification original
    (window as any).Notification = originalNotification;
    localStorage.clear();
  });

  it('debe crearse exitosamente', () => {
    expect(service).toBeTruthy();
  });

  describe('requestPermission', () => {
    it('debe retornar "unsupported" si Notification no existe en window', async () => {
      delete (window as any).Notification;
      const result = await service.requestPermission();
      expect(result).toBe('unsupported');
    });

    it('debe delegar en Notification.requestPermission cuando está disponible', async () => {
      const result = await service.requestPermission();
      expect(result).toBe('granted');
      expect((window as any).Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('no debe iniciar monitoreo si Notification no existe en window', () => {
      delete (window as any).Notification;
      service.start();
      expect((service as any).monitoring).toBeUndefined();
    });

    it('debe iniciar la suscripción periódica y consultar getAllAssignments', fakeAsync(() => {
      service.start();
      tick(1);
      expect((service as any).monitoring).toBeDefined();
      expect(assignmentServiceMock.getAllAssignments).toHaveBeenCalled();
    }));

    it('no debe duplicar la suscripción si ya se encuentra monitoreando', () => {
      service.start();
      const firstSub = (service as any).monitoring;
      service.start();
      const secondSub = (service as any).monitoring;
      expect(firstSub).toBe(secondSub);
    });
  });

  describe('notifyDueAssignments', () => {
    const baseDueTime = Date.now() + 15 * 60 * 1000; // Vence en 15 minutos
    const sampleAssignment: AssignmentResponseCompDto = {
      id: 501,
      title: 'Taller de Algoritmos',
      description: 'Entrega en plataforma',
      dueDate: new Date(baseDueTime).toISOString(),
      subjectId: 3,
      subjectName: 'Estructuras de Datos',
      reminderMinutes: 30, // Recordatorio 30 minutos antes (ya activo porque faltan 15 min)
    };

    it('no debe disparar alertas si Notification.permission no es "granted"', () => {
      (window as any).Notification.permission = 'denied';
      (service as any).notifyDueAssignments([sampleAssignment]);
      expect(notificationConstructorSpy).not.toHaveBeenCalled();
    });

    it('debe omitir entregas que no tengan configurado reminderMinutes', () => {
      const noReminderAssignment: AssignmentResponseCompDto = {
        ...sampleAssignment,
        reminderMinutes: undefined,
      };
      (service as any).notifyDueAssignments([noReminderAssignment]);
      expect(notificationConstructorSpy).not.toHaveBeenCalled();
    });

    it('debe disparar Notification y persistir registro en localStorage para entrega activa en ventana', () => {
      (window as any).Notification.permission = 'granted';
      (service as any).notifyDueAssignments([sampleAssignment]);

      expect(notificationConstructorSpy).toHaveBeenCalledWith('Entrega próxima', {
        body: 'Taller de Algoritmos vence pronto (Estructuras de Datos).',
      });

      const key = `urgent-alert-501-${new Date(sampleAssignment.dueDate).getTime()}`;
      expect(localStorage.getItem(key)).toBe('sent');
    });

    it('no debe duplicar notificación si la clave ya se encuentra registrada en localStorage', () => {
      (window as any).Notification.permission = 'granted';
      const key = `urgent-alert-501-${new Date(sampleAssignment.dueDate).getTime()}`;
      localStorage.setItem(key, 'sent');

      (service as any).notifyDueAssignments([sampleAssignment]);
      expect(notificationConstructorSpy).not.toHaveBeenCalled();
    });

    it('no debe disparar notificación si aún no ha comenzado la ventana de recordatorio (demasiado temprano)', () => {
      // Tarea que vence en 120 minutos con recordatorio de 15 minutos
      const futureAssignment: AssignmentResponseCompDto = {
        ...sampleAssignment,
        id: 502,
        dueDate: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
        reminderMinutes: 15,
      };

      (service as any).notifyDueAssignments([futureAssignment]);
      expect(notificationConstructorSpy).not.toHaveBeenCalled();
    });

    it('no debe disparar notificación si la fecha de vencimiento ya pasó (now >= dueAt)', () => {
      // Tarea vencida hace 5 minutos
      const pastAssignment: AssignmentResponseCompDto = {
        ...sampleAssignment,
        id: 503,
        dueDate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        reminderMinutes: 30,
      };

      (service as any).notifyDueAssignments([pastAssignment]);
      expect(notificationConstructorSpy).not.toHaveBeenCalled();
    });
  });
});
