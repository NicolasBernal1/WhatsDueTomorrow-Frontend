import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalendarService } from './calendar.service';
import { environment } from '../../environments/environment';

describe('CalendarService (F23 — Servicio de Sincronización y Exportación)', () => {
  let service: CalendarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CalendarService],
    });

    service = TestBed.inject(CalendarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe estar definido el servicio CalendarService', () => {
    expect(service).toBeTruthy();
  });

  describe('createSubscription', () => {
    it('debe enviar una petición POST a /calendar/subscription y retornar respuesta tipada', () => {
      const mockResponse = {
        status: 200,
        message: 'Subscription created',
        data: {
          webcalUrl: 'webcal://localhost:3000/calendar/feed/test-token.ics',
        },
      };

      service.createSubscription().subscribe((res) => {
        expect(res.status).toBe(200);
        expect(res.data?.webcalUrl).toBe('webcal://localhost:3000/calendar/feed/test-token.ics');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/calendar/subscription`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('download', () => {
    it('debe enviar una petición GET a /calendar/download solicitando responseType blob', () => {
      const mockBlob = new Blob(['BEGIN:VCALENDAR\nEND:VCALENDAR'], { type: 'text/calendar' });

      service.download().subscribe((blob) => {
        expect(blob).toBeTruthy();
        expect(blob.size).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/calendar/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });
});
