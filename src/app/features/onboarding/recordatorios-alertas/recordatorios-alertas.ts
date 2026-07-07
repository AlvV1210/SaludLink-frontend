import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

const STORAGE_KEY = 'saludlink.reminderAlerts';

interface AlertSettings {
  sound: string;
  volume: number;
  doNotDisturb: boolean;
  morningReminder: boolean;
  eveningReminder: boolean;
  vibration: boolean;
}

const DEFAULT_SETTINGS: AlertSettings = {
  sound: 'Campana suave',
  volume: 70,
  doNotDisturb: false,
  morningReminder: true,
  eveningReminder: true,
  vibration: true,
};

@Component({
  selector: 'app-recordatorios-alertas',
  imports: [FormsModule, PatientDashboardShellComponent],
  templateUrl: './recordatorios-alertas.html',
  styleUrl: './recordatorios-alertas.scss',
})
export class RecordatoriosAlertasComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly sounds = ['Campana suave', 'Tono clasico', 'Pulso corto', 'Silencioso'];
  protected settings: AlertSettings = { ...DEFAULT_SETTINGS };
  protected readonly saved = signal(false);

  ngOnInit(): void {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  protected save(): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.saved.set(true);
    void this.router.navigate(['/paciente/recordatorios']);
  }

  protected cancel(): void {
    void this.router.navigate(['/paciente/recordatorios']);
  }

  protected goDashboard(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }
  protected goCitas(): void {
    void this.router.navigate(['/paciente/citas']);
  }
  protected goRecordatorios(): void {
    void this.router.navigate(['/paciente/recordatorios']);
  }
  protected goHistorial(): void {
    void this.router.navigate(['/paciente/historial']);
  }
  protected goMental(): void {
    void this.router.navigate(['/paciente/salud-mental']);
  }
  protected goPlanes(): void {
    void this.router.navigate(['/paciente/planes']);
  }
  protected goPerfil(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }
  protected goConfig(): void {
    void this.router.navigate(['/paciente/recordatorios/alertas']);
  }
  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
