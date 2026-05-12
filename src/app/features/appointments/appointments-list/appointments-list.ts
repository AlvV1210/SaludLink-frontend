import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';
import {
  Appointment,
  AppointmentStatus,
} from '../../../core/models/appointment.model';
import { AppointmentService } from '../../../core/services/appointment.service';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    DatePipe,
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatChip,
    MatChipSet,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatProgressSpinner,
    MatRow,
    MatRowDef,
    MatSnackBarModule,
    MatTable,
    RouterLink,
  ],
  templateUrl: './appointments-list.html',
  styleUrl: './appointments-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsListComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpoint = inject(BreakpointObserver);

  protected readonly isHandset = toSignal(
    this.breakpoint
      .observe('(max-width: 768px)')
      .pipe(map((r: BreakpointState) => r.matches)),
    { initialValue: false },
  );

  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly cancellingId = signal<number | null>(null);
  protected readonly displayedColumns: string[] = [
    'doctorName',
    'specialty',
    'date',
    'time',
    'modality',
    'status',
    'actions',
  ];
  protected readonly AppointmentStatus = AppointmentStatus;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.appointmentService
      .getAppointmentsByPatient()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (list) => this.appointments.set(list),
        error: () => {
          this.appointments.set([]);
          this.snackBar.open('No se pudieron cargar las citas', 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }

  protected displayModality(value: string): string {
    const v = value?.toUpperCase();
    if (v === 'VIRTUAL') {
      return 'Virtual';
    }
    if (v === 'PRESENCIAL') {
      return 'Presencial';
    }
    return value ?? '—';
  }

  protected statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'Pendiente',
      [AppointmentStatus.CONFIRMED]: 'Confirmada',
      [AppointmentStatus.CANCELLED]: 'Cancelada',
      [AppointmentStatus.COMPLETED]: 'Completada',
    };
    return labels[status] ?? status;
  }

  protected statusChipClass(status: AppointmentStatus): string {
    const mapStyle: Record<AppointmentStatus, string> = {
      [AppointmentStatus.PENDING]: 'status-pending',
      [AppointmentStatus.CONFIRMED]: 'status-confirmed',
      [AppointmentStatus.CANCELLED]: 'status-cancelled',
      [AppointmentStatus.COMPLETED]: 'status-completed',
    };
    return mapStyle[status] ?? '';
  }

  protected cancel(appointment: Appointment, event: Event): void {
    event.stopPropagation();
    if (!window.confirm('¿Seguro que deseas cancelar esta cita?')) {
      return;
    }
    this.cancellingId.set(appointment.id);
    this.appointmentService
      .cancelAppointment(appointment.id)
      .pipe(finalize(() => this.cancellingId.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open('Cita cancelada', 'Cerrar', { duration: 3000 });
          this.load();
        },
        error: () => {
          this.snackBar.open('No se pudo cancelar la cita', 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }
}
