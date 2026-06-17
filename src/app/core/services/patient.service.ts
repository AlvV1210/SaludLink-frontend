import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { PatientProfile, PatientProfileUpdate } from '../models/patient.model';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly patientApiUrl = `${API_BASE_URL}/patients`;

  getMyProfile(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${this.patientApiUrl}/me/profile`);
  }

  updateMyProfile(body: PatientProfileUpdate): Observable<PatientProfile> {
    return this.http.put<PatientProfile>(`${this.patientApiUrl}/me/profile`, body);
  }
}