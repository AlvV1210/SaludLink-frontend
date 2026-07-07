import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { apiErrorMessage } from '../../../core/services/api-error';
import { DependentService } from '../../../core/services/dependent.service';
import { CreateDependentRequest, Dependent } from '../../../shared/models/dependent.model';

@Component({
  selector: 'app-patient-dependents-section',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="panel-section">
      <h3>Perfiles dependientes</h3>
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
      <ul>
        @for (dep of dependents(); track dep.id) {
          <li>{{ dep.firstName }} {{ dep.lastName }} ({{ dep.relationship || 'Dependiente' }})</li>
        }
      </ul>
      <div class="form-row">
        <input [(ngModel)]="draft.firstName" placeholder="Nombres" />
        <input [(ngModel)]="draft.lastName" placeholder="Apellidos" />
        <input [(ngModel)]="draft.relationship" placeholder="Parentesco" />
        <button type="button" (click)="add()">Añadir dependiente</button>
      </div>
    </section>
  `,
})
export class PatientDependentsSectionComponent implements OnInit {
  private readonly dependentsService = inject(DependentService);

  protected readonly dependents = signal<Dependent[]>([]);
  protected readonly errorMessage = signal('');
  protected draft: CreateDependentRequest = {
    firstName: '',
    lastName: '',
    relationship: '',
  };

  ngOnInit(): void {
    this.reload();
  }

  protected add(): void {
    this.dependentsService.create(this.draft).subscribe({
      next: () => {
        this.draft = { firstName: '', lastName: '', relationship: '' };
        this.reload();
      },
      error: (error) =>
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo crear el dependiente.')),
    });
  }

  private reload(): void {
    this.dependentsService.list().subscribe({
      next: (items) => this.dependents.set(items),
      error: (error) =>
        this.errorMessage.set(apiErrorMessage(error, 'No se pudieron cargar dependientes.')),
    });
  }
}
