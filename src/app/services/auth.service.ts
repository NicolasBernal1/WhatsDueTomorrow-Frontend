import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { BaseResponseDto } from '../models/base-response.dto';
import { LoginDto } from '../models/login.dto';
import { CreateUserDto } from '../models/create-user.dto';
import { UserDto } from '../models/user.dto';
import { LoggedInDto } from '../models/logged-in.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(credentials: LoginDto): Observable<BaseResponseDto<LoggedInDto>> {
    return this.http.post<BaseResponseDto<LoggedInDto>>(`${this.apiUrl}/auth/login`, credentials)
    .pipe(tap(response => {
      if(response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
    }))
  }

  register(data: CreateUserDto): Observable<BaseResponseDto<UserDto>> {
    return this.http.post<BaseResponseDto<UserDto>>(`${this.apiUrl}/auth/register`, data);
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

  deleteAccount(): Observable<BaseResponseDto<null>>{
    return this.http.delete<BaseResponseDto<null>>(`${this.apiUrl}/users/profile`);
  }
}
