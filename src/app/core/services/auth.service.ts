import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthMeResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../../shared/models/auth.model';
import { UserRole } from '../../shared/models/user.model';
import { AppointmentService } from './appointment.service';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly appointments = inject(AppointmentService);

  isLoggedIn = signal(this.tokens.isLoggedIn);

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, body)
      .pipe(tap((res) => this.persistAuth(res)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, body)
      .pipe(tap((res) => this.persistAuth(res)));
  }

  getMe(): Observable<AuthMeResponse> {
    return this.http.get<AuthMeResponse>(`${environment.apiUrl}/auth/me`);
  }

  logout(): void {
    this.tokens.clear();
    this.isLoggedIn.set(false);
    this.appointments.resetDemoPatientAppointmentsCache();
  }

  enterDemoSession(role: UserRole = 'PATIENT'): void {
    if (environment.production) {
      return;
    }
    this.appointments.resetDemoPatientAppointmentsCache();
    this.persistAuth({
      token: 'demo-local-token',
      email: 'demo@saludlink.local',
      role,
      firstName: 'Usuario',
      lastName: 'Demo',
    });
  }

  getDefaultRouteByRole(): string {
    const role = this.getCurrentUser()?.role;
    if (role === 'DOCTOR') {
      return '/medico/dashboard';
    }
    if (role === 'INSTITUTION_ADMIN' || role === 'ADMIN') {
      return '/admin/dashboard';
    }
    return '/paciente/dashboard';
  }

  isAuthenticated(): boolean {
    return this.tokens.isLoggedIn;
  }

  isLoggedInFn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return this.tokens.accessToken;
  }

  getCurrentUser(): AuthResponse | null {
    return this.tokens.getUser();
  }

  updateStoredEmail(email: string): void {
    const user = this.getCurrentUser();
    if (user) {
      this.tokens.save({ ...user, email });
    }
  }

  private persistAuth(response: AuthResponse): void {
    this.tokens.save(response);
    this.isLoggedIn.set(true);
  }
}
