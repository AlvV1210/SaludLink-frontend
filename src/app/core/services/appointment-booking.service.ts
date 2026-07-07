import { Injectable, inject, signal } from '@angular/core';

import { AppointmentModality } from '../../shared/models/appointment.model';
import { Doctor } from '../../shared/models/doctor.model';

export interface BookingDraft {
  doctor: Doctor | null;
  specialtyFilter: string;
  appointmentDate: string;
  modality: AppointmentModality;
  notes: string;
  appointmentId: number | null;
}

@Injectable({ providedIn: 'root' })
export class AppointmentBookingService {
  private readonly draft = signal<BookingDraft>(this.emptyDraft());

  readonly booking = this.draft.asReadonly();

  setDoctor(doctor: Doctor): void {
    this.draft.update((d) => ({ ...d, doctor }));
  }

  setSpecialtyFilter(specialty: string): void {
    this.draft.update((d) => ({ ...d, specialtyFilter: specialty }));
  }

  setSlot(appointmentDate: string, modality: AppointmentModality): void {
    this.draft.update((d) => ({ ...d, appointmentDate, modality }));
  }

  setNotes(notes: string): void {
    this.draft.update((d) => ({ ...d, notes }));
  }

  setAppointmentId(id: number): void {
    this.draft.update((d) => ({ ...d, appointmentId: id }));
  }

  reset(): void {
    this.draft.set(this.emptyDraft());
  }

  private emptyDraft(): BookingDraft {
    return {
      doctor: null,
      specialtyFilter: '',
      appointmentDate: '',
      modality: AppointmentModality.TELEMEDICINE,
      notes: '',
      appointmentId: null,
    };
  }
}
