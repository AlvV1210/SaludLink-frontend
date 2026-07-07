import { Component } from '@angular/core';

import { Assistant } from './assistant';

@Component({
  selector: 'app-institution-assistant',
  imports: [Assistant],
  template: `
    <section class="institution-assistant-page">
      <header class="page-head">
        <h1>Asistente IA</h1>
        <p class="subtitle">
          Modo soporte (RAG) y carga de documentos PDF para el vector store institucional.
        </p>
      </header>
      <app-assistant />
    </section>
  `,
  styles: `
    .institution-assistant-page {
      max-width: 960px;
    }
    .page-head h1 {
      margin: 0 0 4px;
      font-size: 1.5rem;
    }
    .subtitle {
      margin: 0 0 16px;
      color: #6b7280;
    }
  `,
})
export class InstitutionAssistantPage {}
