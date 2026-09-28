import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubjectService } from './subject.service';
import { environment } from '../../environments/environment';
import { Should } from '../common/fluent-assertions';

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
    Should(service).NotBeNull();
  });

  // ─── getSubjects ──────────────────────────────────────────────────────────────

  describe('getSubjects', () => {
    it('should GET the list of subjects', () => {
      const mockResponse = { status: 200, data: [{ id: 1, name: 'Math', professor: 'Dr. Smith', color: '#ff0000', credits: 3 }] };

      service.getSubjects().subscribe(res => {
        Should(res.data?.length).Be(1);
        Should(res.data?.[0].name).Be('Math');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects`);
      req.request.method.Should().Be('GET');
      req.flush(mockResponse);
    });
  });

  // ─── getSubjectById ───────────────────────────────────────────────────────────

  describe('getSubjectById', () => {
    it('should GET a specific subject by id', () => {
      const mockResponse = { status: 200, data: { id: 5, name: 'Physics', professor: 'Dr. Jones', color: '#0000ff', credits: 4 } };

      service.getSubjectById(5).subscribe(res => {
        Should(res.data?.id).Be(5);
        Should(res.data?.name).Be('Physics');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/5`);
      req.request.method.Should().Be('GET');
      req.flush(mockResponse);
    });
  });

  // ─── addSubject ───────────────────────────────────────────────────────────────

  describe('addSubject', () => {
    it('should POST the new subject data', () => {
      const dto = { name: 'Chemistry', professor: 'Dr. Brown', color: '#00ff00', credits: 3 };
      const mockResponse = { status: 201 };

      service.addSubject(dto).subscribe(res => {
        res.status.Should().Be(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects`);
      req.request.method.Should().Be('POST');
      req.request.body.Should().BeEquivalentTo(dto);
      req.flush(mockResponse);
    });
  });

  // ─── deleteSubject ────────────────────────────────────────────────────────────

  describe('deleteSubject', () => {
    it('should DELETE a subject by id', () => {
      const mockResponse = { status: 200 };

      service.deleteSubject(3).subscribe(res => {
        res.status.Should().Be(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/3`);
      req.request.method.Should().Be('DELETE');
      req.flush(mockResponse);
    });
  });

  // ─── getClass ─────────────────────────────────────────────────────────────────

  describe('getClass', () => {
    it('should GET the list of classes for the user', () => {
      const mockResponse = { status: 200, data: [{ id: 1, dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00', subjectId: 1, subjectName: 'Math', color: '#ff0000' }] };

      service.getClass().subscribe(res => {
        Should(res.data?.length).Be(1);
        Should(res.data?.[0].dayOfWeek).Be('Monday');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/classes`);
      req.request.method.Should().Be('GET');
      req.flush(mockResponse);
    });
  });

  // ─── deleteClass ──────────────────────────────────────────────────────────────

  describe('deleteClass', () => {
    it('should DELETE a class by id', () => {
      const mockResponse = { status: 200 };

      service.deleteClass(7).subscribe(res => {
        res.status.Should().Be(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/classes/7`);
      req.request.method.Should().Be('DELETE');
      req.flush(mockResponse);
    });
  });

  // ─── getAcademicLoadSummary (F26-F29) ──────────────────────────────────────────

  describe('getAcademicLoadSummary', () => {
    it('should GET the academic load summary', () => {
      const mockResponse = {
        status: 200,
        message: 'Resumen de carga académica obtenido con éxito',
        data: {
          totalCredits: 15,
          status: 'balanceada' as const,
          statusLabel: 'Carga balanceada',
          weeklyPresentialHours: 8,
          weeklyAutonomousHours: 16,
          subjectsCount: 5,
          classesCount: 4,
        },
      };

      service.getAcademicLoadSummary().subscribe(res => {
        Should(res.data?.totalCredits).Be(15);
        Should(res.data?.status).Be('balanceada');
        Should(res.data?.weeklyAutonomousHours).Be(16);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/academic-load`);
      req.request.method.Should().Be('GET');
      req.flush(mockResponse);
    });
  });

  describe('searchSubjects', () => {
    it('should GET the search endpoint with the encoded query', () => {
      const mockResponse = { status: 200, data: [{ id: 1, name: 'Cálculo', professor: 'Dr. Smith', color: '#ff0000', credits: 3 }] };

      service.searchSubjects('cálculo & más').subscribe(res => {
        Should(res.data?.length).Be(1);
        Should(res.data?.[0].name).Be('Cálculo');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/search?q=${encodeURIComponent('cálculo & más')}`);
      req.request.method.Should().Be('GET');
      req.flush(mockResponse);
    });
  });
});