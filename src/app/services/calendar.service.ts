import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseResponseDto } from '../models/base-response.dto';
import { CalendarSubscriptionDto } from '../models/calendar-subscription.dto';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  constructor(private http: HttpClient) {}

  createSubscription(): Observable<BaseResponseDto<CalendarSubscriptionDto>> {
    return this.http.post<BaseResponseDto<CalendarSubscriptionDto>>(`${environment.apiUrl}/calendar/subscription`, {});
  }

  download(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/calendar/download`, { responseType: 'blob' });
  }
}
