import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { apiErrorMessage } from '../../../core/services/api-error';
import { MentalHealthService } from '../../../core/services/mental-health.service';
import { MentalHealthScreeningResponse } from '../../../shared/models/mental-health.model';

@Component({
  selector: 'app-patient-mental-health-section',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="panel-section">
      <h3>Salud mental</h3>
      <p>Responde del 0 (nunca) al 3 (casi siempre) para cada ítem.</p>
      @for (answer of answers; track $index) {
        <label>
          Ítem {{ $index + 1 }}
          <input type="number" min="0" max="3" [(ngModel)]="answers[$index]" />
        </label>
      }
      <button type="button" (click)="submit()">Enviar test</button>
      @if (result()) {
        <p>Nivel: {{ result()?.level }} — {{ result()?.message }}</p>
      }
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
    </section>
  `,
})
export class PatientMentalHealthSectionComponent {
  private readonly mentalHealth = inject(MentalHealthService);

  protected answers = [0, 0, 0, 0, 0];
  protected readonly result = signal<MentalHealthScreeningResponse | null>(null);
  protected readonly errorMessage = signal('');

  protected submit(): void {
    this.mentalHealth.submitScreening({ answers: this.answers }).subscribe({
      next: (res) => this.result.set(res),
      error: (error) =>
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo enviar el cuestionario.')),
    });
  }
}
