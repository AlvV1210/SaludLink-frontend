export interface Clinic {
  id: number;
  businessName: string;
  establishmentType?: string;
  ruc: string;
  address: string;
  phone?: string;
  branchesSummary?: string;
  active: boolean;
}

export interface ClinicBranch {
  id: number;
  clinicId: number;
  clinicName: string;
  name: string;
  address: string;
  ruc?: string;
  active: boolean;
}

export interface ClinicBranchRequest {
  name: string;
  address: string;
  ruc?: string;
}