export interface Medication {
  id: number;
  patientId?: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  instructions?: string;
  active?: boolean;
}

export interface MedicationRequest {
  name: string;
  dosage: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  instructions?: string;
}