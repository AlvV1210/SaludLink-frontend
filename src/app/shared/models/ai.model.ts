export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export interface SupportAnswer {
  reply: string;
  answeredFromDocs: boolean;
  sources: string[];
}

export interface IngestResult {
  chunksIngested: number;
}

export interface ReportInsight {
  resumen: string;
  recomendacion: string;
}

export interface InstitutionReportData {
  from: string;
  to: string;
  totalAppointments: number;
  attended: number;
  cancelled: number;
  noShows: number;
}

export interface ReportResponse {
  data: InstitutionReportData;
  insight: ReportInsight;
}

export interface AdherenceInsight {
  resumen: string;
  patronDetectado: string;
  sugerenciaSeguimiento: string;
}

export interface AdherenceDashboardData {
  patientId: number;
  adherencePercent: number;
  semaphore: string;
  takenReminders: number;
  totalReminders: number;
}

export interface AdherenceReportResponse {
  data: AdherenceDashboardData;
  insight: AdherenceInsight;
}

export interface WellnessInsight {
  resumen: string;
  areasDestacadas: string[];
  sugerenciaAutocuidado: string;
  disclaimer: string;
}

export interface WellnessScreeningData {
  id: number;
  score: number;
  level: string;
  recommendation: string;
  requiresReferral: boolean;
}

export interface WellnessReportResponse {
  data: WellnessScreeningData;
  insight: WellnessInsight;
}

export type AssistantMode = 'assistant' | 'support';

export type PatientAssistantTopic = 'appointment' | 'medication';
