import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PatientDashboardShellComponent } from '../shared/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-panel-paciente',
  imports: [PatientDashboardShellComponent],
  templateUrl: './panel-paciente.html',
  styleUrl: './panel-paciente.scss',
})
export class PanelPacienteComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected goContact(): void { void this.router.navigate(['/contact']); }
  protected goLanding(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goProfile(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goAppointments(): void { void this.router.navigate(['/paciente/citas']); }
  protected goMedications(): void { void this.router.navigate(['/contact']); }
  protected goMentalHealth(): void { void this.router.navigate(['/contact']); }
  protected goEmergency(): void { void this.router.navigate(['/contact']); }
  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
