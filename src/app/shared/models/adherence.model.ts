export interface AdherenceDashboardResponse {
  patientId: number;
  patientName: string;
  adherencePercentage: number;
  status: 'GREEN' | 'RED' | string;
  remindersTaken: number;
  remindersTotal: number;
}
