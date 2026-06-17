import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { AdminDoctorService } from '../../../core/services/admin-doctor.service';
import { AdminAppointmentService } from '../../../core/services/admin-appointment.service';

import { ClinicBranch } from '../../../core/models/clinic.model';
import { Doctor } from '../../../core/models/doctor.model';
import { Appointment, AppointmentModality } from '../../../core/models/appointment.model';

type AdminSection = 'dashboard' | 'sedes' | 'medicos' | 'reportes' | 'citas';
type SedeStatus = 'Activa' | 'Inactiva';
type CitaStatus = 'Programada' | 'Confirmada' | 'Cancelada';

interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  ruc: string;
  estado: SedeStatus;
}

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  especialidad: string;
  cmp: string;
  sedeId: number;
  estado: SedeStatus;
}

interface Cita {
  id: number;
  paciente: string;
  dia: string;
  fecha: string;
  hora: string;
  medicoId: number;
  estado: CitaStatus;
  modalidad: AppointmentModality | string;
  notes?: string;
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
  private readonly clinicService = inject(ClinicService);
  private readonly adminDoctorService = inject(AdminDoctorService);
  private readonly adminAppointmentService = inject(AdminAppointmentService);

  protected readonly activeSection = signal<AdminSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly loadingSedes = signal(false);
  protected readonly loadingMedicos = signal(false);
  protected readonly loadingClinic = signal(false);
  protected readonly loadingCitas = signal(false);

  protected readonly clinicName = signal('Clínica');
  protected readonly clinicId = signal<number | null>(null);

  protected readonly sedes = signal<Sede[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly citas = signal<Cita[]>([]);

  protected sedeForm = {
    nombre: '',
    direccion: '',
    ruc: '',
  };

  protected medicoForm = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    phone: '',
    especialidad: '',
    cmp: '',
    sedeId: 0,
    biography: '',
    consultationFee: '',
  };

  protected citaForm = {
    paciente: '',
    dia: 'Lunes',
    fecha: '',
    hora: '',
    medicoId: 0,
  };

  protected editingSedeId: number | null = null;
  protected editingMedicoId: number | null = null;
  protected editingCitaId: number | null = null;

  protected sedeAttempted = false;
  protected medicoAttempted = false;
  protected citaAttempted = false;

  constructor() {
    this.loadClinicData();
    this.loadSedes();
    this.loadMedicos();
  }

  protected readonly totalSedes = computed(() => this.sedes().length);
  protected readonly totalMedicos = computed(() => this.medicos().length);
  protected readonly totalCitas = computed(() => this.citas().length);

  protected readonly citasConfirmadas = computed(
    () => this.citas().filter((cita) => cita.estado === 'Confirmada').length
  );

  protected readonly citasCanceladas = computed(
    () => this.citas().filter((cita) => cita.estado === 'Cancelada').length
  );

  protected readonly citasProgramadas = computed(
    () => this.citas().filter((cita) => cita.estado === 'Programada').length
  );

  protected readonly citasPorMedico = computed(() => {
    const total = this.citas().length || 1;

    return this.medicos().map((medico) => {
      const cantidad = this.citas().filter((cita) => cita.medicoId === medico.id).length;

      return {
        medicoId: medico.id,
        nombreCompleto: `${medico.nombre} ${medico.apellido}`,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
      };
    });
  });

  protected goDashboard(): void {
    this.activeSection.set('dashboard');
    void this.router.navigate(['/admin/dashboard']);
  }

  protected openSection(section: AdminSection): void {
    if (section === 'dashboard') {
      this.goDashboard();
      return;
    }

    this.activeSection.set(section);

    if (section === 'sedes') {
      this.loadSedes();
    }

    if (section === 'medicos') {
      this.loadSedes();
      this.loadMedicos();
    }

    if (section === 'citas') {
      this.loadMedicos();
      this.loadCitas();
    }

    if (section === 'reportes') {
      this.loadMedicos();
      this.loadCitas();
    }
  }

