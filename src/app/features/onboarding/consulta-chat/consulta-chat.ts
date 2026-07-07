import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { TelemedicineService } from '../../../core/services/telemedicine.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { ConsultationMessage } from '../../../shared/models/telemedicine.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-consulta-chat',
  imports: [CommonModule, FormsModule, PatientDashboardShellComponent],
  templateUrl: './consulta-chat.html',
  styleUrl: './consulta-chat.scss',
})
export class ConsultaChatComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly appointments = inject(AppointmentService);
  private readonly telemedicine = inject(TelemedicineService);

  protected readonly appointmentId = signal<number | null>(null);
  protected readonly appointment = signal<Appointment | null>(null);
  protected readonly messages = signal<ConsultationMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly loading = signal(true);
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly forceClosed = signal(false);
  protected readonly currentUserId = signal<number | null>(null);

  protected readonly doctorName = computed(() => {
    const item = this.appointment();
    if (!item) {
      return 'Medico';
    }
    return (
      item.doctorName ??
      item.doctorFullName ??
      [item.doctorFirstName, item.doctorLastName].filter(Boolean).join(' ') ??
      'Medico'
    );
  });

  protected readonly doctorInitials = computed(() => {
    const parts = this.doctorName().replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return this.doctorName().slice(0, 2).toUpperCase();
  });

  protected readonly conversationClosed = computed(() => {
    if (this.forceClosed()) {
      return true;
    }
    const status = String(this.appointment()?.status ?? '').toUpperCase();
    return status === 'COMPLETED' || status === 'CANCELLED';
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('appointmentId'));
    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('Selecciona una cita valida para abrir el chat.');
      return;
    }
    this.appointmentId.set(id);
    this.forceClosed.set(this.route.snapshot.queryParamMap.get('closed') === '1');
    this.auth.getMe().subscribe({
      next: (me) => this.currentUserId.set(me.userId),
    });
    this.loadAppointment(id);
    this.loadMessages(id);
  }

  protected isPatientMessage(message: ConsultationMessage): boolean {
    const userId = this.currentUserId();
    if (userId !== null) {
      return message.senderUserId === userId;
    }
    const user = this.auth.getCurrentUser();
    if (!user) {
      return false;
    }
    const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
    return message.senderName.trim().toLowerCase() === fullName;
  }

  protected formatTime(sentAt: string): string {
    const date = new Date(sentAt);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  protected sendMessage(): void {
    const id = this.appointmentId();
    const text = this.draft().trim();
    if (!id || !text || this.conversationClosed() || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.telemedicine.sendMessage(id, text).subscribe({
      next: (message) => {
        this.messages.update((current) => [...current, message]);
        this.draft.set('');
        this.sending.set(false);
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo enviar el mensaje.'));
      },
    });
  }

  protected goCalificar(): void {
    const id = this.appointmentId();
    if (!id) {
      return;
    }
    void this.router.navigate(['/paciente/citas/calificar'], { queryParams: { appointmentId: id } });
  }

  protected goHistorial(): void {
    void this.router.navigate(['/paciente/historial']);
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

  private loadAppointment(id: number): void {
    this.appointments.getAppointmentsByPatient().subscribe({
      next: (items) => {
        const match = items.find((item) => item.id === id) ?? null;
        this.appointment.set(match);
      },
    });
  }

  private loadMessages(id: number): void {
    this.loading.set(true);
    this.telemedicine.getMessages(id).subscribe({
      next: (items) => {
        this.messages.set([...items].sort((a, b) => a.sentAt.localeCompare(b.sentAt)));
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo cargar el chat.'));
      },
    });
  }
}
