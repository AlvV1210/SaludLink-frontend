import { Component, computed, inject, OnInit, output, signal } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { PatientService } from '../../../../core/services/patient.service';
import { Appointment, AppointmentModality } from '../../../../shared/models/appointment.model';
import { PatientProfile } from '../../../../shared/models/patient.model';

const AVATAR_TONES = ['tone-a', 'tone-b'];

interface DashboardAppointment {
  id: string;
  doctor: string;
  specialty: string;
  location: string;
  dateLabel: string;
  timeLabel: string;
  initials: string;
  tone: string;
  toneClass: 'green' | 'amber';
}

@Component({
  selector: 'app-patient-dashboard-home',
  templateUrl: './patient-dashboard-home.html',
  styleUrls: ['./patient-dashboard-home.scss', '../../patient-dashboard.shared.scss'],
})
export class PatientDashboardHomeComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);

  readonly scheduleAppointment = output<void>();
  readonly openAppointments = output<void>();
  readonly openReminders = output<void>();
  readonly openMentalHealth = output<void>();
  readonly openSos = output<void>();

  protected readonly profile = signal<PatientProfile | null>(null);
  protected readonly appointments = signal<DashboardAppointment[]>([]);

  protected readonly firstName = computed(() => {
    const fromProfile = this.profile()?.firstName?.trim();
    if (fromProfile) {
      return fromProfile;
    }
    return this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente';
  });

  protected readonly todayLabel = computed(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString('es-PE', { weekday: 'long' });
    const date = now.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
    return `Hoy es ${weekday}, ${date} · Aquí tienes tu resumen de salud`;
  });

  protected readonly nextAppointmentSummary = computed(() => {
    const next = this.appointments()[0];
    if (!next) {
      return { when: '—', detail: 'Sin citas programadas' };
    }
    return {
      when: `${next.dateLabel} · ${next.timeLabel}`,
      detail: `${next.doctor} · ${next.specialty}`,
    };
  });

  protected readonly upcomingAppointments = computed(() => this.appointments().slice(0, 2));

  ngOnInit(): void {
    this.patientService.getMyProfile().subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => undefined,
    });

    this.appointmentsService.getAppointmentsByPatient().subscribe({
      next: (items) => this.appointments.set(this.mapAppointments(items)),
      error: () => this.appointments.set([]),
    });
  }

  protected remindersTodayCount(): number {
    return 0;
  }

  protected remindersTakenCount(): number {
    return 0;
  }

  protected remindersPendingCount(): number {
    return 0;
  }

  protected adherencePercent(): string {
    return '—';
  }

  protected adherenceDelta(): string {
    return '—';
  }

  private mapAppointments(items: Appointment[]): DashboardAppointment[] {
    const upcoming = items
      .map((item) => this.toDashboardAppointment(item))
      .filter((item): item is DashboardAppointment & { sortKey: number } => item !== null);

    upcoming.sort((a, b) => a.sortKey - b.sortKey);
    return upcoming.slice(0, 5).map(({ sortKey: _sortKey, ...item }) => item);
  }

  private toDashboardAppointment(
    appointment: Appointment,
  ): (DashboardAppointment & { sortKey: number }) | null {
    const rawDate = appointment.appointmentDate ?? appointment.date ?? appointment.scheduledAt;
    if (!rawDate) {
      return null;
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    if (date.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      return null;
    }

    const doctor =
      (appointment.doctorName ??
        appointment.doctorFullName ??
        [appointment.doctorFirstName, appointment.doctorLastName].filter(Boolean).join(' ')) ||
      'Médico asignado';

    const specialty = appointment.specialty ?? appointment.doctor?.specialty ?? 'Especialidad';
    const location =
      appointment.modality === 'TELEMEDICINE' || appointment.modality === AppointmentModality.TELEMEDICINE
        ? 'Consulta virtual'
        : '—';

    const initials = this.initials(doctor);
    const tone = this.avatarTone(doctor);

    return {
      id: String(appointment.id ?? `${doctor}-${rawDate}`),
      doctor,
      specialty,
      location,
      dateLabel: date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }),
      timeLabel: date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      initials,
      tone,
      toneClass: date.getDay() === 5 ? 'amber' : 'green',
      sortKey: date.getTime(),
    };
  }

  private initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  private avatarTone(key: string): string {
    let hash = 0;
    for (const char of key) {
      hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
    }
    return AVATAR_TONES[hash];
  }
}
