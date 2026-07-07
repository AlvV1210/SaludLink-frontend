import { Doctor } from './doctor.model';

export type { Doctor };

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum AppointmentModality {
  IN_PERSON = 'IN_PERSON',
  TELEMEDICINE = 'TELEMEDICINE',
  inPerson = 'IN_PERSON',
  presencial = 'IN_PERSON',
  virtual = 'TELEMEDICINE',
}

export interface Appointment {
  id: number;
  patientId?: number;
  patientName?: string;
  doctorId?: number;
  doctorName?: string;
  doctorFullName?: string;
  doctorFirstName?: string;
  doctorLastName?: string;
  doctor?: Doctor;
  specialty?: string;
  date?: string;
  time?: string;
  appointmentDate?: string;
  scheduledAt?: string;
  modality: AppointmentModality | string;
  status: AppointmentStatus | string;
  reason?: string;
  notes?: string;
  meetingUrl?: string;
}

export interface AppointmentRequest {
  doctorId: number;
  appointmentDate: string;
  modality: AppointmentModality | string;
  notes?: string;
}

export interface RescheduleAppointmentRequest {
  appointmentDate: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus | string;
  notes?: string;
}
