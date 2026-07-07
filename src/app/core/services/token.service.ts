import { Injectable } from '@angular/core';

import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../constants/storage-keys';
import { AuthResponse } from '../../shared/models/auth.model';
import { UserRole } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class TokenService {
  get accessToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  get role(): UserRole | null {
    return this.getUser()?.role ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  save(response: AuthResponse): void {
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response));
  }

  getUser(): AuthResponse | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}
