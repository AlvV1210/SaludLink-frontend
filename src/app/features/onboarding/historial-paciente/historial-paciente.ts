import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { MedicalDocumentService } from '../../../core/services/medical-document.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';
import { MedicalDocument } from '../../../shared/models/medical-document.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historial-paciente',
  imports: [CommonModule, PatientDashboardShellComponent],
  templateUrl: './historial-paciente.html',
  styleUrls: ['./historial-paciente.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class HistorialPacienteComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly documentsService = inject(MedicalDocumentService);
  protected readonly shellNav = inject(PatientShellNav);

  protected readonly documents = signal<MedicalDocument[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  ngOnInit(): void {
    this.documentsService.listMine().subscribe({
      next: (items) => {
        this.documents.set(items);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo cargar el historial.'));
      },
    });
  }

  protected exportHistory(): void {
    void this.router.navigate(['/paciente/historial/exportar']);
  }

  protected uploadDocument(): void {
    void this.router.navigate(['/paciente/historial/subir']);
  }

  protected docLabel(doc: MedicalDocument): string {
    return doc.title || doc.fileName || doc.fileUrl || 'Documento';
  }
}
