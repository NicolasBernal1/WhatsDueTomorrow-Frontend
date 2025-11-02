import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { BaseResponseDto } from '../models/base-response.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string, password: string }): Observable<BaseResponseDto<{ access_token: string }>> { //En angular tambien deberia usar dtos?
    return this.http.post<BaseResponseDto<{ access_token: string }>>(`${this.apiUrl}/auth/login`, credentials)
    .pipe(tap(response => {
      if(response.data?.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }
    }))
  }

  register(data: { name: string, email: string, password: string }): Observable<BaseResponseDto<null>> {
    return this.http.post<BaseResponseDto<null>>(`${this.apiUrl}/auth/register`, data);
  }

  logout():void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
