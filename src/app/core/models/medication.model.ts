export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface MedicationRequest {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
}
