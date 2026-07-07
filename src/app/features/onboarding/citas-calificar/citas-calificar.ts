import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-citas-calificar',
  imports: [CommonModule, FormsModule, PatientDashboardShellComponent],
  templateUrl: './citas-calificar.html',
  styleUrl: './citas-calificar.scss',
})
export class CitasCalificarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly appointments = inject(AppointmentService);
  private readonly reviews = inject(ReviewService);

  protected readonly completed = signal<Appointment[]>([]);
  protected readonly appointmentId = signal<number | null>(null);
  protected readonly rating = signal(5);
  protected readonly comment = signal('');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly selectedAppointment = computed(() => {
    const id = this.appointmentId();
    return this.completed().find((item) => item.id === id) ?? null;
  });

  protected readonly doctorLabel = computed(() => {
    const item = this.selectedAppointment();
    if (!item) {
      return 'Medico';
    }
    return (
      item.doctorName ??
      item.doctorFullName ??
      [item.doctorFirstName, item.doctorLastName].filter(Boolean).join(' ') ??
      'Medico'
    );
  });

  ngOnInit(): void {
    const preset = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    this.appointments.getAppointmentsByPatient().subscribe({
      next: (items) => {
        const done = items.filter((a) => String(a.status).toUpperCase() === 'COMPLETED');
        this.completed.set(done);
        if (preset && done.some((item) => item.id === preset)) {
          this.appointmentId.set(preset);
        } else if (done.length) {
          this.appointmentId.set(done[0].id);
        }
      },
      error: (error) =>
        this.errorMessage.set(apiErrorMessage(error, 'No se pudieron cargar las citas.')),
    });
  }

  protected setRating(value: number): void {
    this.rating.set(value);
  }

  protected submit(): void {
    const id = this.appointmentId();
    if (!id) {
      return;
    }
    this.loading.set(true);
    this.reviews
      .create({
        appointmentId: id,
        rating: this.rating(),
        comment: this.comment().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigate(['/paciente/citas']);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo enviar la calificacion.'));
        },
      });
  }

  protected back(): void {
    void this.router.navigate(['/paciente/citas']);
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
    void this.router.navigate(['/paciente/dashboard']);
  }
  protected goConfig(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }
  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
