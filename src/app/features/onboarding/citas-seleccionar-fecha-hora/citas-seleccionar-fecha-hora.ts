import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AppointmentBookingService } from '../../../core/services/appointment-booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentModality } from '../../../shared/models/appointment.model';
import { Doctor } from '../../../shared/models/doctor.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

interface CalendarCell {
  date: Date;
  day: number;
  inCurrentMonth: boolean;
  isPast: boolean;
  isSelected: boolean;
}

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c'];
const WEEKDAY_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '15:00', '16:00', '17:00', '18:00'];

@Component({
  selector: 'app-citas-seleccionar-fecha-hora',
  imports: [CommonModule, PatientDashboardShellComponent],
  templateUrl: './citas-seleccionar-fecha-hora.html',
  styleUrls: ['./citas-seleccionar-fecha-hora.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class CitasSeleccionarFechaHoraComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly booking = inject(AppointmentBookingService);

  protected readonly weekdayHeaders = WEEKDAY_HEADERS;
  protected readonly timeSlots = TIME_SLOTS;

  protected readonly doctor = computed(() => this.booking.booking().doctor);
  protected readonly viewDate = signal(this.startOfMonth(new Date()));
  protected readonly selectedDate = signal<Date | null>(null);
  protected readonly selectedTime = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly monthLabel = computed(() => {
    const view = this.viewDate();
    return `${MONTH_NAMES[view.getMonth()]} ${view.getFullYear()}`;
  });

  protected readonly calendarCells = computed(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
    const selected = this.selectedDate();
    const today = this.stripTime(new Date());

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);

    const cells: CalendarCell[] = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const stripped = this.stripTime(date);
      cells.push({
        date: stripped,
        day: stripped.getDate(),
        inCurrentMonth: stripped.getMonth() === month,
        isPast: stripped.getTime() < today.getTime(),
        isSelected: selected ? this.sameDay(stripped, selected) : false,
      });
    }

    return cells.slice(0, 35);
  });

  protected readonly slotsHeading = computed(() => {
    const selected = this.selectedDate();
    if (!selected) {
      return 'Horarios disponibles';
    }
    const weekday = WEEKDAY_NAMES[selected.getDay()];
    return `Horarios ${weekday} ${selected.getDate()}`;
  });

  protected readonly confirmLabel = computed(() => {
    const date = this.selectedDate();
    const time = this.selectedTime();
    if (!date || !time) {
      return 'Confirmar';
    }
    const month = MONTH_SHORT[date.getMonth()];
    const day = date.getDate();
    return `Confirmar ${day} ${month} - ${this.formatSlotLabel(time)}`;
  });

  protected readonly canConfirm = computed(() => !!this.selectedDate() && !!this.selectedTime());

  ngOnInit(): void {
    if (!this.doctor()) {
      void this.router.navigate(['/paciente/citas/buscar-especialista']);
      return;
    }

    const today = this.stripTime(new Date());
    this.viewDate.set(this.startOfMonth(today));
    this.selectedDate.set(today);
  }

  protected prevMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  protected selectDate(cell: CalendarCell): void {
    if (cell.isPast || !cell.inCurrentMonth) {
      return;
    }
    this.selectedDate.set(cell.date);
    this.selectedTime.set('');
  }

  protected selectTimeSlot(time: string): void {
    if (!this.selectedDate()) {
      return;
    }
    this.selectedTime.set(time);
  }

  protected formatSlotLabel(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours, 10)}:${minutes}`;
  }

  protected doctorName(doctor: Doctor): string {
    return (
      doctor.name?.trim() ||
      `Dr. ${doctor.firstName} ${doctor.lastName}`.trim() ||
      'Medico'
    );
  }

  protected doctorLocation(doctor: Doctor): string {
    return doctor.clinicName || doctor.branchName || doctor.branchAddress || 'N/A';
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

  protected formatFee(doctor: Doctor): string {
    if (doctor.consultationFee === undefined || doctor.consultationFee === null) {
      return 'N/A';
    }
    return `S/${doctor.consultationFee}`;
  }

  protected confirm(): void {
    const date = this.selectedDate();
    const time = this.selectedTime();
    if (!date || !time) {
      return;
    }

    const isoDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    const appointmentDate = `${isoDate}T${time}:00`;
    this.booking.setSlot(appointmentDate, AppointmentModality.TELEMEDICINE);
    void this.router.navigate(['/paciente/citas/resumen']);
  }

  protected back(): void {
    void this.router.navigate(['/paciente/citas/buscar-especialista']);
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

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
