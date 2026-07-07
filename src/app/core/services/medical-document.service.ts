import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  MedicalDocument,
  MedicalDocumentRequest,
} from '../../shared/models/medical-document.model';

@Injectable({ providedIn: 'root' })
export class MedicalDocumentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/medical-documents`;

  listMine(): Observable<MedicalDocument[]> {
    return this.http.get<MedicalDocument[]>(this.base);
  }

  create(body: MedicalDocumentRequest): Observable<MedicalDocument> {
    return this.http.post<MedicalDocument>(this.base, body);
  }

  deleteMine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
