import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../../core/services/api-error';
import { AdminDoctorService } from '../../../../core/services/admin-doctor.service';
import { DoctorService } from '../../../../core/services/doctor.service';
import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';
import { Doctor } from '../../../../shared/models/doctor.model';

type VincularMode = 'buscar' | 'invitar';

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];
const CONTRACT_TYPES = ['Asociado', 'Planta', 'Locador', 'Convenio'];

@Component({
  selector: 'app-admin-medico-vincular',
  imports: [FormsModule],
  templateUrl: './admin-medico-vincular.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-medico-vincular.scss'],
})
export class AdminMedicoVincularComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly adminDoctorService = inject(AdminDoctorService);
  private readonly doctorService = inject(DoctorService);
  private readonly store = inject(InstitutionAdminStoreService);

  protected readonly mode = signal<VincularMode>('buscar');
  protected readonly loading = signal(false);
  protected readonly searching = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly searchQuery = signal('');
  protected readonly selectedDoctor = signal<Doctor | null>(null);
  protected readonly catalog = signal<Doctor[]>([]);

  protected readonly contractTypes = CONTRACT_TYPES;

  protected form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    biography: '',
  };

  protected affiliation = {
    contractType: 'Asociado',
    startDate: this.todayIso(),
    consultationFee: '',
  };

  protected readonly searchResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (query.length < 2) {
      return [];
    }
    const affiliatedIds = new Set(this.store.doctors().map((doctor) => doctor.id));
    return this.catalog().filter((doctor) => {
      if (affiliatedIds.has(doctor.id)) {
        return false;
      }
      const cmp = doctor.licenseNumber.toLowerCase();
      const name = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      return cmp.includes(query) || name.includes(query);
    });
  });

  protected readonly submitLabel = computed(() => {
    if (this.loading()) {
      return 'Procesando...';
    }
    return this.mode() === 'buscar' ? 'Vincular medico ->' : 'Registrar y vincular ->';
  });

  ngOnInit(): void {
    this.loadCatalog();
  }

  protected setMode(mode: VincularMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.selectedDoctor.set(null);
    this.searchQuery.set('');
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.errorMessage.set('');
    if (this.searchResults().length === 1) {
      this.selectedDoctor.set(this.searchResults()[0]);
      return;
    }
    const selected = this.selectedDoctor();
    if (selected && !this.searchResults().some((doctor) => doctor.id === selected.id)) {
      this.selectedDoctor.set(null);
    }
  }

  protected selectDoctor(doctor: Doctor): void {
    this.selectedDoctor.set(doctor);
    this.errorMessage.set('');
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

  protected doctorSummary(doctor: Doctor): string {
    return `${doctor.specialty} · CMP ${doctor.licenseNumber}`;
  }

  protected cancel(): void {
    void this.router.navigate(['/admin/medicos']);
  }

  protected submit(): void {
    if (this.mode() === 'buscar') {
      this.submitLink();
      return;
    }
    this.submitInvite();
  }

  protected canSubmit(): boolean {
    if (this.loading()) {
      return false;
    }
    if (this.mode() === 'buscar') {
      return this.selectedDoctor() !== null;
    }
    return true;
  }

  private submitLink(): void {
    const doctor = this.selectedDoctor();
    if (!doctor) {
      this.errorMessage.set('Selecciona un médico de los resultados.');
      return;
    }

    this.errorMessage.set('');
    this.loading.set(true);
    this.adminDoctorService.linkExistingDoctor({ doctorId: doctor.id }).subscribe({
      next: (linkedDoctor) => {
        this.store.refreshAfterAffiliationChange(linkedDoctor).subscribe({
          next: () => {
            this.loading.set(false);
            this.store.setNotice(
              `${this.doctorLabel(linkedDoctor)} quedo vinculado a tu institucion.`,
            );
            void this.router.navigate(['/admin/medicos']);
          },
          error: () => {
            this.loading.set(false);
            this.store.setNotice('Medico vinculado. Actualiza la lista si no lo ves.');
            void this.router.navigate(['/admin/medicos']);
          },
        });
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo vincular al médico.'));
      },
    });
  }

  private submitInvite(): void {
    this.errorMessage.set('');
    if (
      this.form.firstName.trim().length < 2 ||
      this.form.lastName.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim()) ||
      this.form.password.trim().length < 6 ||
      this.form.specialty.trim().length < 2 ||
      this.form.licenseNumber.trim().length < 4
    ) {
      this.errorMessage.set('Completa los datos obligatorios del médico.');
      return;
    }

    this.loading.set(true);
    this.adminDoctorService
      .createDoctor({
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        password: this.form.password,
        phone: this.form.phone.trim() || undefined,
        specialty: this.form.specialty.trim(),
        licenseNumber: this.form.licenseNumber.trim(),
        biography: this.form.biography.trim() || undefined,
      })
      .subscribe({
        next: (createdDoctor) => {
          this.store.refreshAfterAffiliationChange(createdDoctor).subscribe({
            next: () => {
              this.loading.set(false);
              this.store.setNotice(
                `${this.doctorLabel(createdDoctor)} fue registrado y vinculado a tu institucion.`,
              );
              void this.router.navigate(['/admin/medicos']);
            },
            error: () => {
              this.loading.set(false);
              this.store.setNotice('Medico registrado. Actualiza la lista si no lo ves.');
              void this.router.navigate(['/admin/medicos']);
            },
          });
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo registrar al médico.'));
        },
      });
  }

  private loadCatalog(): void {
    this.searching.set(true);
    this.doctorService.listVerified().subscribe({
      next: (doctors) => {
        this.catalog.set(doctors);
        this.searching.set(false);
      },
      error: () => {
        this.catalog.set([]);
        this.searching.set(false);
      },
    });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
