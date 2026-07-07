import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { DependentService } from '../../../core/services/dependent.service';
import { PatientService } from '../../../core/services/patient.service';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';
import { CreateDependentRequest, Dependent } from '../../../shared/models/dependent.model';
import { PatientProfile } from '../../../shared/models/patient.model';

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];

interface ProfileCardView {
  key: string;
  name: string;
  meta: string;
  badge: string;
  initials: string;
  tone: string;
}

@Component({
  selector: 'app-perfil-salud',
  imports: [FormsModule, PatientDashboardShellComponent],
  templateUrl: './perfil-salud.html',
  styleUrls: ['./perfil-salud.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class PerfilSaludComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly patients = inject(PatientService);
  private readonly dependentsService = inject(DependentService);

  protected readonly profile = signal<PatientProfile | null>(null);
  protected readonly dependents = signal<Dependent[]>([]);
  protected readonly showAddForm = signal(false);
  protected readonly uiMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly savingDependent = signal(false);

  protected draft: CreateDependentRequest = {
    firstName: '',
    lastName: '',
    relationship: '',
  };

  protected readonly firstName = computed(() => {
    const fromProfile = this.profile()?.firstName?.trim();
    if (fromProfile) {
      return fromProfile;
    }
    return this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente';
  });

  protected readonly profileCards = computed<ProfileCardView[]>(() => {
    const cards: ProfileCardView[] = [];
    const profile = this.profile();

    if (profile) {
      const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || this.firstName();
      cards.push({
        key: 'titular',
        name: `${fullName} (yo)`,
        meta: this.buildMeta('Titular', profile.birthDate, profile.bloodType),
        badge: 'Activo',
        initials: this.initials(fullName),
        tone: this.avatarTone('titular'),
      });
    }

    for (const dependent of this.dependents()) {
      const fullName = `${dependent.firstName} ${dependent.lastName}`.trim();
      cards.push({
        key: `dep-${dependent.id}`,
        name: fullName,
        meta: this.buildMeta(dependent.relationship || 'Dependiente', dependent.birthDate),
        badge: 'Dependiente',
        initials: this.initials(fullName),
        tone: this.avatarTone(`dep-${dependent.id}`),
      });
    }

    return cards;
  });

  ngOnInit(): void {
    this.patients.getMyProfile().subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => undefined,
    });

    this.dependentsService.list().subscribe({
      next: (items) => this.dependents.set(items),
      error: () => undefined,
    });
  }

  protected toggleAddForm(): void {
    this.showAddForm.update((value) => !value);
    this.errorMessage.set('');
  }

  protected saveDependent(): void {
    this.errorMessage.set('');
    if (!this.draft.firstName.trim() || !this.draft.lastName.trim()) {
      this.errorMessage.set('Ingresa nombres y apellidos del dependiente.');
      return;
    }

    this.savingDependent.set(true);
    this.dependentsService.create(this.draft).subscribe({
      next: () => {
        this.savingDependent.set(false);
        this.draft = { firstName: '', lastName: '', relationship: '' };
        this.showAddForm.set(false);
        this.uiMessage.set('Dependiente añadido correctamente.');
        this.reloadDependents();
      },
      error: (error) => {
        this.savingDependent.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo añadir el dependiente.'));
      },
    });
  }

  protected goHealthDashboard(): void {
    void this.router.navigateByUrl('/paciente/dashboard/salud');
  }

  protected goDatosClinicos(): void {
    void this.router.navigateByUrl('/paciente/perfil/datos-clinicos');
  }

  protected goDashboard(): void {
    void this.router.navigateByUrl('/paciente/dashboard');
  }

  protected goCitas(): void {
    void this.router.navigateByUrl('/paciente/citas');
  }

  protected goRecordatorios(): void {
    void this.router.navigateByUrl('/paciente/recordatorios');
  }

  protected goHistorial(): void {
    void this.router.navigateByUrl('/paciente/historial');
  }

  protected goMental(): void {
    void this.router.navigateByUrl('/paciente/salud-mental');
  }

  protected goPerfil(): void {
    void this.router.navigateByUrl('/paciente/dashboard/salud');
  }

  protected goPlanes(): void {
    void this.router.navigateByUrl('/paciente/planes');
  }

  protected goConfig(): void {
    void this.router.navigateByUrl('/contact');
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/bienvenidacuenta');
  }

  private reloadDependents(): void {
    this.dependentsService.list().subscribe({
      next: (items) => this.dependents.set(items),
      error: () => undefined,
    });
  }

  private buildMeta(role: string, birthDate?: string, bloodType?: string): string {
    const ageLabel = this.formatAge(birthDate);
    const blood = bloodType?.trim() || '—';
    return `${role} · ${ageLabel} · ${blood}`;
  }

  private formatAge(birthDate?: string): string {
    if (!birthDate) {
      return '—';
    }
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return '—';
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age >= 0 ? `${age} años` : '—';
  }

  private initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  private avatarTone(key: string): string {
    let hash = 0;
    for (const char of key) {
      hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
    }
    return AVATAR_TONES[hash];
  }
}
