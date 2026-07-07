import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';
import { PatientProfile, PatientProfileUpdate } from '../../../shared/models/patient.model';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decir'];

@Component({
  selector: 'app-perfil-datos-clinicos',
  imports: [FormsModule, PatientDashboardShellComponent],
  templateUrl: './perfil-datos-clinicos.html',
  styleUrls: ['./perfil-datos-clinicos.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class PerfilDatosClinicosComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly patients = inject(PatientService);
  protected readonly shellNav = inject(PatientShellNav);

  protected readonly step = signal<1 | 2>(1);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly bloodTypes = BLOOD_TYPES;
  protected readonly genders = GENDERS;

  protected form: PatientProfileUpdate = {
    birthDate: '',
    gender: '',
    documentNumber: '',
    bloodType: '',
    chronicConditions: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  };

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  ngOnInit(): void {
    this.patients.getMyProfile().subscribe({
      next: (profile) => this.applyProfile(profile),
      error: () => undefined,
    });
  }

  protected continueStep1(): void {
    if (!this.form.birthDate?.trim() || !this.form.gender?.trim() || !this.form.documentNumber?.trim()) {
      this.errorMessage.set('Completa fecha de nacimiento, sexo y DNI.');
      return;
    }
    this.errorMessage.set('');
    this.step.set(2);
  }

  protected backToStep1(): void {
    this.errorMessage.set('');
    this.step.set(1);
  }

  protected skip(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected saveAndContinue(): void {
    this.saving.set(true);
    this.errorMessage.set('');
    this.patients.updateMyProfile(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/paciente/dashboard']);
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(apiErrorMessage(error, 'No se pudieron guardar los datos clinicos.'));
      },
    });
  }

  private applyProfile(profile: PatientProfile): void {
    this.form = {
      birthDate: profile.birthDate ?? '',
      gender: profile.gender ?? '',
      documentNumber: profile.documentNumber ?? '',
      bloodType: profile.bloodType ?? '',
      chronicConditions: profile.chronicConditions ?? '',
      allergies: profile.allergies ?? '',
      emergencyContactName: profile.emergencyContactName ?? '',
      emergencyContactPhone: profile.emergencyContactPhone ?? '',
    };
  }
}
