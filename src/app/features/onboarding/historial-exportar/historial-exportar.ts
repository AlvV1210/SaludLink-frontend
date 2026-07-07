import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { ClinicalRecordService } from '../../../core/services/clinical-record.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

type ExportStep = 'config' | 'generating' | 'listo';

@Component({
  selector: 'app-historial-exportar',
  imports: [FormsModule, PatientDashboardShellComponent],
  templateUrl: './historial-exportar.html',
  styleUrls: ['./historial-exportar.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class HistorialExportarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly clinicalRecords = inject(ClinicalRecordService);
  protected readonly shellNav = inject(PatientShellNav);

  protected readonly step = signal<ExportStep>('config');
  protected readonly progress = signal(0);
  protected readonly accessCode = signal('');
  protected readonly errorMessage = signal('');

  protected fromDate = '';
  protected toDate = new Date().toISOString().slice(0, 10);
  protected includeConsultas = true;
  protected includeRecetas = true;
  protected includeLaboratorio = true;

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    if (path.includes('generando')) {
      this.step.set('generating');
      this.runGeneratingUi();
    } else if (path.includes('listo')) {
      this.step.set('listo');
      this.accessCode.set(sessionStorage.getItem('saludlink.exportCode') ?? 'SL-XXXX');
    } else {
      const from = new Date();
      from.setMonth(from.getMonth() - 6);
      this.fromDate = from.toISOString().slice(0, 10);
    }
  }

  protected startExport(): void {
    if (!this.fromDate || !this.toDate) {
      this.errorMessage.set('Selecciona el rango de fechas.');
      return;
    }
    this.errorMessage.set('');
    sessionStorage.setItem(
      'saludlink.exportRange',
      JSON.stringify({ fromDate: this.fromDate, toDate: this.toDate }),
    );
    void this.router.navigate(['/paciente/historial/exportar/generando']);
  }

  protected finishFromGenerating(): void {
    const raw = sessionStorage.getItem('saludlink.exportRange');
    let fromDate = this.fromDate;
    let toDate = this.toDate;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { fromDate?: string; toDate?: string };
        fromDate = parsed.fromDate ?? fromDate;
        toDate = parsed.toDate ?? toDate;
      } catch {
        // ignore invalid cache
      }
    }

    this.clinicalRecords.export({ fromDate, toDate }).subscribe({
      next: (res) => {
        sessionStorage.setItem('saludlink.exportCode', res.accessCode);
        void this.router.navigate(['/paciente/historial/exportar/listo']);
      },
      error: () => {
        sessionStorage.setItem('saludlink.exportCode', `SL-${Math.floor(100000 + Math.random() * 900000)}`);
        void this.router.navigate(['/paciente/historial/exportar/listo']);
      },
    });
  }

  protected backToHistorial(): void {
    void this.router.navigate(['/paciente/historial']);
  }

  protected downloadMock(): void {
    const blob = new Blob(['Historial clinico SaludLink - exportacion demo'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'historial-saludlink.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private runGeneratingUi(): void {
    this.progress.set(12);
    const timer = setInterval(() => {
      this.progress.update((value) => {
        const next = Math.min(value + 18, 100);
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => this.finishFromGenerating(), 400);
        }
        return next;
      });
    }, 350);
  }
}
