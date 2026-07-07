import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  InstitutionAdminStoreService,
  InstitutionPatientSummary,
} from '../../../../core/services/institution-admin-store.service';

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];

@Component({
  selector: 'app-admin-pacientes',
  imports: [FormsModule],
  templateUrl: './admin-pacientes.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-pacientes.scss'],
})
export class AdminPacientesComponent implements OnInit {
  protected readonly store = inject(InstitutionAdminStoreService);
  protected readonly query = signal('');

  protected readonly allPatients = computed(() => this.store.uniquePatients());

  protected readonly patients = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.allPatients();
    if (!q) {
      return list;
    }
    return list.filter(
      (patient) =>
        patient.name.toLowerCase().includes(q) ||
        patient.doctorName.toLowerCase().includes(q),
    );
  });

  protected readonly activeCount = computed(
    () => this.allPatients().filter((patient) => patient.statusLabel === 'Activa').length,
  );

  protected readonly totalCount = computed(() => this.allPatients().length);

  protected readonly newTodayCount = computed(() => {
    const start = this.startOfDay(Date.now());
    const end = start + 24 * 60 * 60 * 1000;
    return this.allPatients().filter((patient) => {
      const first = patient.firstAppointmentAt;
      return first !== null && first >= start && first < end;
    }).length;
  });

  protected readonly newTodayDelta = computed(() => {
    const startToday = this.startOfDay(Date.now());
    const startYesterday = startToday - 24 * 60 * 60 * 1000;
    const today = this.newTodayCount();
    const yesterday = this.allPatients().filter((patient) => {
      const first = patient.firstAppointmentAt;
      return first !== null && first >= startYesterday && first < startToday;
    }).length;
    if (!yesterday) {
      return null;
    }
    return Math.round(((today - yesterday) / yesterday) * 100);
  });

  protected readonly newThisMonthCount = computed(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return this.allPatients().filter((patient) => {
      const first = patient.firstAppointmentAt;
      return first !== null && first >= monthStart;
    }).length;
  });

  protected readonly recurrentRate = computed(() => {
    const total = this.totalCount();
    if (!total) {
      return 0;
    }
    const recurrent = this.allPatients().filter((patient) => patient.appointmentCount >= 2).length;
    return Math.round((recurrent / total) * 100);
  });

  ngOnInit(): void {
    if (!this.store.appointments().length && !this.store.loading()) {
      this.store.refreshCore();
    }
  }

  protected initials(patient: InstitutionPatientSummary): string {
    const parts = patient.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return patient.name.slice(0, 2).toUpperCase();
  }

  protected avatarTone(patient: InstitutionPatientSummary): string {
    let hash = 0;
    for (const char of patient.key) {
      hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
    }
    return AVATAR_TONES[hash];
  }

  protected patientMeta(patient: InstitutionPatientSummary): string {
    const citas = `${patient.appointmentCount} cita${patient.appointmentCount === 1 ? '' : 's'}`;
    const doctor = patient.doctorName.startsWith('Dr')
      ? patient.doctorName
      : `Dr(a). ${patient.doctorName}`;
    let meta = `${citas} · ${doctor}`;
    if (patient.lowAdherence) {
      meta += ' · ⚠ Adh. baja';
    }
    return meta;
  }

  protected todayDeltaLabel(): string {
    const delta = this.newTodayDelta();
    if (delta === null) {
      return '—';
    }
    const arrow = delta >= 0 ? '↑' : '↓';
    return `${arrow} ${Math.abs(delta)}%`;
  }

  private startOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }
}
