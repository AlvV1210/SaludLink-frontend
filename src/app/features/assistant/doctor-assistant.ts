import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Assistant } from './assistant';

@Component({
  selector: 'app-doctor-assistant',
  imports: [Assistant],
  template: `
    <section class="doctor-assistant-page">
      <header class="page-head">
        <button type="button" class="back-btn" (click)="goBack()">← Volver al panel</button>
      </header>
      <app-assistant />
    </section>
  `,
  styles: `
    .doctor-assistant-page {
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }
    .back-btn {
      border: none;
      background: transparent;
      color: #0b6e99;
      cursor: pointer;
      margin-bottom: 12px;
      font-size: 0.95rem;
    }
  `,
})
export class DoctorAssistantPage {
  private readonly router = inject(Router);

  protected goBack(): void {
    void this.router.navigate(['/medico/dashboard']);
  }
}
