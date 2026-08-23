import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubjectService } from './subject.service';
import { environment } from '../../environments/environment';

describe('SubjectService', () => {
  let service: SubjectService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubjectService],
    });
    service = TestBed.inject(SubjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getSubjects ──────────────────────────────────────────────────────────────

  describe('getSubjects', () => {
    it('should GET the list of subjects', () => {
      const mockResponse = { status: 200, data: [{ id: 1, name: 'Math', professor: 'Dr. Smith', color: '#ff0000' }] };

      service.getSubjects().subscribe(res => {
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].name).toBe('Math');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ─── getSubjectById ───────────────────────────────────────────────────────────

  describe('getSubjectById', () => {
    it('should GET a specific subject by id', () => {
      const mockResponse = { status: 200, data: { id: 5, name: 'Physics', professor: 'Dr. Jones', color: '#0000ff' } };

      service.getSubjectById(5).subscribe(res => {
        expect(res.data?.id).toBe(5);
        expect(res.data?.name).toBe('Physics');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/5`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ─── addSubject ───────────────────────────────────────────────────────────────

  describe('addSubject', () => {
    it('should POST the new subject data', () => {
      const dto = { name: 'Chemistry', professor: 'Dr. Brown', color: '#00ff00' };
      const mockResponse = { status: 201 };

      service.addSubject(dto).subscribe(res => {
        expect(res.status).toBe(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  // ─── deleteSubject ────────────────────────────────────────────────────────────

  describe('deleteSubject', () => {
    it('should DELETE a subject by id', () => {
      const mockResponse = { status: 200 };

      service.deleteSubject(3).subscribe(res => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/3`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  // ─── getClass ─────────────────────────────────────────────────────────────────

  describe('getClass', () => {
    it('should GET the list of classes for the user', () => {
      const mockResponse = { status: 200, data: [{ id: 1, dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00', subjectId: 1, subjectName: 'Math', color: '#ff0000' }] };

      service.getClass().subscribe(res => {
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].dayOfWeek).toBe('Monday');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/classes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ─── deleteClass ──────────────────────────────────────────────────────────────

  describe('deleteClass', () => {
    it('should DELETE a class by id', () => {
      const mockResponse = { status: 200 };

      service.deleteClass(7).subscribe(res => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/classes/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});