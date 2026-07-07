import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { MedicalDocumentService } from '../../../core/services/medical-document.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

type UploadStep = 'tipo' | 'archivo' | 'listo';

const DOCUMENT_TYPES = [
  { id: 'receta', label: 'Receta medica', hint: 'Medicamentos indicados por tu medico' },
  { id: 'laboratorio', label: 'Resultado de laboratorio', hint: 'Analisis de sangre, orina u otros' },
  { id: 'imagen', label: 'Imagen o informe', hint: 'Radiografias, ecografias, resonancias' },
  { id: 'otro', label: 'Otro documento', hint: 'Indicaciones, certificados u otros archivos' },
];

@Component({
  selector: 'app-historial-subir',
  imports: [CommonModule, FormsModule, PatientDashboardShellComponent],
  templateUrl: './historial-subir.html',
  styleUrls: ['./historial-subir.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class HistorialSubirComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly documentsService = inject(MedicalDocumentService);
  protected readonly shellNav = inject(PatientShellNav);

  protected readonly documentTypes = DOCUMENT_TYPES;
  protected readonly step = signal<UploadStep>('tipo');
  protected readonly selectedType = signal('');
  protected readonly title = signal('');
  protected readonly fileName = signal('');
  protected readonly description = signal('');
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly selectedTypeLabel = computed(
    () => this.documentTypes.find((t) => t.id === this.selectedType())?.label ?? 'Documento',
  );

  protected selectType(typeId: string): void {
    this.selectedType.set(typeId);
    this.errorMessage.set('');
  }

  protected goToUpload(): void {
    if (!this.selectedType()) {
      this.errorMessage.set('Selecciona un tipo de documento.');
      return;
    }
    this.step.set('archivo');
    this.errorMessage.set('');
  }

  protected backToType(): void {
    this.step.set('tipo');
    this.errorMessage.set('');
  }

  protected submitUpload(): void {
    const title = this.title().trim();
    const fileName = this.fileName().trim();
    if (!title || !fileName) {
      this.errorMessage.set('Indica un titulo y el nombre del archivo.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.documentsService
      .create({
        title,
        fileName,
        description: this.description().trim() || undefined,
        documentType: this.selectedTypeLabel(),
        fileUrl: `https://docs.saludlink.pe/uploads/${encodeURIComponent(fileName)}`,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.step.set('listo');
        },
        error: (error) => {
          this.saving.set(false);
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo subir el documento.'));
        },
      });
  }

  protected goHistorial(): void {
    void this.router.navigate(['/paciente/historial']);
  }
}
