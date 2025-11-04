import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseResponseDto } from '../models/base-response.dto';
import { ClassResponseDto } from '../models/class-response.dto';
import { SubjectResponseDto } from '../models/subject-response.dto';
import { AddSubjectDto } from '../models/add-subject.dto';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getClass(): Observable<BaseResponseDto<ClassResponseDto[]>> {
    return this.http.get<BaseResponseDto<ClassResponseDto[]>>(`${this.apiUrl}/subjects/classes`);
  }

  getSubjects(): Observable<BaseResponseDto<SubjectResponseDto[]>> {
    return this.http.get<BaseResponseDto<SubjectResponseDto[]>>(`${this.apiUrl}/subjects`);
  }

  addSubject(data: AddSubjectDto): Observable<BaseResponseDto<null>> {
    return this.http.post<BaseResponseDto<null>>(`${this.apiUrl}/subjects`, data);
  }

  getSubjectById(id: number): Observable<BaseResponseDto<SubjectResponseDto>>{
    return this.http.get<BaseResponseDto<SubjectResponseDto>>(`${this.apiUrl}/subjects/${id}`);
  }
}
