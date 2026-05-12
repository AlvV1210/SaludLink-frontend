import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { AUTH_TOKEN_KEY } from '../constants/storage-keys';
import {
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
  Doctor,
} from '../models/appointment.model';

const APPOINTMENTS_BASE_URL = 'http://localhost:8080/api/appointments';
const SPECIALTIES_BASE_URL = 'http://localhost:8080/api/specialties';
const DOCTORS_BASE_URL = 'http://localhost:8080/api/doctors';

const FALLBACK_SPECIALTIES: string[] = [
  'Medicina General',
  'Cardiología',
  'Dermatología',
  'Pediatría',
  'Ginecología',
  'Traumatología',
];

const FALLBACK_DOCTORS: Doctor[] = [
  { id: 1, name: 'Dra. Ana López', specialty: 'Cardiología' },
  { id: 2, name: 'Dr. Carlos Ruiz', specialty: 'Cardiología' },
  { id: 3, name: 'Dr. Martín Soto', specialty: 'Medicina General' },
  { id: 4, name: 'Dra. Laura Fernández', specialty: 'Medicina General' },
  { id: 5, name: 'Dra. Inés Pardo', specialty: 'Dermatología' },
  { id: 6, name: 'Dr. Hugo Mena', specialty: 'Dermatología' },
  { id: 7, name: 'Dra. Mónica Díaz', specialty: 'Pediatría' },
  { id: 8, name: 'Dr. Pablo Rivas', specialty: 'Pediatría' },
  { id: 9, name: 'Dra. Silvia Mora', specialty: 'Ginecología' },
  { id: 10, name: 'Dr. Andrés Cuevas', specialty: 'Traumatología' },
];

function isDemoSession(): boolean {
  return (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(AUTH_TOKEN_KEY) === 'demo-local-token'
  );
}

function demoAppointments(): Appointment[] {
  const d1 = new Date();
  d1.setDate(d1.getDate() + 1);
  d1.setHours(10, 30, 0, 0);
  const d2 = new Date();
  d2.setDate(d2.getDate() + 3);
  d2.setHours(15, 0, 0, 0);
  const d3 = new Date();
  d3.setDate(d3.getDate() + 5);
  d3.setHours(9, 0, 0, 0);
  return [
    {
      id: 101,
      doctorName: 'Dra. Ana López',
      specialty: 'Cardiología',
      appointmentDate: d1.toISOString(),
      modality: 'PRESENCIAL',
      status: AppointmentStatus.PENDING,
    },
    {
      id: 102,
      doctorName: 'Dr. Martín Soto',
      specialty: 'Medicina General',
      appointmentDate: d2.toISOString(),
      modality: 'VIRTUAL',
      status: AppointmentStatus.CONFIRMED,
    },
    {
      id: 103,
      doctorName: 'Dra. Inés Pardo',
      specialty: 'Dermatología',
      appointmentDate: d3.toISOString(),
      modality: 'PRESENCIAL',
      status: AppointmentStatus.COMPLETED,
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  /** Citas simuladas en modo demo (persisten en memoria hasta cerrar sesión). */
  private demoPatientAppointments: Appointment[] | null = null;

  /** Llamar al iniciar sesión demo o al cerrar sesión para no mezclar datos. */
  resetDemoPatientAppointmentsCache(): void {
    this.demoPatientAppointments = null;
  }

  private getDemoPatientList(): Appointment[] {
    if (!this.demoPatientAppointments) {
      this.demoPatientAppointments = demoAppointments();
    }
    return this.demoPatientAppointments;
  }

  getAppointmentsByPatient(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(APPOINTMENTS_BASE_URL).pipe(
      catchError(() =>
        isDemoSession()
          ? of(this.getDemoPatientList().map((a) => ({ ...a })))
          : throwError(() => new Error('appointments_failed')),
      ),
    );
  }

  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(SPECIALTIES_BASE_URL).pipe(
      catchError(() => of([...FALLBACK_SPECIALTIES])),
    );
  }

  getDoctorsBySpecialty(specialty: string): Observable<Doctor[]> {
    if (!specialty) {
      return of([]);
    }
    return this.http
      .get<Doctor[]>(`${DOCTORS_BASE_URL}`, { params: { specialty } })
      .pipe(
        map((list) =>
          list.filter(
            (d) => d.specialty.toLowerCase() === specialty.toLowerCase(),
          ),
        ),
        catchError(
          () =>
            of(
              FALLBACK_DOCTORS.filter(
                (d) => d.specialty.toLowerCase() === specialty.toLowerCase(),
              ),
            ),
        ),
      );
  }

  createAppointment(body: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(APPOINTMENTS_BASE_URL, body).pipe(
      catchError(() => {
        if (isDemoSession()) {
          const doctor = FALLBACK_DOCTORS.find((d) => d.id === body.doctorId);
          const created: Appointment = {
            id: Date.now(),
            doctorName: doctor?.name ?? 'Médico',
            specialty: doctor?.specialty ?? '',
            appointmentDate: body.appointmentDate,
            modality: body.modality,
            status: AppointmentStatus.CONFIRMED,
            notes: body.notes,
          };
          this.getDemoPatientList().push(created);
          return of({ ...created });
        }
        return throwError(() => new Error('create_failed'));
      }),
    );
  }

  cancelAppointment(id: number): Observable<Appointment> {
    return this.http
      .patch<Appointment>(`${APPOINTMENTS_BASE_URL}/${id}/cancel`, {})
      .pipe(
        catchError(() => {
          if (isDemoSession()) {
            const list = this.getDemoPatientList();
            const ix = list.findIndex((a) => a.id === id);
            if (ix < 0) {
              return throwError(() => new Error('not_found'));
            }
            list[ix] = { ...list[ix], status: AppointmentStatus.CANCELLED };
            return of({ ...list[ix] });
          }
          return throwError(() => new Error('cancel_failed'));
        }),
      );
  }
}
