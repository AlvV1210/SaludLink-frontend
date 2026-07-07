import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AdminAppointmentService } from '../../../core/services/admin-appointment.service';
import { AdminDoctorService } from '../../../core/services/admin-doctor.service';
import { AuthService } from '../../../core/services/auth.service';
import { InstitutionService } from '../../../core/services/institution.service';
import { Appointment, AppointmentModality } from '../../../shared/models/appointment.model';
import { Doctor } from '../../../shared/models/doctor.model';
import { InstitutionReportResponse } from '../../../shared/models/institution.model';

type AdminSection = 'dashboard' | 'sedes' | 'medicos' | 'reportes' | 'citas';

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  especialidad: string;
  cmp: string;
  estado: 'Activa' | 'Inactiva';
}

interface Cita {
  id: number;
  paciente: string;
  fecha: string;
  hora: string;
  medicoId: number;
  estado: string;
  modalidad: string;
}

@Component({
  selector: 'app-panel-admin-institucional',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin-institucional.html',
  styleUrl: './panel-admin-institucional.scss',
})
export class PanelAdminInstitucionalComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly institutionService = inject(InstitutionService);
  private readonly adminDoctorService = inject(AdminDoctorService);
  private readonly adminAppointmentService = inject(AdminAppointmentService);

  protected readonly activeSection = signal<AdminSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly loading = signal(false);
  protected readonly loadingMedicos = signal(false);
  protected readonly loadingCitas = signal(false);
  protected readonly loadingReport = signal(false);

  protected readonly clinicName = signal('Institución');
  protected readonly dashboardStats = signal({
    todayAppointments: 0,
    medicalOccupancyRate: 0,
    noShowAlerts: 0,
    averageAdherencePercent: 0,
  });
  protected readonly report = signal<InstitutionReportResponse | null>(null);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly citas = signal<Cita[]>([]);

  protected reportFrom = '';
  protected reportTo = '';

  protected medicoForm = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    phone: '',
    especialidad: '',
    cmp: '',
    biography: '',
  };

  protected medicoAttempted = false;

  constructor() {
    this.loadDashboard();
    this.loadMedicos();
  }

  protected readonly totalMedicos = computed(() => this.medicos().length);
  protected readonly totalCitas = computed(() => this.citas().length);

  protected openSection(section: AdminSection): void {
    this.activeSection.set(section);
    if (section === 'dashboard') {
      this.loadDashboard();
    }
    if (section === 'medicos') {
      this.loadMedicos();
    }
    if (section === 'citas') {
      this.loadCitas();
    }
    if (section === 'reportes') {
      this.loadReport();
    }
  }

  protected registerMedico(): void {
    this.medicoAttempted = true;
    if (!this.isMedicoFormValid()) {
      return;
    }

    this.loadingMedicos.set(true);
    this.adminDoctorService
      .createDoctor({
        firstName: this.medicoForm.nombre.trim(),
        lastName: this.medicoForm.apellido.trim(),
        email: this.medicoForm.email.trim(),
        password: this.medicoForm.password,
        phone: this.medicoForm.phone.trim() || undefined,
        specialty: this.medicoForm.especialidad.trim(),
        licenseNumber: this.medicoForm.cmp.trim(),
        biography: this.medicoForm.biography.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.loadingMedicos.set(false);
          this.showToast('Médico afiliado registrado correctamente.');
          this.resetMedicoForm();
          this.loadMedicos();
        },
        error: (error) => {
          this.loadingMedicos.set(false);
          this.showToast(apiErrorMessage(error, 'No se pudo registrar el médico.'));
        },
      });
  }

  protected cancelCita(citaId: number): void {
    this.loadingCitas.set(true);
    this.adminAppointmentService.cancel(citaId).subscribe({
      next: () => {
        this.loadingCitas.set(false);
        this.showToast('Cita cancelada.');
        this.loadCitas();
      },
      error: (error) => {
        this.loadingCitas.set(false);
        this.showToast(apiErrorMessage(error, 'No se pudo cancelar la cita.'));
      },
    });
  }

  protected loadReport(): void {
    const from = this.reportFrom || this.defaultFrom();
    const to = this.reportTo || this.defaultTo();
    this.loadingReport.set(true);
    this.institutionService.getReports(from, to).subscribe({
      next: (report) => {
        this.loadingReport.set(false);
        this.report.set(report);
      },
      error: (error) => {
        this.loadingReport.set(false);
        this.showToast(apiErrorMessage(error, 'No se pudo generar el reporte.'));
      },
    });
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.institutionService.getDashboard().subscribe({
      next: (dashboard) => {
        this.loading.set(false);
        this.dashboardStats.set({
          todayAppointments: dashboard.todayAppointments,
          medicalOccupancyRate: Number(dashboard.medicalOccupancyRate),
          noShowAlerts: dashboard.noShowAlerts,
          averageAdherencePercent: Number(dashboard.averageAdherencePercent),
        });
      },
      error: (error) => {
        this.loading.set(false);
        this.showToast(apiErrorMessage(error, 'No se pudo cargar el dashboard.'));
      },
    });
  }

  private loadMedicos(): void {
    this.loadingMedicos.set(true);
    this.adminDoctorService.listMyDoctors().subscribe({
      next: (doctors) => {
        this.loadingMedicos.set(false);
        this.medicos.set(doctors.map((doctor) => this.mapDoctor(doctor)));
      },
      error: (error) => {
        this.loadingMedicos.set(false);
        this.showToast(apiErrorMessage(error, 'No se pudieron cargar los médicos.'));
      },
    });
  }

  private loadCitas(): void {
    this.loadingCitas.set(true);
    this.adminDoctorService.listMyDoctors().pipe(
      switchMap((doctors) => {
        if (!doctors.length) {
          return of([] as Appointment[]);
        }
        return forkJoin(
          doctors.map((doctor) => this.adminAppointmentService.listByDoctor(doctor.id)),
        ).pipe(
          switchMap((lists) => of(lists.flat())),
        );
      }),
    ).subscribe({
      next: (appointments) => {
        this.loadingCitas.set(false);
        this.citas.set(appointments.map((a) => this.mapCita(a)));
      },
      error: (error) => {
        this.loadingCitas.set(false);
        this.showToast(apiErrorMessage(error, 'No se pudieron cargar las citas.'));
      },
    });
  }

  private mapDoctor(doctor: Doctor): Medico {
    return {
      id: doctor.id,
      nombre: doctor.firstName ?? '',
      apellido: doctor.lastName ?? '',
      email: doctor.email ?? '',
      especialidad: doctor.specialty ?? '',
      cmp: doctor.licenseNumber ?? '',
      estado: doctor.verified ? 'Activa' : 'Inactiva',
    };
  }

  private mapCita(appointment: Appointment): Cita {
    const raw = appointment.appointmentDate ?? '';
    const [fecha, timePart] = raw.includes('T') ? raw.split('T') : [raw.slice(0, 10), ''];
    return {
      id: appointment.id,
      paciente: appointment.patientName ?? 'Paciente',
      fecha: fecha || '-',
      hora: timePart?.slice(0, 5) || '-',
      medicoId: appointment.doctorId ?? 0,
      estado: String(appointment.status),
      modalidad: String(appointment.modality),
    };
  }

  private isMedicoFormValid(): boolean {
    return (
      this.medicoForm.nombre.trim().length >= 2 &&
      this.medicoForm.apellido.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.medicoForm.email.trim()) &&
      this.medicoForm.password.trim().length >= 6 &&
      this.medicoForm.especialidad.trim().length >= 2 &&
      this.medicoForm.cmp.trim().length >= 4
    );
  }

  private resetMedicoForm(): void {
    this.medicoForm = {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      phone: '',
      especialidad: '',
      cmp: '',
      biography: '',
    };
    this.medicoAttempted = false;
  }

  private defaultFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }

  private defaultTo(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set('');
      }
    }, 2200);
  }
}
