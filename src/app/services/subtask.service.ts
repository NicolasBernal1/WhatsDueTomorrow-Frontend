import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseResponseDto } from '../models/base-response.dto';
import { SubtaskListResponse } from '../models/subtask.model';

@Injectable({ providedIn: 'root' })
export class SubtaskService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(assignmentId: number): Observable<BaseResponseDto<SubtaskListResponse>> {
    return this.http.get<BaseResponseDto<SubtaskListResponse>>(`${this.apiUrl}/assignments/${assignmentId}/subtasks`);
  }

  create(assignmentId: number, title: string): Observable<BaseResponseDto<SubtaskListResponse>> {
    return this.http.post<BaseResponseDto<SubtaskListResponse>>(`${this.apiUrl}/assignments/${assignmentId}/subtasks`, { title });
  }

  update(assignmentId: number, subtaskId: number, data: { title?: string; completed?: boolean }): Observable<BaseResponseDto<SubtaskListResponse>> {
    return this.http.patch<BaseResponseDto<SubtaskListResponse>>(`${this.apiUrl}/assignments/${assignmentId}/subtasks/${subtaskId}`, data);
  }

  remove(assignmentId: number, subtaskId: number): Observable<BaseResponseDto<SubtaskListResponse>> {
    return this.http.delete<BaseResponseDto<SubtaskListResponse>>(`${this.apiUrl}/assignments/${assignmentId}/subtasks/${subtaskId}`);
  }

  reorder(assignmentId: number, orderedIds: number[]): Observable<BaseResponseDto<SubtaskListResponse>> {
    return this.http.patch<BaseResponseDto<SubtaskListResponse>>(`${this.apiUrl}/assignments/${assignmentId}/subtasks/order`, { orderedIds });
  }
}
