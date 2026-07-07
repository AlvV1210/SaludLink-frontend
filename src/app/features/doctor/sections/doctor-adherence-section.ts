import { CommonModule } from '@angular/common';
import { Component, inject, input, signal, effect } from '@angular/core';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AdherenceService } from '../../../core/services/adherence.service';
import { AdherenceDashboardResponse } from '../../../shared/models/adherence.model';

@Component({
  selector: 'app-doctor-adherence-section',
  imports: [CommonModule],
  template: `
    <section class="panel-section">
      <h3>Adherencia del paciente</h3>
      @if (data()) {
        <p>{{ data()?.patientName }} — {{ data()?.adherencePercentage }}%</p>
        <p [class]="data()?.status === 'GREEN' ? 'status ok' : 'status off'">
          Semáforo: {{ data()?.status }}
        </p>
      }
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
    </section>
  `,
})
export class DoctorAdherenceSectionComponent {
  private readonly adherence = inject(AdherenceService);

  readonly patientId = input<number | null>(null);
  protected readonly data = signal<AdherenceDashboardResponse | null>(null);
  protected readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      const id = this.patientId();
      if (!id) {
        return;
      }
      this.adherence.getPatientAdherence(id).subscribe({
        next: (res) => this.data.set(res),
        error: (error) =>
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo cargar adherencia.')),
      });
    });
  }
}
