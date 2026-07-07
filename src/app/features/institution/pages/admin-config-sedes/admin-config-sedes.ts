import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';

export interface InstitutionSede {
  id: string;
  name: string;
  address: string;
  tag: 'Principal' | null;
  doctorsCount: number;
  appointmentsPerDay: number;
  active: boolean;
  tone: 'a' | 'b';
}

@Component({
  selector: 'app-admin-config-sedes',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-config-sedes.html',
  styleUrls: ['../../institution-admin.shared.scss', '../admin-config/admin-config.scss', './admin-config-sedes.scss'],
})
export class AdminConfigSedesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly store = inject(InstitutionAdminStoreService);

  protected readonly sedes = signal<InstitutionSede[]>([]);
  protected readonly showForm = signal(false);
  protected newSedeName = '';
  protected newSedeAddress = '';

  protected readonly activeSedeCount = computed(
    () => this.sedes().filter((sede) => sede.active).length,
  );

  protected readonly totalCapacity = computed(() => {
    const doctors = this.sedes().reduce((sum, sede) => sum + sede.doctorsCount, 0);
    return Math.max(doctors * 14, 1);
  });

  protected readonly totalAppointments = computed(() =>
    this.sedes().reduce((sum, sede) => sum + sede.appointmentsPerDay, 0),
  );

  protected readonly occupancyPercent = computed(() =>
    Math.min(100, Math.round((this.totalAppointments() / this.totalCapacity()) * 100)),
  );

  protected readonly specialtyCount = computed(() => {
    const specialties = new Set(this.store.doctors().map((doctor) => doctor.specialty).filter(Boolean));
    return specialties.size || this.sedes().length * 4;
  });

  ngOnInit(): void {
    this.loadSedes();
  }

  protected toggleForm(): void {
    this.showForm.update((value) => !value);
    this.newSedeName = '';
    this.newSedeAddress = '';
  }

  protected addSede(): void {
    const name = this.newSedeName.trim();
    if (!name) {
      return;
    }
    const sede: InstitutionSede = {
      id: `sede-${Date.now()}`,
      name: name.toLowerCase().startsWith('sede') ? name : `Sede ${name}`,
      address: this.newSedeAddress.trim() || 'Dirección pendiente de registro',
      tag: null,
      doctorsCount: 0,
      appointmentsPerDay: 0,
      active: true,
      tone: 'b',
    };
    this.sedes.update((current) => [...current, sede]);
    this.persist();
    this.showForm.set(false);
    this.newSedeName = '';
    this.newSedeAddress = '';
  }

  protected removeSede(id: string): void {
    this.sedes.update((current) => current.filter((sede) => sede.id !== id));
    this.persist();
  }

  private loadSedes(): void {
    const key = this.storageKey();
    const raw = sessionStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as InstitutionSede[];
        if (Array.isArray(parsed) && parsed.length) {
          this.sedes.set(parsed);
          return;
        }
      } catch {
        // fall through to defaults
      }
    }
    this.sedes.set(this.buildDefaultSedes());
  }

  private persist(): void {
    sessionStorage.setItem(this.storageKey(), JSON.stringify(this.sedes()));
  }

  private buildDefaultSedes(): InstitutionSede[] {
    const doctorCount = this.store.doctors().length;
    const appointmentCount = this.store.appointments().length;
    const profile = this.store.profile();

    return [
      {
        id: 'sede-principal',
        name: 'Sede Principal',
        address: profile?.address?.trim() || 'Dirección registrada de la institución',
        tag: 'Principal',
        doctorsCount: doctorCount || 12,
        appointmentsPerDay: appointmentCount || 68,
        active: true,
        tone: 'a',
      },
      {
        id: 'sede-san-borja',
        name: 'Sede San Borja',
        address: 'Av. Aviación 2980',
        tag: null,
        doctorsCount: 9,
        appointmentsPerDay: 45,
        active: true,
        tone: 'b',
      },
      {
        id: 'sede-surco',
        name: 'Sede Surco',
        address: 'Av. El Polo 670',
        tag: null,
        doctorsCount: 7,
        appointmentsPerDay: 29,
        active: true,
        tone: 'b',
      },
    ];
  }

  private storageKey(): string {
    const institutionId =
      this.store.profile()?.id ?? this.auth.getCurrentUser()?.email ?? 'default';
    return `sl_institution_sedes_${institutionId}`;
  }
}
