import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateDependentRequest, Dependent } from '../../shared/models/dependent.model';

@Injectable({ providedIn: 'root' })
export class DependentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/patients/me/dependents`;

  list(): Observable<Dependent[]> {
    return this.http.get<Dependent[]>(this.base);
  }

  create(body: CreateDependentRequest): Observable<Dependent> {
    return this.http.post<Dependent>(this.base, body);
  }

  getById(id: number): Observable<Dependent> {
    return this.http.get<Dependent>(`${this.base}/${id}`);
  }

  deactivate(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/deactivate`, {});
  }
}
