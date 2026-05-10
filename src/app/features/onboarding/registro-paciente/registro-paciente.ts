import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-paciente',
  templateUrl: './registro-paciente.html',
  styleUrl: './registro-paciente.scss',
})
export class RegistroPacienteComponent {
  private readonly router = inject(Router);

  protected finish(): void {
    void this.router.navigate(['/verificacioncorreo']);
  }
}
