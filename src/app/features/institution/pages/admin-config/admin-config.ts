import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';

export interface PolicyToggle {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface InstitutionConfigState {
  appointmentPolicies: PolicyToggle[];
  telemedicinePolicies: PolicyToggle[];
  notificationPolicies: PolicyToggle[];
}

const DEFAULT_CONFIG: InstitutionConfigState = {
  appointmentPolicies: [
    {
      id: 'prepay',
      title: 'Pago anticipado obligatorio',
      description: 'Requerir pago al reservar (HU16)',
      enabled: true,
    },
    {
      id: 'reschedule',
      title: 'Reprogramación gratuita',
      description: 'Hasta 4h antes (HU14)',
      enabled: true,
    },
    {
      id: 'noshow-fee',
      title: 'Multa por no-show',
      description: 'Cobrar 30% en próxima cita',
      enabled: false,
    },
  ],
  telemedicinePolicies: [
    {
      id: 'telemed',
      title: 'Habilitar consultas virtuales',
      description: 'Para todos los médicos (HU05)',
      enabled: true,
    },
  ],
  notificationPolicies: [
    {
      id: 'noshow-alerts',
      title: 'Alertas de no-shows en tiempo real',
      description: 'Email + dashboard',
      enabled: true,
    },
    {
      id: 'weekly-report',
      title: 'Reporte semanal automático',
      description: 'Lunes 8:00 AM',
      enabled: true,
    },
  ],
};

@Component({
  selector: 'app-admin-config',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-config.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-config.scss'],
})
export class AdminConfigComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly store = inject(InstitutionAdminStoreService);

  protected readonly saved = signal(false);
  protected readonly appointmentPolicies = signal<PolicyToggle[]>([]);
  protected readonly telemedicinePolicies = signal<PolicyToggle[]>([]);
  protected readonly notificationPolicies = signal<PolicyToggle[]>([]);

  ngOnInit(): void {
    this.loadConfig();
  }

  protected toggle(list: 'appointment' | 'telemed' | 'notification', id: string): void {
    const updater = (items: PolicyToggle[]) =>
      items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item));
    if (list === 'appointment') {
      this.appointmentPolicies.update(updater);
    } else if (list === 'telemed') {
      this.telemedicinePolicies.update(updater);
    } else {
      this.notificationPolicies.update(updater);
    }
    this.saved.set(false);
  }

  protected save(): void {
    const key = this.storageKey();
    const payload: InstitutionConfigState = {
      appointmentPolicies: this.appointmentPolicies(),
      telemedicinePolicies: this.telemedicinePolicies(),
      notificationPolicies: this.notificationPolicies(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
    this.saved.set(true);
  }

  private loadConfig(): void {
    const key = this.storageKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.applyDefaults();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as InstitutionConfigState;
      this.appointmentPolicies.set(parsed.appointmentPolicies ?? DEFAULT_CONFIG.appointmentPolicies);
      this.telemedicinePolicies.set(
        parsed.telemedicinePolicies ?? DEFAULT_CONFIG.telemedicinePolicies,
      );
      this.notificationPolicies.set(
        parsed.notificationPolicies ?? DEFAULT_CONFIG.notificationPolicies,
      );
    } catch {
      this.applyDefaults();
    }
  }

  private applyDefaults(): void {
    this.appointmentPolicies.set(structuredClone(DEFAULT_CONFIG.appointmentPolicies));
    this.telemedicinePolicies.set(structuredClone(DEFAULT_CONFIG.telemedicinePolicies));
    this.notificationPolicies.set(structuredClone(DEFAULT_CONFIG.notificationPolicies));
  }

  private storageKey(): string {
    const institutionId =
      this.store.profile()?.id ??
      this.auth.getCurrentUser()?.email ??
      'default';
    return `sl_institution_config_${institutionId}`;
  }
}
