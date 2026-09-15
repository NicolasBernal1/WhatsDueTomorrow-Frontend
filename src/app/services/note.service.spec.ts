import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoteService } from './note.service';
import { environment } from '../../environments/environment';
import { CreateNoteDto, Note, UpdateNoteDto } from '../models/note.model';

describe('NoteService (F24 Bitácora de apuntes)', () => {
  let service: NoteService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NoteService]
    });
    service = TestBed.inject(NoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('getNotesBySubject', () => {
    it('debe solicitar GET /subjects/:subjectId/notes', () => {
      const mockNotes: Note[] = [
        {
          id: 1,
          title: 'Nota 1',
          content: 'Contenido 1',
          linkUrl: null,
          createdAt: '2026-03-01T12:00:00Z',
          updatedAt: '2026-03-01T12:00:00Z',
          subjectId: 10
        }
      ];

      service.getNotesBySubject(10).subscribe(res => {
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].title).toBe('Nota 1');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/notes`);
      expect(req.request.method).toBe('GET');
      req.flush({ status: 200, message: 'Notes retrieved', data: mockNotes });
    });
  });

  describe('getNoteById', () => {
    it('debe solicitar GET /subjects/:subjectId/notes/:noteId', () => {
      const mockNote: Note = {
        id: 5,
        title: 'Nota 5',
        content: 'Contenido 5',
        linkUrl: 'https://campus.edu',
        createdAt: '2026-03-01T12:00:00Z',
        updatedAt: '2026-03-01T12:00:00Z',
        subjectId: 10
      };

      service.getNoteById(10, 5).subscribe(res => {
        expect(res.data?.id).toBe(5);
        expect(res.data?.linkUrl).toBe('https://campus.edu');
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/notes/5`);
      expect(req.request.method).toBe('GET');
      req.flush({ status: 200, message: 'Note retrieved', data: mockNote });
    });
  });

  describe('createNote', () => {
    it('debe enviar POST a /subjects/:subjectId/notes con el DTO', () => {
      const dto: CreateNoteDto = {
        title: 'Nuevo apunte',
        content: 'Apunte de clase',
        linkUrl: 'https://docs.google.com'
      };

      service.createNote(10, dto).subscribe(res => {
        expect(res.status).toBe(201);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/notes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ status: 201, message: 'Note created', data: { id: 11, ...dto } });
    });
  });

  describe('updateNote', () => {
    it('debe enviar PATCH a /subjects/:subjectId/notes/:noteId con el DTO', () => {
      const dto: UpdateNoteDto = {
        title: 'Título actualizado'
      };

      service.updateNote(10, 5, dto).subscribe(res => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/notes/5`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ status: 200, message: 'Note updated' });
    });
  });

  describe('deleteNote', () => {
    it('debe enviar DELETE a /subjects/:subjectId/notes/:noteId', () => {
      service.deleteNote(10, 5).subscribe(res => {
        expect(res.status).toBe(200);
      });

      const req = httpMock.expectOne(`${apiUrl}/subjects/10/notes/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ status: 200, message: 'Note deleted', data: null });
    });
  });
});
