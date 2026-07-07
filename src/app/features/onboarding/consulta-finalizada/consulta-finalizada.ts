import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-consulta-finalizada',
  imports: [PatientDashboardShellComponent],
  templateUrl: './consulta-finalizada.html',
  styleUrl: './consulta-finalizada.scss',
})
export class ConsultaFinalizadaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly appointments = inject(AppointmentService);

  protected readonly appointment = signal<Appointment | null>(null);

  protected readonly doctorLabel = computed(() => {
    const item = this.appointment();
    if (!item) {
      return 'Dr. Perez';
    }
    const name =
      item.doctorName ??
      item.doctorFullName ??
      [item.doctorFirstName, item.doctorLastName].filter(Boolean).join(' ');
    return name?.startsWith('Dr') ? name : `Dr. ${name ?? 'Perez'}`;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    this.appointments.getAppointmentsByPatient().subscribe({
      next: (items) => {
        const match =
          (id ? items.find((item) => item.id === id) : null) ??
          items.find((item) => String(item.status).toUpperCase() === 'COMPLETED') ??
          null;
        this.appointment.set(match);
      },
    });
  }

  protected goChat(): void {
    const id = this.appointment()?.id;
    if (!id) {
      return;
    }
    void this.router.navigate(['/paciente/consulta/chat'], {
      queryParams: { appointmentId: id, closed: 1 },
    });
  }

  protected goCalificar(): void {
    const id = this.appointment()?.id;
    if (!id) {
      void this.router.navigate(['/paciente/citas/calificar']);
      return;
    }
    void this.router.navigate(['/paciente/citas/calificar'], { queryParams: { appointmentId: id } });
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
  protected goHome(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
