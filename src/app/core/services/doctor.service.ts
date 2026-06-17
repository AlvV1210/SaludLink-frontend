import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { Doctor } from '../models/doctor.model';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly doctorApiUrl = `${API_BASE_URL}/doctors`;

  listVerified(): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(this.doctorApiUrl)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  getAll(): Observable<Doctor[]> {
    return this.listVerified();
  }

  getBySpecialty(specialty: string): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(`${this.doctorApiUrl}/specialty/${encodeURIComponent(specialty)}`)
      .pipe(map((doctors) => doctors.map((doctor) => this.normalizeDoctor(doctor))));
  }

  getById(id: number): Observable<Doctor> {
    return this.http
      .get<Doctor>(`${this.doctorApiUrl}/${id}`)
      .pipe(map((doctor) => this.normalizeDoctor(doctor)));
  }

  private normalizeDoctor(doctor: Doctor): Doctor {
    const fullName =
      doctor.name ||
      `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() ||
      `Doctor ${doctor.id}`;

    return {
      ...doctor,
      name: fullName,
    };
  }
}
