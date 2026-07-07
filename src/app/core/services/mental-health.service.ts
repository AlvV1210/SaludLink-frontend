import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MentalHealthScreeningRequest,
  MentalHealthScreeningResponse,
} from '../../shared/models/mental-health.model';

@Injectable({ providedIn: 'root' })
export class MentalHealthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mental-health`;

  submitScreening(body: MentalHealthScreeningRequest): Observable<MentalHealthScreeningResponse> {
    return this.http.post<MentalHealthScreeningResponse>(`${this.base}/screenings`, body);
  }
}
