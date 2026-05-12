import { UserRole } from './user.model';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}
