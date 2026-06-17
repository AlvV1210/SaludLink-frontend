import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { Clinic, ClinicBranch, ClinicBranchRequest } from '../models/clinic.model';

@Injectable({ providedIn: 'root' })
export class ClinicService {
  private readonly http = inject(HttpClient);
  private readonly clinicApiUrl = `${API_BASE_URL}/clinics`;

  listClinics(): Observable<Clinic[]> {
    return this.http.get<Clinic[]>(this.clinicApiUrl);
  }

  getMyClinic(): Observable<Clinic> {
    return this.http.get<Clinic>(`${this.clinicApiUrl}/me`);
  }

  getBranchesByClinic(clinicId: number): Observable<ClinicBranch[]> {
    return this.http.get<ClinicBranch[]>(
      `${this.clinicApiUrl}/${clinicId}/branches`
    );
  }

  getMyBranches(): Observable<ClinicBranch[]> {
    return this.http.get<ClinicBranch[]>(`${this.clinicApiUrl}/me/branches`);
  }

  createMyBranch(body: ClinicBranchRequest): Observable<ClinicBranch> {
    return this.http.post<ClinicBranch>(`${this.clinicApiUrl}/me/branches`, body);
  }
}