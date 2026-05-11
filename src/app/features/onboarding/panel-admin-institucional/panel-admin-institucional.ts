import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-panel-admin-institucional',
  templateUrl: './panel-admin-institucional.html',
  styleUrl: './panel-admin-institucional.scss',
})
export class PanelAdminInstitucionalComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected goDashboard(): void {
    void this.router.navigate(['/admin/dashboard']);
  }

  protected goReportes(): void {
    void this.router.navigate(['/admin/dashboard']);
  }

  protected goMedicos(): void {
    void this.router.navigate(['/admin/dashboard']);
  }

  protected goFullPanel(): void {
    void this.router.navigate(['/admin/dashboard']);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
