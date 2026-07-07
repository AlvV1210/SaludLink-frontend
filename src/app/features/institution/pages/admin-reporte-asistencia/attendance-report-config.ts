export interface AttendanceReportConfig {
  reportFrom: string;
  reportTo: string;
  dimension: 'doctor' | 'specialty';
  specialtyFilter: string;
  selectedMetrics: string[];
}

export const ATTENDANCE_REPORT_CONFIG_KEY = 'sl-admin-attendance-report-config';

export function saveAttendanceReportConfig(config: AttendanceReportConfig): void {
  sessionStorage.setItem(ATTENDANCE_REPORT_CONFIG_KEY, JSON.stringify(config));
}

export function loadAttendanceReportConfig(): AttendanceReportConfig | null {
  const raw = sessionStorage.getItem(ATTENDANCE_REPORT_CONFIG_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AttendanceReportConfig;
  } catch {
    return null;
  }
}
