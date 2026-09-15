import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubtaskService } from './subtask.service';
import { environment } from '../../environments/environment';

describe('SubtaskService (F22 — Servicio HTTP de Subtareas)', () => {
  let service: SubtaskService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubtaskService],
    });
    service = TestBed.inject(SubtaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse exitosamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('debe enviar una petición GET a /assignments/:id/subtasks', () => {
      const mockResponse = {
        status: 200,
        message: 'OK',
        data: { subtasks: [{ id: 1, title: 'Subtarea 1', completed: false, position: 0 }], progress: 0 },
      };

      service.getAll(10).subscribe((res) => {
        expect(res.status).toBe(200);
        expect(res.data?.subtasks.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/10/subtasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('create', () => {
    it('debe enviar una petición POST con el título a /assignments/:id/subtasks', () => {
      const mockResponse = {
        status: 201,
        message: 'Created',
        data: { subtasks: [{ id: 2, title: 'Nueva', completed: false, position: 1 }], progress: 0 },
      };

      service.create(10, 'Nueva').subscribe((res) => {
        expect(res.status).toBe(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/10/subtasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: 'Nueva' });
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('debe enviar una petición PATCH con cambios a /assignments/:id/subtasks/:subtaskId', () => {
      const mockResponse = {
        status: 200,
        message: 'Updated',
        data: { subtasks: [{ id: 1, title: 'Editada', completed: true, position: 0 }], progress: 100 },
      };

      service.update(10, 1, { completed: true }).subscribe((res) => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/10/subtasks/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ completed: true });
      req.flush(mockResponse);
    });
  });

  describe('remove', () => {
    it('debe enviar una petición DELETE a /assignments/:id/subtasks/:subtaskId', () => {
      const mockResponse = {
        status: 200,
        message: 'Deleted',
        data: { subtasks: [], progress: 0 },
      };

      service.remove(10, 1).subscribe((res) => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/10/subtasks/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('reorder', () => {
    it('debe enviar una petición PATCH con orderedIds a /assignments/:id/subtasks/order', () => {
      const mockResponse = {
        status: 200,
        message: 'Reordered',
        data: { subtasks: [], progress: 0 },
      };

      service.reorder(10, [2, 1]).subscribe((res) => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/assignments/10/subtasks/order`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ orderedIds: [2, 1] });
      req.flush(mockResponse);
    });
  });
});
