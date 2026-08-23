import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClassService } from './class.service';
import { environment } from '../../environments/environment';

describe('ClassService', () => {
  let service: ClassService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClassService],
    });
    service = TestBed.inject(ClassService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── addClass ─────────────────────────────────────────────────────────────────

  describe('addClass', () => {
    it('should POST the class data to /subjects/classes', () => {
      const dto = { subjectId: 1, dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00' };
      const mockResponse = { status: 201 };

      service.addClass(dto).subscribe(res => {
        expect(res.status).toBe(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/classes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });
});