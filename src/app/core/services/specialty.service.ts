import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class SpecialtyService {
  private readonly http = inject(HttpClient);
  private readonly specialtyApiUrl = `${API_BASE_URL}/specialties`;

  list(): Observable<string[]> {
    return this.http.get<string[]>(this.specialtyApiUrl);
  }

  getAll(): Observable<string[]> {
    return this.list();
  }
}