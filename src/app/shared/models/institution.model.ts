import { Doctor } from './doctor.model';

export type EstablishmentType = 'CLINIC' | 'HOSPITAL' | 'MEDICAL_CENTER';

export interface InstitutionInvoiceResponse {
  concept: string;
  reference: string;
  amount: number;
  paidAt: string;
  status: 'Pagada' | 'Pendiente' | 'Fallida' | string;
}

export interface InstitutionBillingResponse {
  totalIncome: number;
  commission: number;
  pendingAmount: number;
  pendingInvoiceCount: number;
  invoices: InstitutionInvoiceResponse[];
}

export interface RegisterInstitutionRequest {
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string;
  name: string;
  ruc: string;
  address: string;
  establishmentType: EstablishmentType;
}

export interface InstitutionResponse {
  id: number;
  name: string;
  ruc: string;
  address: string;
  establishmentType: EstablishmentType;
  adminUserId?: number;
  createdAt?: string;
}

export interface InstitutionDashboardResponse {
  todayAppointments: number;
  medicalOccupancyRate: number;
  noShowAlerts: number;
  averageAdherencePercent: number;
}

export interface InstitutionReportResponse {
  from: string;
  to: string;
  totalAppointments: number;
  attended: number;
  cancelled: number;
  noShows: number;
}

export interface AffiliatedDoctorRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  specialty: string;
  licenseNumber: string;
  biography?: string;
}

export interface LinkAffiliatedDoctorRequest {
  doctorId: number;
}

export type { Doctor };
