import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { EmergencyContact } from '../../../shared/models/telemedicine.model';
import { EmergencyService } from '../../../core/services/telemedicine.service';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-sos-emergencia',
  imports: [CommonModule, PatientDashboardShellComponent],
  templateUrl: './sos-emergencia.html',
  styleUrl: './sos-emergencia.scss',
})
export class SosEmergenciaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly emergency = inject(EmergencyService);

  protected readonly contacts = signal<EmergencyContact[]>([]);
  protected readonly errorMessage = signal('');

  protected readonly defaults: EmergencyContact[] = [
    { name: 'SAMU', phone: '106', description: 'Atencion medica de urgencia' },
    { name: 'Bomberos', phone: '116', description: 'Cuerpo General de Bomberos' },
    { name: 'PNP', phone: '105', description: 'Policia Nacional del Peru' },
  ];

  ngOnInit(): void {
    this.emergency.getContacts().subscribe({
      next: (contacts) => this.contacts.set(contacts.length ? contacts : this.defaults),
      error: () => this.contacts.set(this.defaults),
    });
  }

  protected startCall(contact: EmergencyContact): void {
    void this.router.navigate(['/paciente/sos/llamando'], {
      queryParams: { servicio: contact.name, numero: contact.phone },
    });
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
    void this.router.navigate(['/paciente/dashboard']);
  }
  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
