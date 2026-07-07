export interface ExportClinicalRecordRequest {
  fromDate: string;
  toDate: string;
}

export interface ExportClinicalRecordResponse {
  accessCode: string;
  expiresAt: string;
  downloadPath: string;
}
