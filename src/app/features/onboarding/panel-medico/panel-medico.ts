import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-panel-medico',
  templateUrl: './panel-medico.html',
  styleUrl: './panel-medico.scss',
})
export class PanelMedicoComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected goAgenda(): void {
    void this.router.navigate(['/medico/dashboard']);
  }

  protected goPacientes(): void {
    void this.router.navigate(['/medico/dashboard']);
  }

  protected goMainPanel(): void {
    void this.router.navigate(['/medico/dashboard']);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
