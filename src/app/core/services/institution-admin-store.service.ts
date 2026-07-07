import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { Observable } from 'rxjs';

import { AdminAppointmentService } from './admin-appointment.service';
import { AdminDoctorService } from './admin-doctor.service';
import { InstitutionService } from './institution.service';
import { Appointment } from '../../shared/models/appointment.model';
import { Doctor } from '../../shared/models/doctor.model';
import {
  InstitutionDashboardResponse,
  InstitutionResponse,
} from '../../shared/models/institution.model';

export interface InstitutionPatientSummary {
  key: string;
  name: string;
  appointmentCount: number;
  doctorName: string;
  statusLabel: 'Activa' | 'Atención';
  lowAdherence: boolean;
  firstAppointmentAt: number | null;
}

@Injectable({ providedIn: 'root' })
export class InstitutionAdminStoreService {
  private readonly institutionService = inject(InstitutionService);
  private readonly adminDoctorService = inject(AdminDoctorService);
  private readonly adminAppointmentService = inject(AdminAppointmentService);

  readonly loading = signal(false);
  readonly profile = signal<InstitutionResponse | null>(null);
  readonly dashboard = signal<InstitutionDashboardResponse | null>(null);
  readonly doctors = signal<Doctor[]>([]);
  readonly appointments = signal<Appointment[]>([]);
  readonly notice = signal('');

  readonly activeDoctors = computed(
    () => this.doctors().filter((doctor) => doctor.verified).length,
  );
  readonly pendingDoctors = computed(
    () => this.doctors().filter((doctor) => !doctor.verified).length,
  );
  readonly inactiveDoctors = computed(() => 0);

  readonly uniquePatients = computed(() => this.buildPatientSummaries());

  refreshCore(): void {
    this.loading.set(true);
    forkJoin({
      profile: this.institutionService.getProfile(),
      dashboard: this.institutionService.getDashboard(),
      doctors: this.adminDoctorService.listMyDoctors(),
    })
      .pipe(
        switchMap(({ profile, dashboard, doctors }) => {
          this.profile.set(profile);
          this.dashboard.set(dashboard);
          this.doctors.set(doctors);
          return this.loadAppointmentsForDoctors(doctors);
        }),
      )
      .subscribe({
        next: (appointments) => {
          this.loading.set(false);
          this.appointments.set(appointments);
        },
        error: () => this.loading.set(false),
      });
  }

  refreshAfterAffiliationChange(linkedDoctor?: Doctor): Observable<void> {
    if (linkedDoctor) {
      this.upsertDoctor(linkedDoctor);
    }
    this.loading.set(true);
    return forkJoin({
      dashboard: this.institutionService.getDashboard(),
      doctors: this.adminDoctorService.listMyDoctors(),
    }).pipe(
      switchMap(({ dashboard, doctors }) => {
        this.dashboard.set(dashboard);
        this.doctors.set(doctors);
        return this.loadAppointmentsForDoctors(doctors);
      }),
      tap((appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      }),
      map(() => undefined),
      catchError(() => {
        this.loading.set(false);
        return of(undefined);
      }),
    );
  }

  refreshDoctors(): void {
    this.adminDoctorService.listMyDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.loadAppointmentsForDoctors(doctors).subscribe({
          next: (appointments) => this.appointments.set(appointments),
        });
      },
    });
  }

  upsertDoctor(doctor: Doctor): void {
    this.doctors.update((current) => {
      const index = current.findIndex((item) => item.id === doctor.id);
      if (index === -1) {
        return [...current, doctor];
      }
      return current.map((item) => (item.id === doctor.id ? { ...item, ...doctor } : item));
    });
  }

  setNotice(message: string): void {
    this.notice.set(message);
  }

  clearNotice(): void {
    this.notice.set('');
  }

  getDoctorById(id: number): Doctor | undefined {
    return this.doctors().find((doctor) => doctor.id === id);
  }

  appointmentsForMonth(year: number, month: number): Map<number, Appointment[]> {
    const map = new Map<number, Appointment[]>();
    for (const appointment of this.appointments()) {
      const raw = appointment.appointmentDate ?? appointment.date ?? '';
      if (!raw) {
        continue;
      }
      const date = new Date(raw);
      if (date.getFullYear() !== year || date.getMonth() !== month) {
        continue;
      }
      const day = date.getDate();
      const bucket = map.get(day) ?? [];
      bucket.push(appointment);
      map.set(day, bucket);
    }
    return map;
  }

  private loadAppointmentsForDoctors(doctors: Doctor[]): Observable<Appointment[]> {
    if (!doctors.length) {
      return of([]);
    }
    return forkJoin(
      doctors.map((doctor) =>
        this.adminAppointmentService.listByDoctor(doctor.id).pipe(catchError(() => of([] as Appointment[]))),
      ),
    ).pipe(map((lists) => lists.flat()));
  }

  private buildPatientSummaries(): InstitutionPatientSummary[] {
    const byPatient = new Map<
      string,
      {
        key: string;
        name: string;
        appointmentCount: number;
        doctorName: string;
        hasNoShow: boolean;
        firstAppointmentAt: number | null;
        lastAppointmentAt: number | null;
      }
    >();

    for (const appointment of this.appointments()) {
      const name = appointment.patientName?.trim() || 'Paciente';
      const key = `${appointment.patientId ?? name}`;
      const doctorName =
        (appointment.doctorName ??
          appointment.doctorFullName ??
          [appointment.doctorFirstName, appointment.doctorLastName].filter(Boolean).join(' ')) ||
        'Sin médico';
      const time = this.appointmentTimestamp(appointment);

      const existing = byPatient.get(key);
      if (existing) {
        existing.appointmentCount += 1;
        if (appointment.status === 'NO_SHOW') {
          existing.hasNoShow = true;
        }
        if (time !== null) {
          if (existing.firstAppointmentAt === null || time < existing.firstAppointmentAt) {
            existing.firstAppointmentAt = time;
          }
          if (existing.lastAppointmentAt === null || time > existing.lastAppointmentAt) {
            existing.lastAppointmentAt = time;
            existing.doctorName = doctorName;
          }
        }
        continue;
      }

      byPatient.set(key, {
        key,
        name,
        appointmentCount: 1,
        doctorName,
        hasNoShow: appointment.status === 'NO_SHOW',
        firstAppointmentAt: time,
        lastAppointmentAt: time,
      });
    }

    return [...byPatient.values()].map((patient) => ({
      key: patient.key,
      name: patient.name,
      appointmentCount: patient.appointmentCount,
      doctorName: patient.doctorName,
      statusLabel: patient.hasNoShow ? 'Atención' : 'Activa',
      lowAdherence: patient.hasNoShow,
      firstAppointmentAt: patient.firstAppointmentAt,
    }));
  }

  private appointmentTimestamp(appointment: Appointment): number | null {
    const raw = appointment.appointmentDate ?? appointment.date ?? appointment.scheduledAt;
    if (!raw) {
      return null;
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
}
