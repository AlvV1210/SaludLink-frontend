import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Medication, MedicationRequest } from '../../shared/models/medication.model';
import { PatientService } from './patient.service';

export interface MedicationReminder {
  id: number;
  medicationId: number;
  scheduledTime: string;
  reminderDate: string;
  taken: boolean;
  takenAt?: string;
  status?: string;
}

export interface CreateMedicationReminderRequest {
  scheduledTime: string;
  reminderDate: string;
}

@Injectable({ providedIn: 'root' })
export class MedicationService {
  private readonly http = inject(HttpClient);
  private readonly patientService = inject(PatientService);
  private readonly base = `${environment.apiUrl}/medications`;

  getMedicationsByPatient(patientId?: number): Observable<Medication[]> {
    const load = (id: number) =>
      this.http.get<Medication[]>(`${this.base}/patient/${id}`);

    if (patientId) {
      return load(patientId);
    }

    return this.patientService.getMyProfile().pipe(
      map((profile) => profile.id ?? profile.patientId),
      switchMap((id) => {
        if (!id) {
          return throwError(() => new Error('No se encontró el ID del paciente.'));
        }
        return load(id);
      }),
    );
  }

  addMedication(body: MedicationRequest, patientId?: number): Observable<Medication> {
    const create = (id: number) => this.http.post<Medication>(`${this.base}/${id}`, body);

    if (patientId) {
      return create(patientId);
    }

    return this.patientService.getMyProfile().pipe(
      map((profile) => profile.id ?? profile.patientId),
      switchMap((id) => {
        if (!id) {
          return throwError(() => new Error('No se encontró el ID del paciente.'));
        }
        return create(id);
      }),
    );
  }

  deactivateMedication(id: number): Observable<Medication> {
    return this.http.put<Medication>(`${this.base}/${id}/deactivate`, {});
  }

  getReminders(medicationId: number): Observable<MedicationReminder[]> {
    return this.http.get<MedicationReminder[]>(`${this.base}/${medicationId}/reminders`);
  }

  createReminder(
    medicationId: number,
    body: CreateMedicationReminderRequest,
  ): Observable<MedicationReminder> {
    return this.http.post<MedicationReminder>(`${this.base}/${medicationId}/reminders`, body);
  }

  markReminderTaken(reminderId: number): Observable<MedicationReminder> {
    return this.http.patch<MedicationReminder>(
      `${environment.apiUrl}/medication-reminders/${reminderId}/taken`,
      {},
    );
  }
}
