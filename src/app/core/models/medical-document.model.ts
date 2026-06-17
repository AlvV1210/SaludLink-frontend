export interface MedicalDocumentRequest {
  title?: string;
  description?: string;
  documentType?: string;
  fileUrl?: string;
}

export interface MedicalDocument {
  id: number;
  title?: string;
  description?: string;
  documentType?: string;
  fileUrl?: string;
  uploadedAt?: string;
}