import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-panel-medico',
  templateUrl: './panel-medico.html',
  styleUrl: './panel-medico.scss',
})
export class PanelMedicoComponent {
  private readonly router = inject(Router);

  protected goAgenda(): void {
    void this.router.navigate(['/contact']);
  }

  protected goPacientes(): void {
    void this.router.navigate(['/contact']);
  }

  protected goMainPanel(): void {
    void this.router.navigate(['/']);
  }
}
