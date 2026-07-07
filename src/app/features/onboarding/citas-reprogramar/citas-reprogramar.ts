import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { Appointment } from '../../../shared/models/appointment.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

interface CalendarCell {
  date: Date;
  day: number;
  inCurrentMonth: boolean;
  isPast: boolean;
  isSelected: boolean;
}

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
  selector: 'app-citas-reprogramar',
  imports: [CommonModule, PatientDashboardShellComponent],
  templateUrl: './citas-reprogramar.html',
  styleUrls: ['./citas-reprogramar.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class CitasReprogramarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly appointments = inject(AppointmentService);
  protected readonly shellNav = inject(PatientShellNav);

  protected readonly weekdayHeaders = WEEKDAY_HEADERS;
  protected readonly timeSlots = TIME_SLOTS;

  protected readonly list = signal<Appointment[]>([]);
  protected readonly selectedAppointment = signal<Appointment | null>(null);
  protected readonly viewDate = signal(this.startOfMonth(new Date()));
  protected readonly selectedDate = signal<Date | null>(null);
  protected readonly selectedTime = signal('');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

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
    return `Horarios ${WEEKDAY_NAMES[selected.getDay()]} ${selected.getDate()}`;
  });

  protected readonly confirmLabel = computed(() => {
    const date = this.selectedDate();
    const time = this.selectedTime();
    if (!date || !time) {
      return 'Confirmar reprogramacion';
    }
    const month = MONTH_SHORT[date.getMonth()];
    return `Confirmar ${date.getDate()} ${month} - ${time}`;
  });

  protected readonly canConfirm = computed(
    () => !!this.selectedAppointment() && !!this.selectedDate() && !!this.selectedTime(),
  );

  protected readonly currentBanner = computed(() => {
    const appt = this.selectedAppointment();
    if (!appt) {
      return null;
    }
    const doctor =
      appt.doctorName ??
      appt.doctorFullName ??
      [appt.doctorFirstName, appt.doctorLastName].filter(Boolean).join(' ') ??
      'Medico';
    const date = appt.appointmentDate ?? appt.date ?? appt.scheduledAt ?? '—';
    return {
      doctor,
      specialty: appt.specialty ?? 'Consulta medica',
      date,
      modality: String(appt.modality).toUpperCase().includes('TELE') ? 'Virtual' : 'Presencial',
    };
  });

  ngOnInit(): void {
    const presetId = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    this.appointments.getAppointmentsByPatient().subscribe({
      next: (items) => {
        const active = items.filter((item) => {
          const status = String(item.status).toUpperCase();
          return status !== 'CANCELLED' && status !== 'COMPLETED';
        });
        this.list.set(active);
        const match =
          (presetId ? active.find((item) => item.id === presetId) : null) ??
          active[0] ??
          null;
        this.selectedAppointment.set(match);
      },
      error: (error) =>
        this.errorMessage.set(apiErrorMessage(error, 'No se pudieron cargar las citas.')),
    });

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

  protected selectAppointment(id: number): void {
    const match = this.list().find((item) => item.id === id) ?? null;
    this.selectedAppointment.set(match);
    this.selectedTime.set('');
  }

  protected reschedule(): void {
    const appt = this.selectedAppointment();
    const date = this.selectedDate();
    const time = this.selectedTime();
    if (!appt || !date || !time) {
      return;
    }

    const isoDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    const appointmentDate = `${isoDate}T${time}:00`;

    this.loading.set(true);
    this.appointments.rescheduleAppointment(appt.id, { appointmentDate }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/paciente/citas/confirmada']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo reprogramar la cita.'));
      },
    });
  }

  protected back(): void {
    void this.router.navigate(['/paciente/citas']);
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
