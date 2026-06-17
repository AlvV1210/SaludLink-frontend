import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import {
  MedicationIntake,
  MedicationIntakeRequest,
} from '../models/medication-intake.model';

@Injectable({
  providedIn: 'root',
})
export class MedicationIntakeService {
  private readonly http = inject(HttpClient);

  list(medicationId: number): Observable<MedicationIntake[]> {
    return this.http.get<MedicationIntake[]>(
      `${API_BASE_URL}/medications/${medicationId}/intakes`
    );
  }

  record(
    medicationId: number,
    body: MedicationIntakeRequest = {}
  ): Observable<MedicationIntake> {
    return this.http.post<MedicationIntake>(
      `${API_BASE_URL}/medications/${medicationId}/intakes`,
      body
    );
  }
}