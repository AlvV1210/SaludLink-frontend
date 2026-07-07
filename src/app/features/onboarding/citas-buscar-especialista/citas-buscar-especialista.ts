import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AppointmentBookingService } from '../../../core/services/appointment-booking.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Doctor } from '../../../shared/models/doctor.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

type TimeFilter = 'hoy' | 'semana' | 'mes';

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c'];

@Component({
  selector: 'app-citas-buscar-especialista',
  imports: [CommonModule, FormsModule, PatientDashboardShellComponent],
  templateUrl: './citas-buscar-especialista.html',
  styleUrls: ['./citas-buscar-especialista.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class CitasBuscarEspecialistaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly appointments = inject(AppointmentService);
  private readonly booking = inject(AppointmentBookingService);

  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly specialties = signal<string[]>([]);
  protected readonly specialtyFilter = signal('');
  protected readonly searchQuery = signal('');
  protected readonly timeFilter = signal<TimeFilter>('semana');
  protected readonly selectedDoctorId = signal<number | null>(null);
  protected readonly showAllSpecialties = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly visibleSpecialties = computed(() => {
    const all = this.specialties();
    if (this.showAllSpecialties()) {
      return all;
    }
    return all.slice(0, 3);
  });

  protected readonly hasMoreSpecialties = computed(() => this.specialties().length > 3);

  protected readonly filteredDoctors = computed(() => {
    const query = this.normalizeSearchText(this.searchQuery());
    if (!query) {
      return this.doctors();
    }
    return this.doctors().filter((doctor) => {
      const name = this.normalizeSearchText(this.doctorName(doctor));
      const specialty = this.normalizeSearchText(doctor.specialty);
      const location = this.normalizeSearchText(this.doctorLocation(doctor));
      const normalizedQuery = query;
      return (
        name.includes(normalizedQuery) ||
        specialty.includes(normalizedQuery) ||
        location.includes(normalizedQuery)
      );
    });
  });

  protected readonly selectedDoctor = computed(() => {
    const id = this.selectedDoctorId();
    if (id === null) {
      return null;
    }
    return this.filteredDoctors().find((doctor) => doctor.id === id) ?? null;
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.appointments.getSpecialties().subscribe({
      next: (specialties) => {
        this.specialties.set(specialties);
        this.loadDoctors();
      },
      error: () => this.loadDoctors(),
    });
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    const match = this.specialties().find(
      (specialty) => this.normalizeSearchText(specialty) === this.normalizeSearchText(value),
    );
    if (match) {
      this.selectSpecialty(match);
    }
  }

  protected selectSpecialty(specialty: string): void {
    this.specialtyFilter.set(specialty);
    this.searchQuery.set(specialty);
    this.selectedDoctorId.set(null);
    this.loadDoctors();
  }

  protected clearSpecialtyFilter(): void {
    this.specialtyFilter.set('');
    this.searchQuery.set('');
    this.selectedDoctorId.set(null);
    this.loadDoctors();
  }

  protected toggleMoreSpecialties(): void {
    this.showAllSpecialties.update((value) => !value);
  }

  protected selectTimeFilter(filter: TimeFilter): void {
    this.timeFilter.set(filter);
  }

  protected selectDoctorCard(doctor: Doctor): void {
    this.selectedDoctorId.set(doctor.id);
  }

  protected continueBooking(): void {
    const doctor = this.selectedDoctor();
    if (!doctor) {
      return;
    }
    this.booking.setDoctor(doctor);
    void this.router.navigate(['/paciente/citas/seleccionar-fecha-hora']);
  }

  protected doctorName(doctor: Doctor): string {
    return (
      doctor.name?.trim() ||
      `Dr. ${doctor.firstName} ${doctor.lastName}`.trim() ||
      'Medico'
    );
  }

  protected doctorLocation(doctor: Doctor): string {
    return doctor.clinicName || doctor.branchName || doctor.branchAddress || 'N/A';
  }

  protected doctorInitials(doctor: Doctor): string {
    const first = doctor.firstName?.charAt(0) ?? '';
    const last = doctor.lastName?.charAt(0) ?? '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || 'DR';
  }

  protected avatarTone(doctor: Doctor): string {
    return AVATAR_TONES[doctor.id % AVATAR_TONES.length];
  }

  protected formatFee(doctor: Doctor): string {
    if (doctor.consultationFee === undefined || doctor.consultationFee === null) {
      return 'N/A';
    }
    return `S/${doctor.consultationFee}`;
  }

  protected availabilityLabel(): string {
    return 'N/A';
  }

  protected ratingLabel(): string {
    return 'N/A';
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
    void this.router.navigate(['/paciente/dashboard/salud']);
  }

  protected goConfig(): void {
    void this.router.navigate(['/contact']);
  }

  protected back(): void {
    void this.router.navigate(['/paciente/citas']);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }

  private loadDoctors(): void {
    this.loading.set(true);
    const specialty = this.specialtyFilter().trim();
    const request = specialty
      ? this.appointments.getDoctorsBySpecialty(specialty)
      : this.appointments.getDoctors();

    request.subscribe({
      next: (doctors) => {
        this.loading.set(false);
        this.doctors.set(doctors);
        if (this.selectedDoctorId() !== null && !doctors.some((d) => d.id === this.selectedDoctorId())) {
          this.selectedDoctorId.set(null);
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.doctors.set([]);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudieron cargar los especialistas.'));
      },
    });
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
