import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';
import { InstitutionService } from '../../../../core/services/institution.service';

@Component({
  selector: 'app-admin-config-clinica',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-config-clinica.html',
  styleUrls: ['../../institution-admin.shared.scss', '../admin-config/admin-config.scss', './admin-config-clinica.scss'],
})
export class AdminConfigClinicaComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly institutionService = inject(InstitutionService);
  protected readonly store = inject(InstitutionAdminStoreService);
  protected readonly uiMessage = signal('');
  protected readonly pageLoading = signal(false);

  protected readonly profile = this.store.profile;
  protected readonly loading = this.store.loading;

  protected readonly adminEmail = computed(() => this.auth.getCurrentUser()?.email ?? '');

  protected readonly pageTitle = computed(() => {
    const name = this.profile()?.name?.trim();
    return name ? `Mi ${name}` : 'Mi institución';
  });

  protected readonly establishmentLabel = computed(() => {
    const type = this.profile()?.establishmentType;
    if (type === 'HOSPITAL') {
      return 'Hospital';
    }
    if (type === 'MEDICAL_CENTER') {
      return 'Centro médico';
    }
    return 'Clínica privada';
  });

  protected readonly createdLabel = computed(() => {
    const createdAt = this.profile()?.createdAt;
    if (!createdAt) {
      return '—';
    }
    return new Date(createdAt).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  protected readonly verificationLabel = computed(() => {
    const createdAt = this.profile()?.createdAt;
    if (!createdAt) {
      return 'Registro verificado en SaludLink';
    }
    const date = new Date(createdAt).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `Última verificación: ${date}`;
  });

  protected display(value: string | undefined | null): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : '—';
  }

  ngOnInit(): void {
    if (!this.profile()) {
      this.loadProfile();
    }
  }

  protected viewContract(): void {
    this.uiMessage.set('La visualización del contrato estará disponible próximamente.');
  }

  protected editData(): void {
    this.uiMessage.set('La edición de datos estará disponible próximamente.');
  }

  private loadProfile(): void {
    this.pageLoading.set(true);
    this.institutionService.getProfile().subscribe({
      next: (profile) => {
        this.store.profile.set(profile);
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageLoading.set(false);
      },
    });
  }
}
