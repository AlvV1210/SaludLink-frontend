import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-medico-bienvenida',
  templateUrl: './medico-bienvenida.html',
  styleUrl: './medico-bienvenida.scss',
})
export class MedicoBienvenidaComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly doctorName =
    this.auth.getCurrentUser()?.firstName?.trim() || 'Doctor';

  protected goDashboard(section?: string): void {
    void this.router.navigate(['/medico/dashboard'], {
      queryParams: section ? { section } : undefined,
    });
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/bienvenidacuenta');
  }
}
