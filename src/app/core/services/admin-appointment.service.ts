import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Appointment,
  AppointmentRequest,
  RescheduleAppointmentRequest,
} from '../../shared/models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AdminAppointmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/appointments`;

  listByDoctor(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/doctor/${doctorId}`);
  }

  cancel(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/cancel`, {});
  }

  reschedule(id: number, body: RescheduleAppointmentRequest): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/reschedule`, body);
  }

  create(body: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, body);
  }
}
