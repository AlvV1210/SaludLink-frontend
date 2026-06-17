import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import { Medication, MedicationRequest } from '../models/medication.model';
import { PatientService } from './patient.service';

@Injectable({
  providedIn: 'root',
})
export class MedicationService {
  private readonly http = inject(HttpClient);
  private readonly patientService = inject(PatientService);

  private readonly medicationApiUrl = `${API_BASE_URL}/medications`;

  getMedicationsByPatient(patientId?: number): Observable<Medication[]> {
    if (patientId) {
      return this.http.get<Medication[]>(`${this.medicationApiUrl}/patient/${patientId}`);
    }

    return this.patientService.getMyProfile().pipe(
      map((profile) => profile.id ?? profile.patientId),
      switchMap((id) => {
        if (!id) {
          return throwError(() => new Error('No se encontró el ID del paciente.'));
        }

        return this.http.get<Medication[]>(`${this.medicationApiUrl}/patient/${id}`);
      })
    );
  }

  addMedication(body: MedicationRequest, patientId?: number): Observable<Medication> {
    if (patientId) {
      return this.http.post<Medication>(`${this.medicationApiUrl}/${patientId}`, body);
    }

    return this.patientService.getMyProfile().pipe(
      map((profile) => profile.id ?? profile.patientId),
      switchMap((id) => {
        if (!id) {
          return throwError(() => new Error('No se encontró el ID del paciente.'));
        }

        return this.http.post<Medication>(`${this.medicationApiUrl}/${id}`, body);
      })
    );
  }

  deactivateMedication(id: number): Observable<Medication> {
    return this.http.put<Medication>(`${this.medicationApiUrl}/${id}/deactivate`, {});
  }
}