import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class PatientShellNav {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  goDashboard(): void {
    void this.router.navigateByUrl('/paciente/dashboard');
  }

  goCitas(): void {
    void this.router.navigateByUrl('/paciente/citas');
  }

  goRecordatorios(): void {
    void this.router.navigateByUrl('/paciente/recordatorios');
  }

  goHistorial(): void {
    void this.router.navigateByUrl('/paciente/historial');
  }

  goMental(): void {
    void this.router.navigateByUrl('/paciente/salud-mental');
  }

  goAsistente(): void {
    void this.router.navigateByUrl('/paciente/asistente');
  }

  goPlanes(): void {
    void this.router.navigateByUrl('/paciente/planes');
  }

  goPerfil(): void {
    void this.router.navigateByUrl('/paciente/dashboard');
  }

  goConfig(): void {
    void this.router.navigateByUrl('/contact');
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/bienvenidacuenta');
  }
}