  protected registerSede(): void {
    this.sedeAttempted = true;

    if (!this.isSedeFormValid()) {
      return;
    }

    if (this.editingSedeId) {
      this.showToast('La edición de sedes todavía no está conectada al backend.');
      return;
    }

    this.loadingSedes.set(true);

    this.clinicService
      .createMyBranch({
        name: this.sedeForm.nombre.trim(),
        address: this.sedeForm.direccion.trim(),
        ruc: this.sedeForm.ruc.trim(),
      })
      .subscribe({
        next: () => {
          this.loadingSedes.set(false);
          this.showToast('Sede registrada correctamente.');
          this.resetSedeForm();
          this.loadSedes();
        },
        error: (error) => {
          console.error('ERROR AL REGISTRAR SEDE:', error);
          this.loadingSedes.set(false);
          this.showToast(error?.error?.message || 'No se pudo registrar la sede.');
        },
      });
  }

  protected editSede(sede: Sede): void {
    this.sedeForm = {
      nombre: sede.nombre,
      direccion: sede.direccion,
      ruc: sede.ruc,
    };

    this.editingSedeId = sede.id;
    this.showToast('Por ahora solo está conectado el registro de sedes nuevas.');
  }

  protected deleteSede(sedeId: number): void {
    console.warn('Eliminar sede pendiente de endpoint backend:', sedeId);
    this.showToast('Eliminar sede todavía no está conectado al backend.');
  }

  protected registerMedico(): void {
    this.medicoAttempted = true;

    if (!this.isMedicoFormValid()) {
      return;
    }

    if (this.editingMedicoId) {
      this.showToast('La edición de médicos todavía no está conectada al backend.');
      return;
    }

    this.loadingMedicos.set(true);

    this.adminDoctorService
      .createDoctor({
        firstName: this.medicoForm.nombre.trim(),
        lastName: this.medicoForm.apellido.trim(),
        email: this.medicoForm.email.trim(),
        password: this.medicoForm.password,
        phone: this.medicoForm.phone.trim(),
        specialty: this.medicoForm.especialidad.trim(),
        licenseNumber: this.medicoForm.cmp.trim(),
        branchId: Number(this.medicoForm.sedeId),
        biography: this.medicoForm.biography.trim() || undefined,
        consultationFee: this.medicoForm.consultationFee
          ? Number(this.medicoForm.consultationFee)
          : undefined,
      })
      .subscribe({
        next: () => {
          this.loadingMedicos.set(false);
          this.showToast('Médico registrado correctamente.');
          this.resetMedicoForm();
          this.loadMedicos();
        },
        error: (error) => {
          console.error('ERROR AL REGISTRAR MÉDICO:', error);
          this.loadingMedicos.set(false);
          this.showToast(error?.error?.message || 'No se pudo registrar el médico.');
        },
      });
  }

  protected editMedico(medico: Medico): void {
    this.medicoForm = {
      nombre: medico.nombre,
      apellido: medico.apellido,
      email: medico.email,
      password: '',
      phone: '',
      especialidad: medico.especialidad,
      cmp: medico.cmp,
      sedeId: medico.sedeId,
      biography: '',
      consultationFee: '',
    };

    this.editingMedicoId = medico.id;
    this.showToast('Por ahora solo está conectado el registro de médicos nuevos.');
  }

  protected deleteMedico(medicoId: number): void {
    console.warn('Eliminar médico pendiente de backend:', medicoId);
    this.showToast('Eliminar médico todavía no está conectado al backend.');
  }

  protected deleteCurrentMedico(): void {
    if (!this.editingMedicoId) {
      return;
    }

    this.deleteMedico(this.editingMedicoId);
  }

  protected scheduleCita(): void {
    this.citaAttempted = true;

    if (!this.editingCitaId) {
      this.showToast('Las citas nuevas se registran desde el panel del paciente.');
      return;
    }

    if (!this.isCitaFormValid()) {
      return;
    }

    const appointmentDate = `${this.citaForm.fecha}T${
      this.citaForm.hora.length === 5 ? `${this.citaForm.hora}:00` : this.citaForm.hora
    }`;

    this.loadingCitas.set(true);

    this.adminAppointmentService
      .updateAppointment(this.editingCitaId, {
        doctorId: Number(this.citaForm.medicoId),
        appointmentDate,
        modality: AppointmentModality.presencial,
        notes: 'Cita actualizada por administrador institucional',
      })
      .subscribe({
        next: () => {
          this.loadingCitas.set(false);
          this.showToast('Cita actualizada correctamente.');
          this.resetCitaForm();
          this.loadCitas();
        },
        error: (error) => {
          console.error('ERROR AL EDITAR CITA:', error);
          this.loadingCitas.set(false);
          this.showToast(error?.error?.message || 'No se pudo editar la cita.');
        },
      });
  }

