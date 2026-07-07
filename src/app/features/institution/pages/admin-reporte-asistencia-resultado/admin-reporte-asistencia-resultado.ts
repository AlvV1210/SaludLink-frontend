import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../../core/services/api-error';
import { AiService } from '../../../../core/services/ai.service';
import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';
import { InstitutionService } from '../../../../core/services/institution.service';
import { Appointment } from '../../../../shared/models/appointment.model';
import { InstitutionReportResponse } from '../../../../shared/models/institution.model';
import {
  AttendanceReportConfig,
  loadAttendanceReportConfig,
} from '../admin-reporte-asistencia/attendance-report-config';

interface WeeklyPoint {
  label: string;
  attendanceRate: number;
}

interface BreakdownRow {
  label: string;
  attendanceRate: number;
  noShowRate: number;
}

@Component({
  selector: 'app-admin-reporte-asistencia-resultado',
  imports: [TitleCasePipe],
  templateUrl: './admin-reporte-asistencia-resultado.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-reporte-asistencia-resultado.scss'],
})
export class AdminReporteAsistenciaResultadoComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly institutionService = inject(InstitutionService);
  private readonly aiService = inject(AiService);
  protected readonly store = inject(InstitutionAdminStoreService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly uiMessage = signal('');
  protected readonly config = signal<AttendanceReportConfig | null>(null);
  protected readonly report = signal<InstitutionReportResponse | null>(null);
  protected readonly previousReport = signal<InstitutionReportResponse | null>(null);
  protected readonly aiResumen = signal('');
  protected readonly aiRecomendacion = signal('');
  protected readonly aiLoading = signal(false);
  protected readonly aiError = signal('');

  protected readonly filteredAppointments = computed(() =>
    this.filterAppointments(this.config(), this.store.appointments()),
  );

  protected readonly periodTitle = computed(() => {
    const cfg = this.config();
    if (!cfg) {
      return 'Asistencia';
    }
    const from = new Date(`${cfg.reportFrom}T12:00:00`);
    const to = new Date(`${cfg.reportTo}T12:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return 'Asistencia';
    }
    if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
      const month = from.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
      return `Asistencia · ${month}`;
    }
    return `Asistencia · ${cfg.reportFrom} — ${cfg.reportTo}`;
  });

  protected readonly summaryLine = computed(() => {
    const report = this.report();
    const doctors = this.store.doctors().length;
    const total = report?.totalAppointments ?? 0;
    return `${total} cita${total === 1 ? '' : 's'} · ${doctors} médico${doctors === 1 ? '' : 's'}`;
  });

  protected readonly totalDeltaLabel = computed(() => {
    const current = this.report()?.totalAppointments ?? 0;
    const previous = this.previousReport()?.totalAppointments ?? 0;
    if (!previous) {
      return '—';
    }
    const delta = Math.round(((current - previous) / previous) * 100);
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta}% vs periodo anterior`;
  });

  protected readonly attendanceRate = computed(() =>
    this.rate(this.report()?.attended, this.report()?.totalAppointments),
  );

  protected readonly noShowRate = computed(() =>
    this.rate(this.report()?.noShows, this.report()?.totalAppointments),
  );

  protected readonly cancellationRate = computed(() =>
    this.rate(this.report()?.cancelled, this.report()?.totalAppointments),
  );

  protected readonly weeklyPoints = computed(() => this.buildWeeklyPoints(this.filteredAppointments()));

  protected readonly breakdownRows = computed(() => {
    const cfg = this.config();
    if (cfg?.dimension === 'doctor') {
      return this.buildDoctorBreakdown(this.filteredAppointments());
    }
    return this.buildSpecialtyBreakdown(this.filteredAppointments());
  });

  protected readonly breakdownTitle = computed(() =>
    this.config()?.dimension === 'doctor' ? 'Por médico' : 'Por especialidad',
  );

  protected showMetric(id: string): boolean {
    const metrics = this.config()?.selectedMetrics ?? ['total', 'attended', 'noShows', 'cancelled'];
    return metrics.includes(id);
  }

  ngOnInit(): void {
    const saved = loadAttendanceReportConfig();
    if (!saved) {
      void this.router.navigate(['/admin/reportes/asistencia']);
      return;
    }
    this.config.set(saved);

    if (!this.store.appointments().length && !this.store.loading()) {
      this.store.refreshCore();
    }

    this.loadReport(saved);
  }

  protected exportPdf(): void {
    this.uiMessage.set('La exportación PDF estará disponible próximamente.');
  }

  protected exportExcel(): void {
    this.uiMessage.set('La exportación Excel estará disponible próximamente.');
  }

  protected backToConfig(): void {
    void this.router.navigate(['/admin/reportes/asistencia']);
  }

  protected backToReports(): void {
    void this.router.navigate(['/admin/reportes']);
  }

  private loadReport(cfg: AttendanceReportConfig): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const previous = this.previousRange(cfg.reportFrom, cfg.reportTo);

    this.institutionService.getReports(cfg.reportFrom, cfg.reportTo).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loadAiInsight(cfg.reportFrom, cfg.reportTo);
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
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo cargar el reporte.'));
      },
    });
  }

  private loadAiInsight(from: string, to: string): void {
    this.aiLoading.set(true);
    this.aiError.set('');
    this.aiResumen.set('');
    this.aiRecomendacion.set('');
    this.aiService.institutionReport(from, to).subscribe({
      next: (res) => {
        this.aiResumen.set(res.insight.resumen);
        this.aiRecomendacion.set(res.insight.recomendacion);
        this.aiLoading.set(false);
      },
      error: (error) => {
        this.aiError.set(apiErrorMessage(error, 'No se pudo generar el resumen IA.'));
        this.aiLoading.set(false);
      },
    });
  }

  private filterAppointments(
    cfg: AttendanceReportConfig | null,
    appointments: Appointment[],
  ): Appointment[] {
    if (!cfg) {
      return [];
    }
    const from = new Date(`${cfg.reportFrom}T00:00:00`).getTime();
    const to = new Date(`${cfg.reportTo}T23:59:59`).getTime();

    return appointments.filter((appointment) => {
      const time = this.appointmentTime(appointment);
      if (time === null || time < from || time > to) {
        return false;
      }
      if (cfg.specialtyFilter === 'Todas') {
        return true;
      }
      const specialty =
        appointment.specialty ??
        appointment.doctor?.specialty ??
        this.store.getDoctorById(appointment.doctorId ?? -1)?.specialty;
      return specialty === cfg.specialtyFilter;
    });
  }

  private buildWeeklyPoints(appointments: Appointment[]): WeeklyPoint[] {
    if (!appointments.length) {
      return [
        { label: 'Sem 1', attendanceRate: 0 },
        { label: 'Sem 2', attendanceRate: 0 },
        { label: 'Sem 3', attendanceRate: 0 },
        { label: 'Sem 4', attendanceRate: 0 },
      ];
    }

    const buckets = [0, 0, 0, 0];
    const attended = [0, 0, 0, 0];
    for (const appointment of appointments) {
      const time = this.appointmentTime(appointment);
      if (time === null) {
        continue;
      }
      const day = new Date(time).getDate();
      const index = Math.min(Math.floor((day - 1) / 7), 3);
      buckets[index] += 1;
      if (appointment.status === 'COMPLETED') {
        attended[index] += 1;
      }
    }

    return buckets.map((total, index) => ({
      label: `Sem ${index + 1}`,
      attendanceRate: total ? Math.round((attended[index] / total) * 100) : 0,
    }));
  }

  private buildSpecialtyBreakdown(appointments: Appointment[]): BreakdownRow[] {
    return this.buildBreakdown(appointments, (appointment) => {
      return (
        appointment.specialty ??
        appointment.doctor?.specialty ??
        this.store.getDoctorById(appointment.doctorId ?? -1)?.specialty ??
        'Sin especialidad'
      );
    });
  }

  private buildDoctorBreakdown(appointments: Appointment[]): BreakdownRow[] {
    return this.buildBreakdown(appointments, (appointment) => {
      const doctor = this.store.getDoctorById(appointment.doctorId ?? -1);
      if (doctor) {
        return `Dr(a). ${doctor.firstName} ${doctor.lastName}`.trim();
      }
      const fallback =
        [appointment.doctorFirstName, appointment.doctorLastName].filter(Boolean).join(' ') ||
        'Sin médico';
      return appointment.doctorName ?? appointment.doctorFullName ?? fallback;
    });
  }

  private buildBreakdown(
    appointments: Appointment[],
    labelFor: (appointment: Appointment) => string,
  ): BreakdownRow[] {
    const groups = new Map<string, { total: number; attended: number; noShows: number }>();

    for (const appointment of appointments) {
      const label = labelFor(appointment);
      const current = groups.get(label) ?? { total: 0, attended: 0, noShows: 0 };
      current.total += 1;
      if (appointment.status === 'COMPLETED') {
        current.attended += 1;
      }
      if (appointment.status === 'NO_SHOW') {
        current.noShows += 1;
      }
      groups.set(label, current);
    }

    if (!groups.size) {
      return [];
    }

    return [...groups.entries()]
      .map(([label, stats]) => ({
        label,
        attendanceRate: stats.total ? Math.round((stats.attended / stats.total) * 1000) / 10 : 0,
        noShowRate: stats.total ? Math.round((stats.noShows / stats.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);
  }

  private previousRange(from: string, to: string): { from: string; to: string } {
    const start = new Date(`${from}T12:00:00`);
    const end = new Date(`${to}T12:00:00`);
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return {
      from: prevStart.toISOString().slice(0, 10),
      to: prevEnd.toISOString().slice(0, 10),
    };
  }

  private rate(part: number | undefined, total: number | undefined): number {
    if (!total || part === undefined) {
      return 0;
    }
    return Math.round((part / total) * 1000) / 10;
  }

  private appointmentTime(appointment: Appointment): number | null {
    const raw = appointment.appointmentDate ?? appointment.date ?? appointment.scheduledAt;
    if (!raw) {
      return null;
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
}
