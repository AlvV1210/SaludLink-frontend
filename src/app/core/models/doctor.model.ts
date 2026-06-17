export interface Doctor {
  id: number;

  userId?: number;

  firstName: string;
  lastName: string;
  email: string;

  // Compatibilidad con pantallas antiguas que usan doctor.name
  name?: string;

  specialty: string;
  licenseNumber: string;
  verified: boolean;
  biography?: string;
  consultationFee?: number;

  clinicId?: number;
  clinicName?: string;

  branchId?: number;
  branchName?: string;
  branchAddress?: string;
}