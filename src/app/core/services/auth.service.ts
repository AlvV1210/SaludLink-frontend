import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../constants/storage-keys';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { UserRole } from '../models/user.model';
import { AppointmentService } from './appointment.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly appointments = inject(AppointmentService);

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, body)
      .pipe(tap((res) => this.persistAuth(res)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, body)
      .pipe(tap((res) => this.persistAuth(res)));
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.appointments.resetDemoPatientAppointmentsCache();
  }

  /**
   * Sesión local para desarrollo / demo cuando el backend no está disponible.
   * Permite entrar a la app sin llamar a la API.
   */
  enterDemoSession(role: UserRole = 'PATIENT'): void {
    this.appointments.resetDemoPatientAppointmentsCache();

    const demo: AuthResponse = {
      token: 'demo-local-token',
      email: 'demo@saludlink.local',
      role,
      firstName: 'Usuario',
      lastName: 'Demo',
    };

    this.persistAuth(demo);
  }

  getDefaultRouteByRole(): string {
    const role = this.getCurrentUser()?.role;

    if (role === 'DOCTOR') {
      return '/medico/dashboard';
    }

    if (role === 'ADMIN') {
      return '/admin/dashboard';
    }

    return '/paciente/dashboard';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  getCurrentUser(): AuthResponse | null {
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

  private persistAuth(response: AuthResponse): void {
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response));
  }
}