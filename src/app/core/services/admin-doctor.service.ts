import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Doctor } from '../../shared/models/doctor.model';
import { AffiliatedDoctorRequest, LinkAffiliatedDoctorRequest } from '../../shared/models/institution.model';

@Injectable({ providedIn: 'root' })
export class AdminDoctorService {
  private readonly http = inject(HttpClient);
  private readonly institutionBase = `${environment.apiUrl}/institutions/me/doctors`;
  private readonly platformBase = `${environment.apiUrl}/admin/doctors`;

  listMyDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.institutionBase);
  }

  createDoctor(body: AffiliatedDoctorRequest): Observable<Doctor> {
    return this.http.post<Doctor>(this.institutionBase, body);
  }

  linkExistingDoctor(body: LinkAffiliatedDoctorRequest): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.institutionBase}/link`, body);
  }

  createPlatformDoctor(body: AffiliatedDoctorRequest): Observable<Doctor> {
    return this.http.post<Doctor>(this.platformBase, body);
  }
}
