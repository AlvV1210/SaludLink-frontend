import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';
import {
  saveAttendanceReportConfig,
} from './attendance-report-config';

type ReportDimension = 'doctor' | 'specialty';

interface MetricOption {
  id: string;
  label: string;
  supported: boolean;
  defaultChecked: boolean;
}

@Component({
  selector: 'app-admin-reporte-asistencia',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './admin-reporte-asistencia.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-reporte-asistencia.scss'],
})
export class AdminReporteAsistenciaComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly store = inject(InstitutionAdminStoreService);

  protected readonly errorMessage = signal('');

  protected reportFrom = '';
  protected reportTo = '';
  protected dimension: ReportDimension = 'doctor';
  protected specialtyFilter = 'Todas';

  protected readonly metricOptions: MetricOption[] = [
    { id: 'total', label: 'Citas totales', supported: true, defaultChecked: true },
    { id: 'attended', label: 'Asistidas', supported: true, defaultChecked: true },
    { id: 'noShows', label: 'No-shows', supported: true, defaultChecked: true },
    { id: 'cancelled', label: 'Canceladas', supported: true, defaultChecked: true },
    { id: 'rescheduled', label: 'Reprogramadas', supported: false, defaultChecked: false },
    { id: 'occupancy', label: 'Tasa ocupación', supported: false, defaultChecked: false },
  ];

  protected readonly selectedMetrics = signal(
    new Set(this.metricOptions.filter((m) => m.defaultChecked).map((m) => m.id)),
  );

  protected readonly doctorCount = computed(() => this.store.doctors().length);

  protected readonly specialtyOptions = computed(() => {
    const specialties = new Set(this.store.doctors().map((doctor) => doctor.specialty).filter(Boolean));
    return ['Todas', ...[...specialties].sort()];
  });

  protected readonly previewPeriodLabel = computed(() => {
    if (!this.reportFrom) {
      return 'periodo seleccionado';
    }
    const date = new Date(`${this.reportFrom}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return 'periodo seleccionado';
    }
    return date.toLocaleDateString('es-PE', { month: 'long' });
  });

  ngOnInit(): void {
    const range = this.currentMonthRange();
    this.reportFrom = range.from;
    this.reportTo = range.to;

    if (!this.store.doctors().length && !this.store.loading()) {
      this.store.refreshCore();
    }
  }

  protected isMetricSelected(id: string): boolean {
    return this.selectedMetrics().has(id);
  }

  protected toggleMetric(id: string): void {
    const next = new Set(this.selectedMetrics());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedMetrics.set(next);
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/reportes']);
  }

  protected submitReport(): void {
    this.errorMessage.set('');

    if (!this.reportFrom || !this.reportTo || this.reportFrom > this.reportTo) {
      this.errorMessage.set('Selecciona un rango de fechas válido.');
      return;
    }
    if (!this.selectedMetrics().size) {
      this.errorMessage.set('Selecciona al menos una métrica.');
      return;
    }

    saveAttendanceReportConfig({
      reportFrom: this.reportFrom,
      reportTo: this.reportTo,
      dimension: this.dimension,
      specialtyFilter: this.specialtyFilter,
      selectedMetrics: [...this.selectedMetrics()],
    });

    void this.router.navigate(['/admin/reportes/asistencia/resultado']);
  }

  private currentMonthRange(): { from: string; to: string } {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: this.toIsoDate(from), to: this.toIsoDate(now) };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
