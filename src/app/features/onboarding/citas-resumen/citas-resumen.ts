import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AppointmentBookingService } from '../../../core/services/appointment-booking.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentModality } from '../../../shared/models/appointment.model';
import { Doctor } from '../../../shared/models/doctor.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c'];
const WEEKDAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

@Component({
  selector: 'app-citas-resumen',
  imports: [CommonModule, PatientDashboardShellComponent],
  templateUrl: './citas-resumen.html',
  styleUrls: ['./citas-resumen.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class CitasResumenComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly booking = inject(AppointmentBookingService);
  private readonly appointments = inject(AppointmentService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly draft = this.booking.booking;

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly dateLabel = computed(() => {
    const raw = this.draft().appointmentDate;
    if (!raw) {
      return 'N/A';
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    const weekday = WEEKDAY_NAMES[date.getDay()];
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const month = MONTH_NAMES[date.getMonth()];
    return `${capitalized} ${date.getDate()} de ${month}, ${date.getFullYear()}`;
  });

  protected readonly timeLabel = computed(() => {
    const raw = this.draft().appointmentDate;
    if (!raw) {
      return 'N/A';
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minuteText = String(minutes).padStart(2, '0');
    return `${hour12}:${minuteText} ${period} (30 min)`;
  });

  protected readonly locationLabel = computed(() => {
    if (this.draft().modality === AppointmentModality.TELEMEDICINE) {
      return 'Consulta virtual';
    }
    const doctor = this.draft().doctor;
    if (!doctor) {
      return 'N/A';
    }
    const clinic = doctor.clinicName?.trim();
    const branch = doctor.branchName?.trim() || doctor.branchAddress?.trim();
    if (clinic && branch) {
      return `${clinic} - ${branch}`;
    }
    return clinic || branch || 'N/A';
  });

  protected readonly patientLabel = computed(() => {
    const user = this.auth.getCurrentUser();
    if (!user) {
      return 'N/A';
    }
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return name ? `${name} (titular)` : 'N/A';
  });

  protected readonly modalityLabel = computed(() => {
    const modality = this.draft().modality;
    if (modality === AppointmentModality.TELEMEDICINE) {
      return 'Consulta virtual';
    }
    return 'Consulta presencial';
  });

  protected readonly feeLabel = computed(() => this.formatMoney(this.draft().doctor?.consultationFee));

  protected readonly payLabel = computed(() => {
    const fee = this.draft().doctor?.consultationFee;
    if (fee === undefined || fee === null) {
      return 'Continuar';
    }
    return `Pagar S/${fee}`;
  });

  ngOnInit(): void {
    const draft = this.draft();
    if (!draft.doctor || !draft.appointmentDate) {
      void this.router.navigate(['/paciente/citas/buscar-especialista']);
    }
  }

  protected doctorName(doctor: Doctor): string {
    return (
      doctor.name?.trim() ||
      `Dr. ${doctor.firstName} ${doctor.lastName}`.trim() ||
      'Medico'
    );
  }

  protected doctorSubtitle(doctor: Doctor): string {
    const specialty = doctor.specialty?.trim() || 'N/A';
    const license = doctor.licenseNumber?.trim();
    if (license) {
      return `${specialty} - Colegiatura ${license}`;
    }
    return specialty;
  }

  protected doctorInitials(doctor: Doctor): string {
    const first = doctor.firstName?.charAt(0) ?? '';
    const last = doctor.lastName?.charAt(0) ?? '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || 'DR';
  }

  protected avatarTone(doctor: Doctor): string {
    return AVATAR_TONES[doctor.id % AVATAR_TONES.length];
  }

  protected pay(): void {
    const draft = this.draft();
    if (!draft.doctor) {
      void this.router.navigate(['/paciente/citas/buscar-especialista']);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.appointments
      .createAppointment({
        doctorId: draft.doctor.id,
        appointmentDate: draft.appointmentDate,
        modality: draft.modality,
        notes: draft.notes,
      })
      .subscribe({
        next: (created) => {
          this.loading.set(false);
          this.booking.setAppointmentId(created.id);
          void this.router.navigate(['/paciente/citas/pago']);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo crear la cita.'));
        },
      });
  }

  protected back(): void {
    void this.router.navigate(['/paciente/citas/seleccionar-fecha-hora']);
  }

  protected goDashboard(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected goCitas(): void {
    void this.router.navigate(['/paciente/citas']);
  }

  protected goRecordatorios(): void {
    void this.router.navigate(['/paciente/recordatorios']);
  }

  protected goHistorial(): void {
    void this.router.navigate(['/paciente/historial']);
  }

  protected goMental(): void {
    void this.router.navigate(['/paciente/salud-mental']);
  }

  protected goPlanes(): void {
    void this.router.navigate(['/paciente/planes']);
  }

  protected goPerfil(): void {
    void this.router.navigate(['/paciente/dashboard/salud']);
  }

  protected goConfig(): void {
    void this.router.navigate(['/contact']);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }

  private formatMoney(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return `S/ ${value.toFixed(2)}`;
  }
}
