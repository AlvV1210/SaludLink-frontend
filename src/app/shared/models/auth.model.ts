import { UserRole } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  specialty?: string;
  licenseNumber?: string;
  biography?: string;
  consultationFee?: number;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthMeResponse {
  userId: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  patientId?: number;
  doctorId?: number;
  institutionId?: number;
}

export interface ApiErrorResponse {
  message: string;
}
