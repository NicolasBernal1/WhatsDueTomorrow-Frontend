import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseResponseDto } from '../models/base-response.dto';
import { CreateNoteDto, Note, UpdateNoteDto } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNotesBySubject(subjectId: number): Observable<BaseResponseDto<Note[]>> {
    return this.http.get<BaseResponseDto<Note[]>>(`${this.apiUrl}/subjects/${subjectId}/notes`);
  }

  getNoteById(subjectId: number, noteId: number): Observable<BaseResponseDto<Note>> {
    return this.http.get<BaseResponseDto<Note>>(`${this.apiUrl}/subjects/${subjectId}/notes/${noteId}`);
  }

  createNote(subjectId: number, dto: CreateNoteDto): Observable<BaseResponseDto<Note>> {
    return this.http.post<BaseResponseDto<Note>>(`${this.apiUrl}/subjects/${subjectId}/notes`, dto);
  }

  updateNote(subjectId: number, noteId: number, dto: UpdateNoteDto): Observable<BaseResponseDto<Note>> {
    return this.http.patch<BaseResponseDto<Note>>(`${this.apiUrl}/subjects/${subjectId}/notes/${noteId}`, dto);
  }

  deleteNote(subjectId: number, noteId: number): Observable<BaseResponseDto<null>> {
    return this.http.delete<BaseResponseDto<null>>(`${this.apiUrl}/subjects/${subjectId}/notes/${noteId}`);
  }
}
