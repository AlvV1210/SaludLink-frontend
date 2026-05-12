export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export const AppointmentModality = {
  inPerson: 'PRESENCIAL',
  virtual: 'VIRTUAL',
} as const;

export type AppointmentModalityValue =
  (typeof AppointmentModality)[keyof typeof AppointmentModality];

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

export interface Appointment {
  id: number;
  doctorName: string;
  specialty: string;
  appointmentDate: string;
  modality: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface AppointmentRequest {
  doctorId: number;
  appointmentDate: string;
  modality: string;
  notes?: string;
}
