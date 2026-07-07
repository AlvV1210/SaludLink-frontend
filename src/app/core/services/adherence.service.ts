import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdherenceDashboardResponse } from '../../shared/models/adherence.model';

@Injectable({ providedIn: 'root' })
export class AdherenceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/adherence`;

  getPatientAdherence(patientId: number): Observable<AdherenceDashboardResponse> {
    return this.http.get<AdherenceDashboardResponse>(`${this.base}/patients/${patientId}`);
  }
}
