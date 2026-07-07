export interface MedicationIntakeRequest {
  takenAt?: string;
  notes?: string;
}

export interface MedicationIntake {
  id: number;
  medicationId?: number;
  takenAt?: string;
  notes?: string;
}