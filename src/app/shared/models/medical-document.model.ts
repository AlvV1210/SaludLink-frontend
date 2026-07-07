export interface MedicalDocumentRequest {
  title?: string;
  fileName?: string;
  description?: string;
  documentType?: string;
  fileUrl?: string;
}

export interface MedicalDocument {
  id: number;
  title?: string;
  fileName?: string;
  description?: string;
  documentType?: string;
  fileUrl?: string;
  uploadedAt?: string;
}