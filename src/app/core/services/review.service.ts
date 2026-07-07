import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateReviewRequest, ReviewResponse } from '../../shared/models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reviews`;

  create(body: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.base, body);
  }

  listByDoctor(doctorId: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(
      `${environment.apiUrl}/doctors/${doctorId}/reviews`,
    );
  }
}
