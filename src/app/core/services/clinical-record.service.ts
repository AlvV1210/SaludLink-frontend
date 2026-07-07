import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ExportClinicalRecordRequest,
  ExportClinicalRecordResponse,
} from '../../shared/models/clinical-record.model';

@Injectable({ providedIn: 'root' })
export class ClinicalRecordService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/medical-records`;

  export(body: ExportClinicalRecordRequest): Observable<ExportClinicalRecordResponse> {
    return this.http.post<ExportClinicalRecordResponse>(`${this.base}/export`, body);
  }

  downloadUrl(accessCode: string): string {
    return `${environment.apiUrl}/medical-records/export/${accessCode}/download`;
  }
}
