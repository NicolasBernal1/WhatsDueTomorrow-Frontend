import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ScheduleComponent } from './schedule.component';
import { SubjectService } from '../../services/subject.service';
import { CalendarService } from '../../services/calendar.service';
import { Router } from '@angular/router';
import { Should } from '../../common/fluent-assertions';

/**
 * ============================================================================
 * SUITE DE PRUEBAS DE REGRESIÓN — F23: SINCRONIZACIÓN Y EXPORTACIÓN .ICS
 * ============================================================================
 * Objetivo de Regresión:
 * Garantizar que modificaciones futuras en la vista de horarios, gestión de
 * blobs, integración con la API de portapapeles (navigator.clipboard) o
 * manipulación del DOM para descargas automáticas no introduzcan fugas de memoria,
 * enlaces webcal rotos o estados inconsistentes de retroalimentación al usuario.
 */
describe('F23 Regression Suite: Sincronización y exportación de calendario .ics (Frontend)', () => {
  let component: ScheduleComponent;
  let fixture: ComponentFixture<ScheduleComponent>;
  let subjectServiceMock: jasmine.SpyObj<SubjectService>;
  let calendarServiceMock: jasmine.SpyObj<CalendarService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockWebcalUrl = 'webcal://api.whatsdue.app/calendar/feed/secure-token-12345.ics';

  beforeEach(async () => {
    subjectServiceMock = jasmine.createSpyObj('SubjectService', [
      'getClass',
      'deleteClass',
      'editClass',
    ]);
    calendarServiceMock = jasmine.createSpyObj('CalendarService', [
      'createSubscription',
      'download',
    ]);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    subjectServiceMock.getClass.and.returnValue(
      of({ status: 200, message: 'OK', data: [] })
    );

    await TestBed.configureTestingModule({
      imports: [ScheduleComponent],
      providers: [
        { provide: SubjectService, useValue: subjectServiceMock },
        { provide: CalendarService, useValue: calendarServiceMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ScheduleComponent, '<div></div>')
      .compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 1: Manejo de Blob, Descarga y Prevención de Fugas de Memoria
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 1: Descarga Segura de Archivo .ics y Limpieza de ObjectURL', () => {
    it('debe crear ObjectURL, disparar descarga con nombre "whats-due-tomorrow.ics" y revocar la URL inmediatamente', () => {
      const mockBlob = new Blob(['BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n'], {
        type: 'text/calendar',
      });
      calendarServiceMock.download.and.returnValue(of(mockBlob));

      const fakeObjectUrl = 'blob:http://localhost:4200/fake-calendar-guid';
      const createSpy = spyOn(URL, 'createObjectURL').and.returnValue(fakeObjectUrl);
      const revokeSpy = spyOn(URL, 'revokeObjectURL');

      // Interceptar clic en enlace para verificar nombre de archivo y href
      const fakeAnchor = document.createElement('a');
      const clickSpy = spyOn(fakeAnchor, 'click');
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName.toLowerCase() === 'a') return fakeAnchor;
        return document.createElement(tagName);
      });

      // Act
      component.downloadCalendar();

      // Assert
      Should(calendarServiceMock.download).HaveBeenCalled();
      Should(createSpy).HaveBeenCalledWith(mockBlob);
      fakeAnchor.href.Should().Contain('fake-calendar-guid');
      fakeAnchor.download.Should().Be('whats-due-tomorrow.ics');
      Should(clickSpy).HaveBeenCalled();
      Should(revokeSpy).HaveBeenCalledWith(fakeObjectUrl);
    });

    it('debe capturar errores HTTP en la descarga y notificar al usuario sin romper el componente', () => {
      calendarServiceMock.download.and.returnValue(
        throwError(() => new Error('Error 500: Failed to compile iCalendar'))
      );

      component.downloadCalendar();

      component.calendarMessage.Should().Be('Unable to download the calendar file.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 2: Creación de Suscripción Webcal y Mensajes de Estado
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 2: Generación de Suscripción Webcal (createCalendarSubscription)', () => {
    it('debe almacenar la URL de suscripción y mostrar mensaje de éxito tras respuesta 200 OK', () => {
      calendarServiceMock.createSubscription.and.returnValue(
        of({
          status: 200,
          message: 'OK',
          data: { webcalUrl: mockWebcalUrl },
        })
      );

      component.createCalendarSubscription();

      component.subscriptionUrl.Should().Be(mockWebcalUrl);
      component.calendarMessage.Should().Be('Your subscription link is ready.');
    });

    it('debe mostrar mensaje de fallo si la respuesta no incluye una URL válida', () => {
      calendarServiceMock.createSubscription.and.returnValue(
        of({
          status: 200,
          message: 'OK',
          data: { webcalUrl: '' },
        })
      );

      component.createCalendarSubscription();

      component.subscriptionUrl.Should().Be('');
      component.calendarMessage.Should().Be('Unable to create the subscription link.');
    });

    it('debe gestionar adecuadamente el fallo de red del servidor al crear suscripción', () => {
      calendarServiceMock.createSubscription.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.createCalendarSubscription();

      component.calendarMessage.Should().Be('Unable to create the subscription link.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // INVARIANTE 3: Copia en Portapapeles y Tolerancia a Fallos de Permisos
  // ──────────────────────────────────────────────────────────────────────────
  describe('Invariante de Regresión 3: Copia en Portapapeles y Fallback (copySubscriptionUrl)', () => {
    it('no debe interactuar con navigator.clipboard si no existe subscriptionUrl generado', () => {
      const writeSpy = spyOn(navigator.clipboard, 'writeText');

      component.subscriptionUrl = '';
      component.copySubscriptionUrl();

      Should(writeSpy).NotHaveBeenCalled();
    });

    it('debe copiar al portapapeles y mostrar mensaje de confirmación cuando se concede el permiso', async () => {
      const writeSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(
        Promise.resolve()
      );

      component.subscriptionUrl = mockWebcalUrl;
      component.copySubscriptionUrl();

      await new Promise((resolve) => setTimeout(resolve, 0));

      Should(writeSpy).HaveBeenCalledWith(mockWebcalUrl);
      component.calendarMessage.Should().Be(
        'Subscription link copied. Open it from your calendar app.'
      );
    });

    it('debe mostrar mensaje instructivo manual si el navegador rechaza la escritura en portapapeles', async () => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(
        Promise.reject(new Error('Permission denied'))
      );

      component.subscriptionUrl = mockWebcalUrl;
      component.copySubscriptionUrl();

      await new Promise((resolve) => setTimeout(resolve, 0));

      component.calendarMessage.Should().Be('Copy the subscription link manually.');
    });
  });
});
