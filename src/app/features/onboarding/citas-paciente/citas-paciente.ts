import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PatientDashboardShellComponent } from '../shared/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-citas-paciente',
  imports: [PatientDashboardShellComponent],
  templateUrl: './citas-paciente.html',
  styleUrl: './citas-paciente.scss',
})
export class CitasPacienteComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly tab = signal<'proximas' | 'pasadas' | 'canceladas'>('proximas');

  protected goDashboard(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goCitas(): void { void this.router.navigate(['/paciente/citas']); }
  protected goRecordatorios(): void { void this.router.navigate(['/contact']); }
  protected goHistorial(): void { void this.router.navigate(['/perfilsalud']); }
  protected goMental(): void { void this.router.navigate(['/contact']); }
  protected goPlanes(): void { void this.router.navigate(['/contact']); }
  protected goPerfil(): void { void this.router.navigate(['/paciente/dashboard']); }
  protected goConfig(): void { void this.router.navigate(['/contact']); }

  protected setTab(tab: 'proximas' | 'pasadas' | 'canceladas'): void { this.tab.set(tab); }
  protected goNuevaCita(): void { void this.router.navigate(['/paciente/citas/buscar-especialista']); }
  protected goReprogramar(): void { void this.router.navigate(['/paciente/citas/reprogramar']); }
  protected goCalificar(): void { void this.router.navigate(['/paciente/citas/calificar']); }
  protected logout(): void { this.auth.logout(); void this.router.navigate(['/bienvenidacuenta']); }
}

