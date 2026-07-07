import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AppointmentBookingService } from '../../../core/services/appointment-booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AppointmentModality } from '../../../shared/models/appointment.model';
import { Doctor } from '../../../shared/models/doctor.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

@Component({
  selector: 'app-citas-confirmada',
  imports: [CommonModule, PatientDashboardShellComponent],
  templateUrl: './citas-confirmada.html',
  styleUrls: ['./citas-confirmada.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class CitasConfirmadaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly booking = inject(AppointmentBookingService);
  private readonly payments = inject(PaymentService);

  protected readonly draft = this.booking.booking;
  protected readonly receiptNumber = signal('');
  protected readonly loadingPayment = signal(false);
  protected readonly paymentError = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly emailHint = computed(() => {
    const email = this.auth.getCurrentUser()?.email?.trim();
    return email
      ? `Te enviamos los detalles a ${email}`
      : 'Te enviamos los detalles a tu correo';
  });

  protected readonly appointmentShortLabel = computed(() => {
    const raw = this.draft().appointmentDate;
    if (!raw) {
      return 'N/A';
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    const weekday = WEEKDAY_SHORT[date.getDay()];
    const month = MONTH_SHORT[date.getMonth()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minuteText = String(minutes).padStart(2, '0');
    return `${weekday} ${date.getDate()} ${month} - ${hour12}:${minuteText} ${period}`;
  });

  protected readonly doctorLine = computed(() => {
    const doctor = this.draft().doctor;
    if (!doctor) {
      return 'N/A';
    }
    return `${this.doctorName(doctor)} - ${doctor.specialty || 'N/A'}`;
  });

  protected readonly locationLine = computed(() => {
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

  protected readonly paymentRefLabel = computed(() => {
    const receipt = this.receiptNumber().trim();
    return receipt ? `#${receipt}` : 'N/A';
  });

  ngOnInit(): void {
    const appointmentId = this.draft().appointmentId;
    if (!appointmentId) {
      void this.router.navigate(['/paciente/citas']);
      return;
    }

    this.loadingPayment.set(true);
    this.payments.getByAppointment(appointmentId).subscribe({
      next: (payment) => {
        this.loadingPayment.set(false);
        this.receiptNumber.set(payment.receiptNumber || '');
      },
      error: (error) => {
        this.loadingPayment.set(false);
        this.paymentError.set(apiErrorMessage(error, 'No se pudo cargar el comprobante.'));
      },
    });
  }

  protected doctorName(doctor: Doctor): string {
    return (
      doctor.name?.trim() ||
      `Dr. ${doctor.firstName} ${doctor.lastName}`.trim() ||
      'Medico'
    );
  }

  protected addToCalendar(): void {
    const raw = this.draft().appointmentDate;
    if (!raw) {
      return;
    }
    const start = new Date(raw);
    if (Number.isNaN(start.getTime())) {
      return;
    }
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const doctor = this.draft().doctor;
    const summary = doctor ? `Cita medica - ${this.doctorName(doctor)}` : 'Cita medica SaludLink';
    const location = this.locationLine();
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SaludLink//Citas//ES',
      'BEGIN:VEVENT',
      `UID:saludlink-${this.draft().appointmentId ?? Date.now()}@saludlink.local`,
      `DTSTAMP:${this.formatIcsDate(new Date())}`,
      `DTSTART:${this.formatIcsDate(start)}`,
      `DTEND:${this.formatIcsDate(end)}`,
      `SUMMARY:${this.escapeIcs(summary)}`,
      `LOCATION:${this.escapeIcs(location)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cita-saludlink.ics';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  protected downloadReceipt(): void {
    const receipt = this.receiptNumber().trim();
    if (!receipt) {
      return;
    }
    const lines = [
      'Comprobante de pago - SaludLink',
      `Numero: ${receipt}`,
      `Cita: ${this.appointmentShortLabel()}`,
      `Medico: ${this.doctorLine()}`,
      `Lugar: ${this.locationLine()}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `comprobante-${receipt}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  protected viewAppointments(): void {
    this.booking.reset();
    void this.router.navigate(['/paciente/citas']);
  }

  protected goDashboard(): void {
    this.booking.reset();
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected goCitasNav(): void {
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

  private formatIcsDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
      `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
    );
  }

  private escapeIcs(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  }
}