  protected editCita(cita: Cita): void {
    this.citaForm = {
      paciente: cita.paciente,
      dia: cita.dia,
      fecha: cita.fecha,
      hora: cita.hora,
      medicoId: cita.medicoId,
    };

    this.editingCitaId = cita.id;
    this.citaAttempted = false;
    this.showToast('Editando cita. Cambia fecha, hora o médico y guarda los cambios.');
  }

  protected confirmCita(citaId: number): void {
    this.loadingCitas.set(true);

    this.adminAppointmentService.confirmAppointment(citaId).subscribe({
      next: () => {
        this.loadingCitas.set(false);
        this.showToast('Cita confirmada correctamente.');
        this.loadCitas();
      },
      error: (error) => {
        console.error('ERROR AL CONFIRMAR CITA:', error);
        this.loadingCitas.set(false);
        this.showToast(error?.error?.message || 'No se pudo confirmar la cita.');
      },
    });
  }

  protected cancelCita(citaId: number): void {
    this.loadingCitas.set(true);

    this.adminAppointmentService.cancelAppointment(citaId).subscribe({
      next: () => {
        this.loadingCitas.set(false);
        this.showToast('Cita cancelada correctamente.');
        this.loadCitas();
      },
      error: (error) => {
        console.error('ERROR AL CANCELAR CITA:', error);
        this.loadingCitas.set(false);
        this.showToast(error?.error?.message || 'No se pudo cancelar la cita.');
      },
    });
  }

  protected getSedeName(sedeId: number): string {
    return this.sedes().find((sede) => sede.id === sedeId)?.nombre ?? 'Sin sede';
  }

  protected getMedicoName(medicoId: number): string {
    const medico = this.medicos().find((item) => item.id === medicoId);
    return medico ? `${medico.nombre} ${medico.apellido}` : 'Médico asignado';
  }

  protected getCitaStatusClass(status: CitaStatus): string {
    if (status === 'Confirmada') {
      return 'status ok';
    }

    if (status === 'Cancelada') {
      return 'status off';
    }

    return 'status pending';
  }

  protected clearToast(): void {
    this.toastMessage.set('');
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }

  private loadClinicData(): void {
    this.loadingClinic.set(true);

    this.clinicService.getMyClinic().subscribe({
      next: (clinic) => {
        this.loadingClinic.set(false);
        this.clinicId.set(clinic.id);
        this.clinicName.set(clinic.businessName);
      },
      error: (error) => {
        console.error('ERROR AL CARGAR CLÍNICA:', error);
        this.loadingClinic.set(false);
        this.showToast('No se pudo cargar la información de la clínica.');
      },
    });
  }

  private loadSedes(): void {
    this.loadingSedes.set(true);

    this.clinicService.getMyBranches().subscribe({
      next: (branches) => {
        this.loadingSedes.set(false);
        this.sedes.set(branches.map((branch) => this.mapBranchToSede(branch)));
      },
      error: (error) => {
        console.error('ERROR AL CARGAR SEDES:', error);
        this.loadingSedes.set(false);
        this.sedes.set([]);
        this.showToast('No se pudieron cargar las sedes.');
      },
    });
  }

  private loadMedicos(): void {
    this.loadingMedicos.set(true);

    this.adminDoctorService.listMyDoctors().subscribe({
      next: (doctors) => {
        this.loadingMedicos.set(false);
        this.medicos.set(doctors.map((doctor) => this.mapDoctorToMedico(doctor)));
      },
      error: (error) => {
        console.error('ERROR AL CARGAR MÉDICOS:', error);
        this.loadingMedicos.set(false);
        this.medicos.set([]);
        this.showToast('No se pudieron cargar los médicos.');
      },
    });
  }

