import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseResponseDto } from '../models/base-response.dto';
import { AddClassDto } from '../models/add-class.dto';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  addClass(data: AddClassDto): Observable<BaseResponseDto<null>> {
    return this.http.post<BaseResponseDto<null>>(`${this.apiUrl}/subjects/classes`, data);
  }
}
