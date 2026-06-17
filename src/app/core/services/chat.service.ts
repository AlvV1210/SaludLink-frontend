import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../constants/api.constants';

export interface ChatMessageResponse {
  id: number;
  appointmentId: number;
  senderUserId: number;
  senderName: string;
  senderRole: 'PATIENT' | 'DOCTOR' | 'ADMIN' | string;
  message: string;
  sentAt: string;
}

export interface ChatMessageRequest {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly chatApiUrl = `${API_BASE_URL}/chat`;

  getMessagesByAppointment(appointmentId: number): Observable<ChatMessageResponse[]> {
    return this.http.get<ChatMessageResponse[]>(
      `${this.chatApiUrl}/appointments/${appointmentId}/messages`
    );
  }

  sendMessage(appointmentId: number, message: string): Observable<ChatMessageResponse> {
    const body: ChatMessageRequest = {
      message,
    };

    return this.http.post<ChatMessageResponse>(
      `${this.chatApiUrl}/appointments/${appointmentId}/messages`,
      body
    );
  }
}
