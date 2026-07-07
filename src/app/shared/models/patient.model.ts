export interface PatientProfile {
  id?: number;
  patientId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  documentNumber?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface PatientProfileUpdate {
  phone?: string;
  birthDate?: string;
  gender?: string;
  documentNumber?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface NotificationPreferences {
  alertSound?: string;
  alertFrequency?: string;
}

export interface NotificationPreferencesRequest {
  alertSound: string;
  alertFrequency: string;
}