import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalendarService } from './calendar.service';
import { environment } from '../../environments/environment';
import { Should } from '../common/fluent-assertions';

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
    service.Should().NotBeNull().And.BeDefined();
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
        res.status.Should().Be(200);
        Should(res.data?.webcalUrl).Be('webcal://localhost:3000/calendar/feed/test-token.ics');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/calendar/subscription`);
      req.request.method.Should().Be('POST');
      req.request.body.Should().BeEquivalentTo({});
      req.flush(mockResponse);
    });
  });

  describe('download', () => {
    it('debe enviar una petición GET a /calendar/download solicitando responseType blob', () => {
      const mockBlob = new Blob(['BEGIN:VCALENDAR\nEND:VCALENDAR'], { type: 'text/calendar' });

      service.download().subscribe((blob) => {
        blob.Should().NotBeNull().And.BeDefined();
        blob.size.Should().BeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/calendar/download`);
      req.request.method.Should().Be('GET');
      req.request.responseType.Should().Be('blob');
      req.flush(mockBlob);
    });
  });
});
