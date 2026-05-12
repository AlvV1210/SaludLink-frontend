import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-validacion-credenciales',
  templateUrl: './validacion-credenciales.html',
  styleUrl: './validacion-credenciales.scss',
})
export class ValidacionCredencialesComponent {
  private readonly router = inject(Router);

  protected submitValidation(): void {
    void this.router.navigate(['/medico/dashboard']);
  }
}
