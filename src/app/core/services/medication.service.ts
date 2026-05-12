import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Medication, MedicationRequest } from '../models/medication.model';

const MEDICATIONS_BASE_URL = 'http://localhost:8080/api/medications';

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly http = inject(HttpClient);

  getMedicationsByPatient(): Observable<Medication[]> {
    return this.http.get<Medication[]>(MEDICATIONS_BASE_URL);
  }

  addMedication(body: MedicationRequest): Observable<Medication> {
    return this.http.post<Medication>(MEDICATIONS_BASE_URL, body);
  }

  deactivateMedication(id: number): Observable<Medication> {
    return this.http.patch<Medication>(
      `${MEDICATIONS_BASE_URL}/${id}/deactivate`,
      {},
    );
  }
}
