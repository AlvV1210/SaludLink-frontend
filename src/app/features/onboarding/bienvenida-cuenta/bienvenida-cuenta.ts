import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bienvenida-cuenta',
  templateUrl: './bienvenida-cuenta.html',
  styleUrl: './bienvenida-cuenta.scss',
})
export class BienvenidaCuentaComponent {
  private readonly router = inject(Router);

  protected goToProfiles(): void {
    void this.router.navigate(['/perfiles']);
  }

  protected goToLogin(): void {
    void this.router.navigate(['/registro']);
  }
}
