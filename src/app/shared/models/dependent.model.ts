export interface Dependent {
  id: number;
  firstName: string;
  lastName: string;
  birthDate?: string;
  relationship?: string;
  active: boolean;
}

export interface CreateDependentRequest {
  firstName: string;
  lastName: string;
  birthDate?: string;
  relationship?: string;
}
