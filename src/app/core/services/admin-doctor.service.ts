import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { Doctor } from '../models/doctor.model';

export interface AdminDoctorCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  specialty: string;
  licenseNumber: string;
  branchId: number;
  biography?: string;
  consultationFee?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDoctorService {
  private readonly http = inject(HttpClient);
  private readonly adminDoctorsApiUrl = `${API_BASE_URL}/admin/doctors`;

  listMyDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.adminDoctorsApiUrl);
  }

  createDoctor(body: AdminDoctorCreateRequest): Observable<Doctor> {
    return this.http.post<Doctor>(this.adminDoctorsApiUrl, body);
  }
}