import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-salud',
  templateUrl: './perfil-salud.html',
  styleUrl: './perfil-salud.scss',
})
export class PerfilSaludComponent {
  private readonly router = inject(Router);

  protected skip(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected saveAndContinue(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }
}
