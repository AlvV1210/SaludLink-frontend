import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MedicationIntake,
  MedicationIntakeRequest,
} from '../../shared/models/medication-intake.model';

@Injectable({ providedIn: 'root' })
export class MedicationIntakeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/medications`;

  list(medicationId: number): Observable<MedicationIntake[]> {
    return this.http.get<MedicationIntake[]>(`${this.base}/${medicationId}/intakes`);
  }

  create(medicationId: number, body: MedicationIntakeRequest): Observable<MedicationIntake> {
    return this.http.post<MedicationIntake>(`${this.base}/${medicationId}/intakes`, body);
  }
}
