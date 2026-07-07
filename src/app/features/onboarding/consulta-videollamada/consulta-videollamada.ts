import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { TelemedicineService } from '../../../core/services/telemedicine.service';

@Component({
  selector: 'app-consulta-videollamada',
  imports: [CommonModule],
  templateUrl: './consulta-videollamada.html',
  styleUrl: './consulta-videollamada.scss',
})
export class ConsultaVideollamadaComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly telemedicine = inject(TelemedicineService);

  protected readonly joinUrl = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly loading = signal(false);

  constructor() {
    const appointmentId = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    if (!appointmentId) {
      this.errorMessage.set('Selecciona una cita válida para unirte.');
      return;
    }
    this.loading.set(true);
    this.telemedicine.joinSession(appointmentId).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.joinUrl.set(response.joinUrl);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo iniciar la videoconsulta.'));
      },
    });
  }

  protected finishConsultation(): void {
    const appointmentId = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    void this.router.navigate(['/paciente/consulta/finalizada'], {
      queryParams: appointmentId ? { appointmentId } : undefined,
    });
  }
}
