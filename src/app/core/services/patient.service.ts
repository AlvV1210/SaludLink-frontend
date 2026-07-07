import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  NotificationPreferences,
  NotificationPreferencesRequest,
  PatientProfile,
  PatientProfileUpdate,
} from '../../shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/patients`;

  getMyProfile(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${this.base}/me/profile`);
  }

  updateMyProfile(body: PatientProfileUpdate): Observable<PatientProfile> {
    return this.http.put<PatientProfile>(`${this.base}/me/profile`, body);
  }

  updateNotificationPreferences(
    body: NotificationPreferencesRequest,
  ): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(
      `${this.base}/me/notification-preferences`,
      body,
    );
  }
}
