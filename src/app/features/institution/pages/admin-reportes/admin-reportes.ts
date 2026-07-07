import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../../core/services/api-error';
import { InstitutionService } from '../../../../core/services/institution.service';
import { InstitutionReportResponse } from '../../../../shared/models/institution.model';

interface ReportCatalogItem {
  id: 'attendance' | 'financial' | 'satisfaction';
  icon: string;
  title: string;
  description: string;
  primary: boolean;
  available: boolean;
}

@Component({
  selector: 'app-admin-reportes',
  imports: [TitleCasePipe],
  templateUrl: './admin-reportes.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-reportes.scss'],
})
export class AdminReportesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly institutionService = inject(InstitutionService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly uiMessage = signal('');
  protected readonly currentReport = signal<InstitutionReportResponse | null>(null);
  protected readonly previousReport = signal<InstitutionReportResponse | null>(null);

  protected readonly catalog: ReportCatalogItem[] = [
    {
      id: 'attendance',
      icon: '📊',
      title: 'Asistencia y no-shows',
      description: 'Por médico, especialidad y periodo',
      primary: true,
      available: true,
    },
    {
      id: 'financial',
      icon: '💰',
      title: 'Reporte financiero',
      description: 'Ingresos por consulta y especialidad',
      primary: false,
      available: false,
    },
    {
      id: 'satisfaction',
      icon: '⭐',
      title: 'Satisfacción de pacientes',
      description: 'Calificaciones y reseñas',
      primary: false,
      available: false,
    },
  ];

  protected readonly attendanceRate = computed(() =>
    this.rate(this.currentReport()?.attended, this.currentReport()?.totalAppointments),
  );

  protected readonly noShowRate = computed(() =>
    this.rate(this.currentReport()?.noShows, this.currentReport()?.totalAppointments),
  );

  protected readonly cancellationRate = computed(() =>
    this.rate(this.currentReport()?.cancelled, this.currentReport()?.totalAppointments),
  );

  protected readonly periodLabel = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('es-PE', { month: 'long' });
  });

  protected readonly noShowDelta = computed(() => {
    const current = this.noShowRate();
    const previous = this.rate(
      this.previousReport()?.noShows,
      this.previousReport()?.totalAppointments,
    );
    if (!this.previousReport()?.totalAppointments) {
      return null;
    }
    return Math.round((current - previous) * 10) / 10;
  });

  protected readonly noShowDeltaLabel = computed(() => {
    const delta = this.noShowDelta();
    if (delta === null) {
      return '—';
    }
    if (delta === 0) {
      return 'estable';
    }
    const arrow = delta < 0 ? '↓' : '↑';
    return `${arrow} ${Math.abs(delta)}%`;
  });

  protected readonly cancellationHint = computed(() => {
    const current = this.cancellationRate();
    const previous = this.rate(
      this.previousReport()?.cancelled,
      this.previousReport()?.totalAppointments,
    );
    if (!this.previousReport()?.totalAppointments) {
      return '—';
    }
    const delta = Math.abs(current - previous);
    return delta < 0.5 ? 'estable' : current > previous ? '↑ leve' : '↓ leve';
  });

  ngOnInit(): void {
    this.loadPeriodMetrics();
  }

  protected generateReport(item: ReportCatalogItem): void {
    this.uiMessage.set('');
    this.errorMessage.set('');

    if (!item.available) {
      this.uiMessage.set('Este reporte estará disponible próximamente.');
      return;
    }

    if (item.id === 'attendance') {
      void this.router.navigate(['/admin/reportes/asistencia']);
      return;
    }
  }

  private loadPeriodMetrics(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const current = this.currentMonthRange();
    const previous = this.previousMonthRange();

    this.institutionService.getReports(current.from, current.to).subscribe({
      next: (report) => {
        this.currentReport.set(report);
        this.institutionService.getReports(previous.from, previous.to).subscribe({
          next: (prev) => {
            this.previousReport.set(prev);
            this.loading.set(false);
          },
          error: () => {
            this.previousReport.set(null);
            this.loading.set(false);
          },
        });
      },
      error: (error) => {
        this.loading.set(false);
        this.currentReport.set(null);
        this.previousReport.set(null);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudieron cargar las métricas.'));
      },
    });
  }

  private rate(part: number | undefined, total: number | undefined): number {
    if (!total || part === undefined) {
      return 0;
    }
    return Math.round((part / total) * 1000) / 10;
  }

  private currentMonthRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: this.toIsoDate(from), to: this.toIsoDate(now) };
  }

  private previousMonthRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: this.toIsoDate(from), to: this.toIsoDate(to) };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
