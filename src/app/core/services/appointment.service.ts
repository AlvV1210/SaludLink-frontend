import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { Appointment, AppointmentRequest } from '../models/appointment.model';
import { Doctor } from '../models/doctor.model';
import { PatientService } from './patient.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly patientService = inject(PatientService);

  private readonly appointmentApiUrl = `${API_BASE_URL}/appointments`;
  private readonly doctorApiUrl = `${API_BASE_URL}/doctors`;
  private readonly specialtyApiUrl = `${API_BASE_URL}/specialties`;

  getAppointmentsByPatient(patientId?: number): Observable<Appointment[]> {
    if (patientId) {
      return this.http.get<Appointment[]>(`${this.appointmentApiUrl}/patient/${patientId}`);
    }

    return this.patientService.getMyProfile().pipe(
      map((profile) => profile.id ?? profile.patientId),
      switchMap((id) => {
        if (!id) {
          return throwError(() => new Error('No se encontró el ID del paciente.'));
        }

        return this.http.get<Appointment[]>(`${this.appointmentApiUrl}/patient/${id}`);
      })
    );
  }

  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.appointmentApiUrl}/doctor/${doctorId}`);
  }

  createAppointment(body: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.appointmentApiUrl, body);
  }

  updateAppointment(id: number, body: AppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.appointmentApiUrl}/${id}`, body);
  }

  cancelAppointment(id: number): Observable<void> {
    return this.http.put<void>(`${this.appointmentApiUrl}/${id}/cancel`, {});
  }

  updateAppointmentStatus(id: number, status: string): Observable<void> {
    return this.http.put<void>(`${this.appointmentApiUrl}/${id}/status`, {
      status,
    });
  }

  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(this.specialtyApiUrl);
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(this.doctorApiUrl)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  getDoctorsBySpecialty(specialty: string): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(`${this.doctorApiUrl}/specialty/${encodeURIComponent(specialty)}`)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  resetDemoPatientAppointmentsCache(): void {
    localStorage.removeItem('saludlink_demo_patient_appointments');
  }

  getDemoPatientAppointments(): Observable<Appointment[]> {
    return of([]);
  }

  private normalizeDoctor(doctor: Doctor): Doctor {
    const fullName =
      doctor.name ||
      `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() ||
      `Doctor ${doctor.id}`;

    return {
      ...doctor,
      name: fullName,
    };
  }
}
