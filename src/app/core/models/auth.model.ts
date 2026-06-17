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

  // Datos para clínica / institución
  businessName?: string;
  establishmentType?: string;
  ruc?: string;
  address?: string;
  branchesSummary?: string;

  // Datos para médico
  clinicId?: number;
  branchId?: number;
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

export interface ApiErrorResponse {
  message: string;
}