export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
}
