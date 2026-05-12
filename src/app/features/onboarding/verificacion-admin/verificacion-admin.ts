import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verificacion-admin',
  templateUrl: './verificacion-admin.html',
  styleUrl: './verificacion-admin.scss',
})
export class VerificacionAdminComponent {
  private readonly router = inject(Router);

  protected goBack(): void {
    void this.router.navigate(['/registroinstitucion']);
  }

  protected createInstitution(): void {
    void this.router.navigate(['/admin/dashboard']);
  }
}
