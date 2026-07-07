import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Doctor } from '../../shared/models/doctor.model';

export interface DoctorAvailability {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  blocked: boolean;
}

export interface DoctorAvailabilityRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  blocked: boolean;
}

export interface SubmitCredentialsRequest {
  licenseDocumentUrl: string;
  specialty?: string;
  licenseNumber?: string;
  consultationFee?: number;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/doctors`;

  listVerified(): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(this.base)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  getAll(): Observable<Doctor[]> {
    return this.listVerified();
  }

  getBySpecialty(specialty: string): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(`${this.base}/specialty/${encodeURIComponent(specialty)}`)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  getById(id: number): Observable<Doctor> {
    return this.http
      .get<Doctor>(`${this.base}/${id}`)
      .pipe(map((doctor) => this.normalizeDoctor(doctor)));
  }

  submitCredentials(body: SubmitCredentialsRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/me/credentials`, body);
  }

  getMyAvailability(): Observable<DoctorAvailability[]> {
    return this.http.get<DoctorAvailability[]>(`${this.base}/me/availability`);
  }

  setAvailability(body: DoctorAvailabilityRequest): Observable<DoctorAvailability> {
    return this.http.post<DoctorAvailability>(`${this.base}/me/availability`, body);
  }

  private normalizeDoctor(doctor: Doctor): Doctor {
    const fullName =
      doctor.name ||
      `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() ||
      `Doctor ${doctor.id}`;
    return { ...doctor, name: fullName };
  }
}
