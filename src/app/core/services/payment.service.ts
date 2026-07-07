import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PaymentResponse, ProcessPaymentRequest } from '../../shared/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/payments`;

  payAppointment(
    appointmentId: number,
    body: ProcessPaymentRequest,
  ): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(
      `${this.base}/appointments/${appointmentId}`,
      body,
    );
  }

  getByAppointment(appointmentId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.base}/appointments/${appointmentId}`);
  }
}
