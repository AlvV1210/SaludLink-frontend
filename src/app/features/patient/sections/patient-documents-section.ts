import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { apiErrorMessage } from '../../../core/services/api-error';
import { ClinicalRecordService } from '../../../core/services/clinical-record.service';
import { MedicalDocumentService } from '../../../core/services/medical-document.service';
import { MedicalDocument } from '../../../shared/models/medical-document.model';

@Component({
  selector: 'app-patient-documents-section',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="panel-section">
      <h3>Documentos e historial</h3>
      @if (errorMessage()) {
        <p class="error">{{ errorMessage() }}</p>
      }
      <ul>
        @for (doc of documents(); track doc.id) {
          <li>{{ doc.title || doc.fileName || doc.fileUrl }} — {{ doc.uploadedAt }}</li>
        }
      </ul>
      <div class="form-row">
        <input [(ngModel)]="newTitle" placeholder="Título del documento" />
        <input [(ngModel)]="newUrl" placeholder="URL del archivo" />
        <button type="button" (click)="upload()">Subir documento</button>
        <button type="button" (click)="exportHistory()">Exportar historial PDF</button>
      </div>
      @if (exportCode()) {
        <p>Código de acceso: <strong>{{ exportCode() }}</strong></p>
      }
    </section>
  `,
})
export class PatientDocumentsSectionComponent implements OnInit {
  private readonly documentsService = inject(MedicalDocumentService);
  private readonly clinicalRecords = inject(ClinicalRecordService);

  protected readonly documents = signal<MedicalDocument[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly exportCode = signal('');
  protected newTitle = '';
  protected newUrl = '';

  ngOnInit(): void {
    this.reload();
  }

  protected upload(): void {
    this.documentsService
      .create({ fileName: this.newTitle, fileUrl: this.newUrl, documentType: 'PDF' })
      .subscribe({
        next: () => {
          this.newTitle = '';
          this.newUrl = '';
          this.reload();
        },
        error: (error) =>
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo subir el documento.')),
      });
  }

  protected exportHistory(): void {
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 6);
    this.clinicalRecords
      .export({ fromDate: fromDate.toISOString().slice(0, 10), toDate: to })
      .subscribe({
        next: (res) => this.exportCode.set(res.accessCode),
        error: (error) =>
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo exportar el historial.')),
      });
  }

  private reload(): void {
    this.documentsService.listMine().subscribe({
      next: (items) => this.documents.set(items),
      error: (error) =>
        this.errorMessage.set(apiErrorMessage(error, 'No se pudieron cargar documentos.')),
    });
  }
}
