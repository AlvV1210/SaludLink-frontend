import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpecialtyService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/specialties`;

  list(): Observable<string[]> {
    return this.http.get<string[]>(this.base);
  }
}