  private loadCitas(): void {
    this.loadingCitas.set(true);

    this.adminAppointmentService.listMyClinicAppointments().subscribe({
      next: (appointments) => {
        this.loadingCitas.set(false);
        this.citas.set(
          appointments.map((appointment) => this.mapBackendAppointmentToCita(appointment))
        );
      },
      error: (error) => {
        console.error('ERROR AL CARGAR CITAS ADMIN:', error);
        this.loadingCitas.set(false);
        this.citas.set([]);
        this.showToast('No se pudieron cargar las citas de la clínica.');
      },
    });
  }

  private mapBranchToSede(branch: ClinicBranch): Sede {
    return {
      id: branch.id,
      nombre: branch.name,
      direccion: branch.address,
      ruc: branch.ruc || '',
      estado: branch.active ? 'Activa' : 'Inactiva',
    };
  }

  private mapDoctorToMedico(doctor: Doctor): Medico {
    return {
      id: doctor.id,
      nombre: doctor.firstName,
      apellido: doctor.lastName,
      email: doctor.email,
      especialidad: doctor.specialty,
      cmp: doctor.licenseNumber,
      sedeId: doctor.branchId ?? 0,
      estado: doctor.verified ? 'Activa' : 'Inactiva',
    };
  }

  private mapBackendAppointmentToCita(appointment: Appointment): Cita {
    const rawDate = appointment.appointmentDate ?? appointment.scheduledAt ?? '';
    const dateTime = this.splitDateTime(rawDate);

    return {
      id: appointment.id,
      paciente: appointment.patientName ?? 'Paciente',
      dia: this.getDayName(dateTime.fecha),
      fecha: dateTime.fecha,
      hora: dateTime.hora,
      medicoId: appointment.doctorId ?? 0,
      estado: this.mapBackendStatusToAdminStatus(String(appointment.status)),
      modalidad: appointment.modality ?? AppointmentModality.presencial,
      notes: appointment.notes,
    };
  }

  private splitDateTime(value: string): { fecha: string; hora: string } {
    if (!value) {
      return {
        fecha: '-',
        hora: '-',
      };
    }

    if (value.includes('T')) {
      const [fecha, time] = value.split('T');

      return {
        fecha,
        hora: time?.slice(0, 5) || '-',
      };
    }

    return {
      fecha: value.slice(0, 10),
      hora: '-',
    };
  }

  private getDayName(dateValue: string): string {
    if (!dateValue || dateValue === '-') {
      return '-';
    }

    const date = new Date(`${dateValue}T00:00:00`);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return days[date.getDay()] ?? '-';
  }

  private mapBackendStatusToAdminStatus(status: string): CitaStatus {
    const normalized = status.toUpperCase();

    if (normalized.includes('CONFIRM')) {
      return 'Confirmada';
    }

    if (normalized.includes('CANCEL')) {
      return 'Cancelada';
    }

    return 'Programada';
  }

  private isSedeFormValid(): boolean {
    return (
      this.sedeForm.nombre.trim().length >= 3 &&
      this.sedeForm.direccion.trim().length >= 6 &&
      /^[0-9]{11}$/.test(this.sedeForm.ruc.trim())
    );
  }

  private isMedicoFormValid(): boolean {
    return (
      this.medicoForm.nombre.trim().length >= 2 &&
      this.medicoForm.apellido.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.medicoForm.email.trim()) &&
      this.medicoForm.password.trim().length >= 6 &&
      this.medicoForm.especialidad.trim().length >= 2 &&
      this.medicoForm.cmp.trim().length >= 4 &&
      Number(this.medicoForm.sedeId) > 0
    );
  }

  private isCitaFormValid(): boolean {
    return (
      this.citaForm.paciente.trim().length >= 3 &&
      !!this.citaForm.fecha &&
      !!this.citaForm.hora &&
      this.citaForm.medicoId > 0
    );
  }

  private resetSedeForm(): void {
    this.sedeForm = {
      nombre: '',
      direccion: '',
      ruc: '',
    };

    this.editingSedeId = null;
    this.sedeAttempted = false;
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
      sedeId: 0,
      biography: '',
      consultationFee: '',
    };

    this.editingMedicoId = null;
    this.medicoAttempted = false;
  }

  private resetCitaForm(): void {
    this.citaForm = {
      paciente: '',
      dia: 'Lunes',
      fecha: '',
      hora: '',
      medicoId: 0,
    };

    this.editingCitaId = null;
    this.citaAttempted = false;
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
