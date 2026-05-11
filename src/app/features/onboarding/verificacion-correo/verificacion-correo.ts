import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verificacion-correo',
  templateUrl: './verificacion-correo.html',
  styleUrl: './verificacion-correo.scss',
})
export class VerificacionCorreoComponent {
  private readonly router = inject(Router);

  protected changeEmail(): void {
    void this.router.navigate(['/registropaciente']);
  }

  protected resend(): void {
    // Flujo demo: mantenemos al usuario en la pantalla.
  }

  protected continueFlow(): void {
    void this.router.navigate(['/perfilsalud']);
  }
}
