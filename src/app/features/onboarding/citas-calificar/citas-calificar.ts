import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PatientDashboardShellComponent } from '../shared/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-citas-calificar',
  imports: [PatientDashboardShellComponent],
  templateUrl: './citas-calificar.html',
  styleUrls: ['../citas-paciente/citas-paciente.scss'],
})
export class CitasCalificarComponent {
  private readonly router = inject(Router);
  protected readonly stars = signal(5);

  protected goDashboard(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goCitas(): void { void this.router.navigate(['/paciente/citas']); }
  protected goRecordatorios(): void { void this.router.navigate(['/contact']); }
  protected goHistorial(): void { void this.router.navigate(['/perfilsalud']); }
  protected goMental(): void { void this.router.navigate(['/contact']); }
  protected goPlanes(): void { void this.router.navigate(['/contact']); }
  protected goPerfil(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goConfig(): void { void this.router.navigate(['/contact']); }

  protected setStars(value: number): void { this.stars.set(value); }
  protected publish(): void { void this.router.navigate(['/paciente/citas']); }
  protected logout(): void { void this.router.navigate(['/bienvenidacuenta']); }
}
