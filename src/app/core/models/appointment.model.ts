import { Doctor } from './doctor.model';

export type { Doctor };

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum AppointmentModality {
  inPerson = 'PRESENTIAL',
  presencial = 'PRESENTIAL',
  virtual = 'VIRTUAL',
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

  clinicId?: number;
  clinicName?: string;

  branchId?: number;
  branchName?: string;
  branchAddress?: string;

  date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  appointmentDate?: string;
  scheduledAt?: string;

  modality: AppointmentModality;
  status: AppointmentStatus;

  reason?: string;
  notes?: string;
  meetingUrl?: string;
  location?: string;
}

export interface AppointmentRequest {
  doctorId: number;
  appointmentDate: string;
  modality: AppointmentModality | string;
  notes?: string;
}
