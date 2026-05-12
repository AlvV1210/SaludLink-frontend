import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consulta-videollamada',
  templateUrl: './consulta-videollamada.html',
  styleUrl: './consulta-videollamada.scss',
})
export class ConsultaVideollamadaComponent {
  private readonly router = inject(Router);

  protected finishConsultation(): void {
    void this.router.navigate(['/paciente/consulta/finalizada']);
  }
}
