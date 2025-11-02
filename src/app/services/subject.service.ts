import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseResponseDto } from '../models/base-response.dto';
import { ClassResponseDto } from '../models/class-response.dto';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getClass(): Observable<BaseResponseDto<ClassResponseDto[]>>{
    return this.http.get<BaseResponseDto<ClassResponseDto[]>>(`${this.apiUrl}/subjects/classes`);
  }
}
