import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ConsultationMessage,
  EmergencyContact,
  SendConsultationMessageRequest,
  TeleconsultJoinResponse,
} from '../../shared/models/telemedicine.model';

export type ChatMessageResponse = ConsultationMessage;

@Injectable({ providedIn: 'root' })
export class TelemedicineService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/telemedicine`;

  joinSession(appointmentId: number): Observable<TeleconsultJoinResponse> {
    return this.http.post<TeleconsultJoinResponse>(
      `${this.base}/appointments/${appointmentId}/join`,
      {},
    );
  }

  getMessages(appointmentId: number): Observable<ConsultationMessage[]> {
    return this.http.get<ConsultationMessage[]>(
      `${this.base}/appointments/${appointmentId}/messages`,
    );
  }

  sendMessage(
    appointmentId: number,
    message: string,
  ): Observable<ConsultationMessage> {
    const body: SendConsultationMessageRequest = { message };
    return this.http.post<ConsultationMessage>(
      `${this.base}/appointments/${appointmentId}/messages`,
      body,
    );
  }
}

@Injectable({ providedIn: 'root' })
export class EmergencyService {
  private readonly http = inject(HttpClient);

  getContacts(): Observable<EmergencyContact[]> {
    return this.http.get<EmergencyContact[]>(`${environment.apiUrl}/emergency/contacts`);
  }
}

/** @deprecated Use TelemedicineService */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly telemedicine = inject(TelemedicineService);

  getMessagesByAppointment(appointmentId: number): Observable<ChatMessageResponse[]> {
    return this.telemedicine.getMessages(appointmentId);
  }

  sendMessage(appointmentId: number, message: string): Observable<ChatMessageResponse> {
    return this.telemedicine.sendMessage(appointmentId, message);
  }
}
