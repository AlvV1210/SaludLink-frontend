import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AffiliatedDoctorRequest,
  InstitutionBillingResponse,
  InstitutionDashboardResponse,
  InstitutionReportResponse,
  InstitutionResponse,
  RegisterInstitutionRequest,
} from '../../shared/models/institution.model';
import { Doctor } from '../../shared/models/doctor.model';
import { AuthResponse } from '../../shared/models/auth.model';

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/institutions`;

  register(body: RegisterInstitutionRequest): Observable<InstitutionResponse> {
    return this.http.post<InstitutionResponse>(`${this.base}/register`, body);
  }

  getProfile(): Observable<InstitutionResponse> {
    return this.http.get<InstitutionResponse>(`${this.base}/me`);
  }

  getBilling(): Observable<InstitutionBillingResponse> {
    return this.http.get<InstitutionBillingResponse>(`${this.base}/me/billing`);
  }

  registerAndLogin(body: RegisterInstitutionRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
      email: body.adminEmail,
      password: body.adminPassword,
    });
  }

  getDashboard(): Observable<InstitutionDashboardResponse> {
    return this.http.get<InstitutionDashboardResponse>(`${this.base}/me/dashboard`);
  }

  getReports(from: string, to: string): Observable<InstitutionReportResponse> {
    return this.http.get<InstitutionReportResponse>(`${this.base}/me/reports`, {
      params: { from, to },
    });
  }

  listDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.base}/me/doctors`);
  }

  addDoctor(body: AffiliatedDoctorRequest): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.base}/me/doctors`, body);
  }
}
