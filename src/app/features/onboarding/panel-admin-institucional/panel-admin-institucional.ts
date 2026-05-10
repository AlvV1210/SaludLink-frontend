import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-panel-admin-institucional',
  templateUrl: './panel-admin-institucional.html',
  styleUrl: './panel-admin-institucional.scss',
})
export class PanelAdminInstitucionalComponent {
  private readonly router = inject(Router);

  protected goReportes(): void {
    void this.router.navigate(['/contact']);
  }

  protected goMedicos(): void {
    void this.router.navigate(['/contact']);
  }

  protected goFullPanel(): void {
    void this.router.navigate(['/']);
  }
}
