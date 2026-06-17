import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import {
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
} from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AdminAppointmentService {
  private readonly http = inject(HttpClient);
  private readonly adminAppointmentsApiUrl = `${API_BASE_URL}/admin/appointments`;
  private readonly appointmentsApiUrl = `${API_BASE_URL}/appointments`;

  listMyClinicAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.adminAppointmentsApiUrl);
  }

  updateAppointment(id: number, body: AppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.appointmentsApiUrl}/${id}`, body);
  }

  confirmAppointment(id: number): Observable<void> {
    return this.http.put<void>(`${this.appointmentsApiUrl}/${id}/status`, {
      status: AppointmentStatus.CONFIRMED,
    });
  }

  cancelAppointment(id: number): Observable<void> {
    return this.http.put<void>(`${this.appointmentsApiUrl}/${id}/cancel`, {});
  }
}
