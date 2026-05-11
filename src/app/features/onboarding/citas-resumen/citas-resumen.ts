import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PatientDashboardShellComponent } from '../shared/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-citas-resumen',
  imports: [PatientDashboardShellComponent],
  templateUrl: './citas-resumen.html',
  styleUrls: ['../citas-paciente/citas-paciente.scss'],
})
export class CitasResumenComponent {
  private readonly router = inject(Router);

  protected goDashboard(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goCitas(): void { void this.router.navigate(['/paciente/citas']); }
  protected goRecordatorios(): void { void this.router.navigate(['/contact']); }
  protected goHistorial(): void { void this.router.navigate(['/perfilsalud']); }
  protected goMental(): void { void this.router.navigate(['/contact']); }
  protected goPlanes(): void { void this.router.navigate(['/contact']); }
  protected goPerfil(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goConfig(): void { void this.router.navigate(['/contact']); }

  protected back(): void { void this.router.navigate(['/paciente/citas/seleccionar-fecha-hora']); }
  protected pay(): void { void this.router.navigate(['/paciente/citas/pago']); }
  protected logout(): void { void this.router.navigate(['/bienvenidacuenta']); }
}
