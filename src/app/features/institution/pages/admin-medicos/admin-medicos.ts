import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';
import { Doctor } from '../../../../shared/models/doctor.model';

type MedicoFilter = 'activos' | 'pendientes' | 'inactivos';

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];

@Component({
  selector: 'app-admin-medicos',
  imports: [],
  templateUrl: './admin-medicos.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-medicos.scss'],
})
export class AdminMedicosComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly store = inject(InstitutionAdminStoreService);

  protected readonly filter = signal<MedicoFilter>('activos');
  protected readonly loading = this.store.loading;

  protected readonly filteredDoctors = computed(() => {
    const doctors = this.store.doctors();
    const current = this.filter();
    if (current === 'activos') {
      return doctors;
    }
    if (current === 'pendientes') {
      return doctors.filter((doctor) => !doctor.verified);
    }
    return [];
  });

  ngOnInit(): void {
    this.store.refreshDoctors();
  }

  protected dismissNotice(): void {
    this.store.clearNotice();
  }

  protected setFilter(filter: MedicoFilter): void {
    this.filter.set(filter);
  }

  protected initials(doctor: Doctor): string {
    return `${doctor.firstName.charAt(0)}${doctor.lastName.charAt(0)}`.toUpperCase();
  }

  protected doctorLabel(doctor: Doctor): string {
    return `Dr(a). ${doctor.firstName} ${doctor.lastName}`.trim();
  }

  protected avatarTone(doctor: Doctor): string {
    return AVATAR_TONES[doctor.id % AVATAR_TONES.length];
  }

  protected patientCount(doctorId: number): number {
    const uniquePatients = new Set<string>();
    for (const appointment of this.store.appointments()) {
      if (appointment.doctorId !== doctorId) {
        continue;
      }
      uniquePatients.add(String(appointment.patientId ?? appointment.patientName ?? ''));
    }
    return uniquePatients.size;
  }

  protected doctorMeta(doctor: Doctor): string {
    const base = `${doctor.specialty} · CMP ${doctor.licenseNumber}`;
    if (!doctor.verified) {
      return `${base} · Esperando validación`;
    }
    const count = this.patientCount(doctor.id);
    return `${base} · ${count} paciente${count === 1 ? '' : 's'}`;
  }

  protected openDoctor(doctor: Doctor): void {
    void this.router.navigate(['/admin/medicos', doctor.id]);
  }

  protected goAdd(): void {
    void this.router.navigate(['/admin/medicos/agregar']);
  }
}
