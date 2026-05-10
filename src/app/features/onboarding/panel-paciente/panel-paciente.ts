import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-panel-paciente',
  templateUrl: './panel-paciente.html',
  styleUrl: './panel-paciente.scss',
})
export class PanelPacienteComponent {
  private readonly router = inject(Router);

  protected goContact(): void {
    void this.router.navigate(['/contact']);
  }

  protected goLanding(): void {
    void this.router.navigate(['/']);
  }

  protected goProfile(): void {
    void this.router.navigate(['/perfilsalud']);
  }

  protected goAppointments(): void {
    void this.router.navigate(['/contact']);
  }

  protected goMedications(): void {
    void this.router.navigate(['/contact']);
  }

  protected goMentalHealth(): void {
    void this.router.navigate(['/contact']);
  }

  protected goEmergency(): void {
    void this.router.navigate(['/contact']);
  }

  protected logout(): void {
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
