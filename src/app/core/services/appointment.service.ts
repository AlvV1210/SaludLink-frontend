import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Appointment,
  AppointmentRequest,
  RescheduleAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from '../../shared/models/appointment.model';
import { Doctor } from '../../shared/models/doctor.model';
import { PatientService } from './patient.service';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly patientService = inject(PatientService);
  private readonly base = `${environment.apiUrl}/appointments`;
  private readonly doctorsBase = `${environment.apiUrl}/doctors`;
  private readonly specialtiesBase = `${environment.apiUrl}/specialties`;

  getAppointmentsByPatient(patientId?: number): Observable<Appointment[]> {
    if (patientId) {
      return this.http.get<Appointment[]>(`${this.base}/patient/${patientId}`);
    }
    return this.patientService.getMyProfile().pipe(
      map((profile) => profile.id ?? profile.patientId),
      switchMap((id) => {
        if (!id) {
          return throwError(() => new Error('No se encontró el ID del paciente.'));
        }
        return this.http.get<Appointment[]>(`${this.base}/patient/${id}`);
      }),
    );
  }

  getAppointmentHistory(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/patient/${patientId}/history`);
  }

  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.base}/doctor/${doctorId}`);
  }

  createAppointment(body: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, body);
  }

  cancelAppointment(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/cancel`, {});
  }

  rescheduleAppointment(id: number, body: RescheduleAppointmentRequest): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/${id}/reschedule`, body);
  }

  updateAppointmentStatus(id: number, body: UpdateAppointmentStatusRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.base}/${id}/status`, body);
  }

  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(this.specialtiesBase);
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(this.doctorsBase)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  getDoctorsBySpecialty(specialty: string): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(`${this.doctorsBase}/specialty/${encodeURIComponent(specialty)}`)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  resetDemoPatientAppointmentsCache(): void {
    localStorage.removeItem('saludlink_demo_patient_appointments');
  }

  private normalizeDoctor(doctor: Doctor): Doctor {
    const fullName =
      doctor.name ||
      `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() ||
      `Doctor ${doctor.id}`;
    return { ...doctor, name: fullName };
  }
}
