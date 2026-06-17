import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';
import {
  MedicalDocument,
  MedicalDocumentRequest,
} from '../models/medical-document.model';

@Injectable({
  providedIn: 'root',
})
export class MedicalDocumentService {
  private readonly http = inject(HttpClient);
  private readonly documentApiUrl = `${API_BASE_URL}/medical-documents`;

  listMine(): Observable<MedicalDocument[]> {
    return this.http.get<MedicalDocument[]>(this.documentApiUrl);
  }

  create(body: MedicalDocumentRequest): Observable<MedicalDocument> {
    return this.http.post<MedicalDocument>(this.documentApiUrl, body);
  }

  deleteMine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.documentApiUrl}/${id}`);
  }
}