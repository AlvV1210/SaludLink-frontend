import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PatientDashboardShellComponent } from '../shared/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-citas-buscar-especialista',
  imports: [PatientDashboardShellComponent],
  templateUrl: './citas-buscar-especialista.html',
  styleUrls: ['../citas-paciente/citas-paciente.scss'],
})
export class CitasBuscarEspecialistaComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected goDashboard(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goCitas(): void { void this.router.navigate(['/paciente/citas']); }
  protected goRecordatorios(): void { void this.router.navigate(['/contact']); }
  protected goHistorial(): void { void this.router.navigate(['/perfilsalud']); }
  protected goMental(): void { void this.router.navigate(['/contact']); }
  protected goPlanes(): void { void this.router.navigate(['/contact']); }
  protected goPerfil(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goConfig(): void { void this.router.navigate(['/contact']); }

  protected next(): void { void this.router.navigate(['/paciente/citas/seleccionar-fecha-hora']); }
  protected back(): void { void this.router.navigate(['/paciente/citas']); }
  protected logout(): void { this.auth.logout(); void this.router.navigate(['/bienvenidacuenta']); }
}

