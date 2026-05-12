import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-medico',
  templateUrl: './registro-medico.html',
  styleUrl: './registro-medico.scss',
})
export class RegistroMedicoComponent {
  private readonly router = inject(Router);

  protected finish(): void {
    void this.router.navigate(['/validacioncredenciales']);
  }
}
