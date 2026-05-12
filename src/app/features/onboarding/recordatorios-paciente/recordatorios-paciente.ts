import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PatientDashboardShellComponent } from '../shared/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-recordatorios-paciente',
  imports: [PatientDashboardShellComponent],
  templateUrl: './recordatorios-paciente.html',
  styleUrl: './recordatorios-paciente.scss',
})
export class RecordatoriosPacienteComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected goDashboard(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goCitas(): void { void this.router.navigate(['/paciente/citas']); }
  protected goRecordatorios(): void { void this.router.navigate(['/paciente/recordatorios']); }
  protected goHistorial(): void { void this.router.navigate(['/perfilsalud']); }
  protected goMental(): void { void this.router.navigate(['/contact']); }
  protected goPlanes(): void { void this.router.navigate(['/contact']); }
  protected goPerfil(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goConfig(): void { void this.router.navigate(['/contact']); }
  protected goEmergency(): void { void this.router.navigate(['/paciente/sos']); }
  protected joinConsultation(): void { void this.router.navigate(['/paciente/consulta/previa']); }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
