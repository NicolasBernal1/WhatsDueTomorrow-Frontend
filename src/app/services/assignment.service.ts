import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { BaseResponseDto } from '../models/base-response.dto';
import { AssignmentResponseDto } from '../models/assignment-response.dto';
import { AddAssignmentDto } from '../models/add-assignment.dto';
import { AssignmentResponseCompDto } from '../models/assignment-response-comp.dto';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAssignmentsBySubject(id: number): Observable<BaseResponseDto<AssignmentResponseDto[]>> {
    return this.http.get<BaseResponseDto<AssignmentResponseDto[]>>(`${this.apiUrl}/assignments/subject/${id}`);
  }

  addAssignment(data: AddAssignmentDto, subjectId: number): Observable<BaseResponseDto<null>>{
    return this.http.post<BaseResponseDto<null>>(`${this.apiUrl}/assignments/subject/${subjectId}`, data);
  }

  getAllAssignments(): Observable<BaseResponseDto<AssignmentResponseCompDto[]>> {
    return this.http.get<BaseResponseDto<AssignmentResponseCompDto[]>>(`${this.apiUrl}/assignments`);
  }
}
