import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AssignmentService } from './assignment.service';
import { environment } from '../../environments/environment';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AssignmentService],
    });
    service = TestBed.inject(AssignmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getAssignmentsBySubject ──────────────────────────────────────────────────

  describe('getAssignmentsBySubject', () => {
    it('should GET assignments for the given subject id', () => {
      const mockResponse = { status: 200, data: [{ id: 1, title: 'T1', description: '', dueDate: '2025-06-01', subjectId: 10 }] };

      service.getAssignmentsBySubject(10).subscribe(res => {
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].subjectId).toBe(10);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/subject/10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ─── addAssignment ────────────────────────────────────────────────────────────

  describe('addAssignment', () => {
    it('should POST the assignment data to the correct subject endpoint', () => {
      const dto = { title: 'Nueva tarea', description: 'desc', dueDate: '2025-07-01' };
      const mockResponse = { status: 201 };

      service.addAssignment(dto, 10).subscribe(res => {
        expect(res.status).toBe(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/subject/10`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  // ─── getAllAssignments ────────────────────────────────────────────────────────

  describe('getAllAssignments', () => {
    it('should GET all assignments for the logged-in user', () => {
      const mockResponse = { status: 200, data: [{ id: 1, title: 'T1', description: '', dueDate: '2025-06-01', subjectId: 10, subjectName: 'Math' }] };

      service.getAllAssignments().subscribe(res => {
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].subjectName).toBe('Math');
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ─── deleteAssignment ─────────────────────────────────────────────────────────

  describe('deleteAssignment', () => {
    it('should DELETE the assignment by id', () => {
      const mockResponse = { status: 200 };

      service.deleteAssignment(42).subscribe(res => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/42`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});