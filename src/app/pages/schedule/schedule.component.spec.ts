import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleComponent } from './schedule.component';
import { SubjectService } from '../../services/subject.service';
import { CalendarService } from '../../services/calendar.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('ScheduleComponent', () => {

  let component: ScheduleComponent;
  let fixture: ComponentFixture<ScheduleComponent>;

  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let calendarServiceMock: jasmine.SpyObj<CalendarService>;
  let routerMock: jasmine.SpyObj<Router>;

  const classesMock: any[] = [
    {
      id: 1,
      dayOfWeek: 'monday',
      startTime: '08:00',
      endTime: '10:00',
      subject: {
        id: 10,
        name: 'validacion',
        professor: 'gabriel',
        color: '#0078d4'
      }
    }
  ];

  beforeEach(async () => {

    subjectServiceMock = jasmine.createSpyObj(
      'SubjectService',
      ['getClass', 'deleteClass', 'editClass']
    );

    routerMock = jasmine.createSpyObj(
      'Router',
      ['navigate']
    );

    subjectServiceMock.getClass.and.returnValue(
      of({
        status: 200,
        message: 'Classes retrieved successfully',
        data: classesMock
      })
    );

    calendarServiceMock = jasmine.createSpyObj('CalendarService', ['createSubscription', 'download']);

    await TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        {
          provide: SubjectService,
          useValue: subjectServiceMock
        },
        {
          provide: Router,
          useValue: routerMock
        },
        {
          provide: CalendarService,
          useValue: calendarServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
  });

  describe('Consultar horario', () => {

    // Camino:
    // 1,2,3,4,5,7,17
    it('1. debe mostrar error cuando getClass falla', () => {

      subjectServiceMock.getClass.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      spyOn(window, 'alert');

      component.ngOnInit();

      expect(window.alert).toHaveBeenCalledWith(
        'Error getting classes'
      );
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,11...
    it('2. debe continuar la búsqueda cuando no existe una clase para el horario', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'monday',
        '11:00'
      );

      expect(result).toBeUndefined();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,13,11...
    it('3. debe ignorar una clase que pertenece a otro día', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'tuesday',
        '08:00'
      );

      expect(result).toBeUndefined();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,13,14,11...
    it('4. debe ignorar una clase que está fuera del horario consultado', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'monday',
        '10:00'
      );

      expect(result).toBeUndefined();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17
    it('5. debe retornar la clase cuando coincide día y horario', () => {

      component.classes = classesMock;

      const result = component.getClassesFor(
        'monday',
        '08:00'
      );

      expect(result).toEqual(classesMock[0]);
    });

  });

  describe('Ver detalles de asignatura desde la clase', () => {

    // Camino:
    // 1,2,3,4
    it('6. debe navegar al detalle de la asignatura', () => {

      const subjectId = 15;

      component.onClickClass(subjectId);

      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/subjects/15'
      ]);
    });

  });

  describe('Eliminar clase', () => {

    beforeEach(() => {

      component.selectedClass = {
        id: 1,
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '10:00',
        subject: {
          id: 10,
          name: 'validacion',
          professor: 'gabriel',
          color: '#0078d4'
        }
      } as any;

    });


    // Camino:
    // 1,2,3,4,5,7,13
    it('7. no debe eliminar la clase cuando el usuario cancela', () => {

      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteClass();

      expect(subjectServiceMock.deleteClass)
        .not.toHaveBeenCalled();

      expect(component.contextMenuVisible)
        .toBeFalse();

      expect(component.selectedClass)
        .toBeNull();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,11,12,13
    it('8. debe manejar el error al eliminar una clase', () => {

      spyOn(window, 'confirm').and.returnValue(true);

      subjectServiceMock.deleteClass.and.returnValue(
        throwError(() => new Error('Delete error'))
      );

      spyOn(console, 'error');

      component.deleteClass();

      expect(subjectServiceMock.deleteClass)
        .toHaveBeenCalledWith(1);

      expect(console.error)
        .toHaveBeenCalled();
    });


    // Camino:
    // 1,2,3,4,5,6,8,9,10,12,13
    it('9. debe eliminar la clase correctamente', () => {

      spyOn(window, 'confirm').and.returnValue(true);

      subjectServiceMock.deleteClass.and.returnValue(
        of({
          status: 200,
          message: 'Class deleted successfully',
          data: null
        })
      );

      component.classes = [
        component.selectedClass!
      ];

      component.deleteClass();

      expect(subjectServiceMock.deleteClass)
        .toHaveBeenCalledWith(1);

      expect(component.classes.length)
        .toBe(0);

      expect(component.contextMenuVisible)
        .toBeFalse();

      expect(component.selectedClass)
        .toBeNull();
    });

  });

  describe('Editar clase', () => {

    // Camino:
    // 1,2,3,5
    it('10. no debe hacer nada cuando no existe selectedClass', () => {

      component.selectedClass = null;

      component.editClass();

      expect(component.showEditModal)
        .toBeFalse();

    });


    // Camino:
    // 1,2,3,4,6...
    it('11. debe abrir el modal cuando existe selectedClass', () => {

      component.selectedClass = classesMock[0];

      component.contextMenuVisible = true;

      component.editClass();

      expect(component.showEditModal)
        .toBeTrue();

      expect(component.contextMenuVisible)
        .toBeFalse();

    });

  });

  describe('Resaltar clase en curso (isCurrentClass)', () => {

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    // Camino: clase de otro dia
    it('12. debe retornar false cuando la clase no es de hoy', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0));

      const claseDeOtroDia = { ...classesMock[0], dayOfWeek: 'tuesday' };

      const result = component.isCurrentClass(claseDeOtroDia);

      expect(result).toBeFalse();
    });

    // Camino: mismo dia pero antes de que empiece la clase
    it('13. debe retornar false cuando aún no empieza la clase de hoy', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 7, 30));

      const result = component.isCurrentClass(classesMock[0]);

      expect(result).toBeFalse();
    });

    // Camino: mismo dia pero después de que termina la clase
    it('14. debe retornar false cuando la clase de hoy ya terminó', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 10, 0));

      const result = component.isCurrentClass(classesMock[0]);

      expect(result).toBeFalse();
    });

    // Camino: mismo dia y dentro del rango horario
    it('15. debe retornar true cuando la clase de hoy está en curso', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0));

      const result = component.isCurrentClass(classesMock[0]);

      expect(result).toBeTrue();
    });

  });

  describe('Ver proxima clase (getNextClass / getNextClassDayLabel)', () => {

    const buildClass = (overrides: any) => ({
      id: overrides.id,
      dayOfWeek: overrides.dayOfWeek,
      startTime: overrides.startTime,
      endTime: overrides.endTime,
      subject: {
        id: overrides.id + 100,
        name: `subject-${overrides.id}`,
        professor: 'gabriel',
        color: '#0078d4',
        credits: 3
      }
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    // Camino: sin clases registradas
    it('16. debe retornar null cuando el usuario no tiene clases', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0));

      component.classes = [];

      expect(component.getNextClass()).toBeNull();
    });

    // Camino: hay varias clases hoy mas tarde, debe elegir la mas cercana
    it('17. debe retornar la clase mas proxima de hoy cuando aun faltan por empezar', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0)); 

      const clasesHoy = [
        buildClass({ id: 2, dayOfWeek: 'monday', startTime: '14:00', endTime: '15:00' }),
        buildClass({ id: 1, dayOfWeek: 'monday', startTime: '11:00', endTime: '12:00' })
      ];
      component.classes = clasesHoy;

      const result = component.getNextClass();

      expect(result?.id).toBe(1);
      expect(component.getNextClassDayLabel(result!)).toBe('Hoy');
    });

    // Camino: ya pasaron todas las clases de hoy, hay una mañana
    it('18. debe retornar la clase de mañana cuando ya no quedan clases hoy', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0));

      component.classes = [
        buildClass({ id: 1, dayOfWeek: 'monday', startTime: '07:00', endTime: '08:00' }), // ya pasó
        buildClass({ id: 2, dayOfWeek: 'tuesday', startTime: '09:00', endTime: '10:00' })
      ];

      const result = component.getNextClass();

      expect(result?.id).toBe(2);
      expect(component.getNextClassDayLabel(result!)).toBe('Mañana');
    });

    // Camino: la clase mas proxima esta mas adelante en la semana
    it('19. debe usar el nombre del dia para una clase que no es hoy ni mañana', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0)); 

      const clase = buildClass({ id: 3, dayOfWeek: 'wednesday', startTime: '09:00', endTime: '10:00' });
      component.classes = [clase];

      const result = component.getNextClass();

      expect(result?.id).toBe(3);
      expect(component.getNextClassDayLabel(result!)).toBe('Wednesday');
    });

    // Camino: todas las clases de la semana ya pasaron, se envuelve a la proxima semana
    it('20. debe volver a la primera clase de hoy cuando ya pasaron todas las de la semana', () => {

      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2024, 0, 1, 9, 0));

      component.classes = [
        buildClass({ id: 1, dayOfWeek: 'monday', startTime: '07:00', endTime: '08:00' })
      ];

      const result = component.getNextClass();

      expect(result?.id).toBe(1);
    });

  });

  // =========================================================================
  // F23 — Sincronización y exportación de calendario .ics (Tabla 17 de DIAGRAMAS.docx)
  // =========================================================================
  describe('F23 — Sincronización y exportación de calendario .ics (Caminos Básicos Tabla 17)', () => {

    // Camino P1: 1-2-18
    it('Camino P1 (1-2-18): debe permanecer en estado de reposo sin emitir peticiones de calendario al no interactuar', () => {
      expect(component.subscriptionUrl).toBe('');
      expect(component.calendarMessage).toBe('');
      expect(calendarServiceMock.createSubscription).not.toHaveBeenCalled();
      expect(calendarServiceMock.download).not.toHaveBeenCalled();
    });

    // Camino P2: 1-2-3-4-5-8-2-18
    it('Camino P2 (1-2-3-4-5-8-2-18): debe asignar mensaje de error cuando createSubscription falla por error HTTP', () => {
      calendarServiceMock.createSubscription.and.returnValue(
        throwError(() => new Error('HTTP 500 Server Error'))
      );

      component.createCalendarSubscription();

      expect(calendarServiceMock.createSubscription).toHaveBeenCalled();
      expect(component.calendarMessage).toBe('Unable to create the subscription link.');
    });

    // Camino P3: 1-2-3-4-6-7-8-2-18 (Vacío)
    it('Camino P3 (1-2-3-4-6-7-8-2-18 Vacío): debe asignar mensaje de fallo cuando el backend retorna webcalUrl vacía o nula', () => {
      calendarServiceMock.createSubscription.and.returnValue(
        of({
          status: 200,
          message: 'Success',
          data: { webcalUrl: '' }
        })
      );

      component.createCalendarSubscription();

      expect(component.subscriptionUrl).toBe('');
      expect(component.calendarMessage).toBe('Unable to create the subscription link.');
    });

    // Camino P4: 1-2-3-4-6-7-8-2-18 (Válido)
    it('Camino P4 (1-2-3-4-6-7-8-2-18 Válido): debe asignar subscriptionUrl y mensaje de éxito cuando se genera enlace webcal válido', () => {
      const validUrl = 'webcal://localhost:3000/calendar/feed/abc123token.ics';
      calendarServiceMock.createSubscription.and.returnValue(
        of({
          status: 200,
          message: 'Success',
          data: { webcalUrl: validUrl }
        })
      );

      component.createCalendarSubscription();

      expect(component.subscriptionUrl).toBe(validUrl);
      expect(component.calendarMessage).toBe('Your subscription link is ready.');
    });

    // Camino P5: 1-2-9-2-18
    it('Camino P5 (1-2-9-2-18): debe abortar tempranamente si se invoca copySubscriptionUrl con subscriptionUrl vacío', () => {
      component.subscriptionUrl = '';
      if (navigator.clipboard) {
        spyOn(navigator.clipboard, 'writeText');
      }

      component.copySubscriptionUrl();

      if (navigator.clipboard) {
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      }
      expect(component.calendarMessage).toBe('');
    });

    // Camino P6: 1-2-9-10-11-12-2-18 (Resolve)
    it('Camino P6 (1-2-9-10-11-12-2-18 Resolve): debe copiar enlace y notificar éxito cuando navigator.clipboard resuelve', async () => {
      component.subscriptionUrl = 'webcal://localhost:3000/calendar/feed/abc123token.ics';
      const writeSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      component.copySubscriptionUrl();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(writeSpy).toHaveBeenCalledWith('webcal://localhost:3000/calendar/feed/abc123token.ics');
      expect(component.calendarMessage).toBe('Subscription link copied. Open it from your calendar app.');
    });

    // Camino P7: 1-2-9-10-11-12-2-18 (Reject)
    it('Camino P7 (1-2-9-10-11-12-2-18 Reject): debe solicitar copia manual cuando la promesa de navigator.clipboard es rechazada', async () => {
      component.subscriptionUrl = 'webcal://localhost:3000/calendar/feed/abc123token.ics';
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject(new Error('Permission denied')));

      component.copySubscriptionUrl();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(component.calendarMessage).toBe('Copy the subscription link manually.');
    });

    // Camino P8: 1-2-13-14-15-17-2-18
    it('Camino P8 (1-2-13-14-15-17-2-18): debe asignar mensaje de error cuando downloadCalendar falla por error HTTP', () => {
      calendarServiceMock.download.and.returnValue(
        throwError(() => new Error('HTTP 500 Network error'))
      );

      component.downloadCalendar();

      expect(calendarServiceMock.download).toHaveBeenCalled();
      expect(component.calendarMessage).toBe('Unable to download the calendar file.');
    });

    // Camino P9: 1-2-13-14-16-17-2-18
    it('Camino P9 (1-2-13-14-16-17-2-18): debe descargar archivo whats-due-tomorrow.ics mediante enlace temporal al recibir Blob', () => {
      const mockBlob = new Blob(['BEGIN:VCALENDAR\nEND:VCALENDAR'], { type: 'text/calendar' });
      calendarServiceMock.download.and.returnValue(of(mockBlob));

      spyOn(URL, 'createObjectURL').and.returnValue('blob:http://localhost/fake-uuid');
      spyOn(URL, 'revokeObjectURL');
      const clickSpy = jasmine.createSpy('click');
      const mockAnchor = {
        href: '',
        download: '',
        click: clickSpy,
      };
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'a') return mockAnchor as any;
        return document.createElement(tagName);
      });

      component.downloadCalendar();

      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockAnchor.download).toBe('whats-due-tomorrow.ics');
      expect(mockAnchor.href).toBe('blob:http://localhost/fake-uuid');
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-uuid');
    });

    // Defecto QA DEF-QA-F23-03
    it('[DEF-QA-F23-03] debe documentar que la ausencia de Clipboard API en entornos no seguros lanza TypeError por falta de guarda defensiva', () => {
      const originalClipboard = navigator.clipboard;
      try {
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        component.subscriptionUrl = 'webcal://localhost:3000/calendar/feed/abc123token.ics';

        // Verificación del defecto QA DEF-QA-F23-03:
        // En entornos sin HTTPS o sin soporte de Clipboard API, al no validar navigator.clipboard
        // se produce un TypeError al intentar invocar writeText
        expect(() => component.copySubscriptionUrl()).toThrowError(TypeError);
      } finally {
        Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
      }
    });

  });

});