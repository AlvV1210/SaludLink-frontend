import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { Clinic, ClinicBranch } from '../../../core/models/clinic.model';

@Component({
  selector: 'app-registro-medico',
  imports: [ReactiveFormsModule],
  templateUrl: './registro-medico.html',
  styleUrl: './registro-medico.scss',
})
export class RegistroMedicoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly clinicService = inject(ClinicService);

  protected readonly loading = signal(false);
  protected readonly loadingClinics = signal(false);
  protected readonly loadingBranches = signal(false);

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly clinics = signal<Clinic[]>([]);
  protected readonly branches = signal<ClinicBranch[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    specialty: ['', [Validators.required, Validators.minLength(2)]],
    licenseNumber: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    clinicId: [0, [Validators.required, Validators.min(1)]],
    branchId: [0, [Validators.required, Validators.min(1)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    terms: [true, [Validators.requiredTrue]],
  });

  constructor() {
    this.loadClinics();

    this.form.controls.clinicId.valueChanges.subscribe((clinicId) => {
      this.form.controls.branchId.setValue(0);
      this.branches.set([]);

      if (clinicId > 0) {
        this.loadBranches(clinicId);
      }
    });
  }

  protected finish(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const {
      firstName,
      lastName,
      specialty,
      licenseNumber,
      email,
      phone,
      clinicId,
      branchId,
      password,
      confirmPassword,
    } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);

    this.auth
      .register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: 'DOCTOR',
        specialty: specialty.trim(),
        licenseNumber: licenseNumber.trim(),
        clinicId: Number(clinicId),
        branchId: Number(branchId),
      })
      .subscribe({
        next: (response) => {
          console.log('REGISTRO MÉDICO OK:', response);

          this.loading.set(false);

          // Como el register guarda token, entra directo al panel médico.
          void this.router.navigateByUrl(this.auth.getDefaultRouteByRole());
        },
        error: (error) => {
          console.error('REGISTRO MÉDICO ERROR:', error);

          this.loading.set(false);
          this.errorMessage.set(
            error?.error?.message ||
              'No se pudo crear la cuenta profesional. Revisa los datos.'
          );
        },
      });
  }

  protected goLogin(): void {
    void this.router.navigateByUrl('/registro');
  }

  private loadClinics(): void {
    this.loadingClinics.set(true);

    this.clinicService.listClinics().subscribe({
      next: (clinics) => {
        this.loadingClinics.set(false);
        this.clinics.set(clinics);
      },
      error: (error) => {
        console.error('ERROR AL CARGAR CLÍNICAS:', error);

        this.loadingClinics.set(false);
        this.errorMessage.set('No se pudieron cargar las clínicas registradas.');
      },
    });
  }

  private loadBranches(clinicId: number): void {
    this.loadingBranches.set(true);

    this.clinicService.getBranchesByClinic(clinicId).subscribe({
      next: (branches) => {
        this.loadingBranches.set(false);
        this.branches.set(branches);
      },
      error: (error) => {
        console.error('ERROR AL CARGAR SEDES:', error);

        this.loadingBranches.set(false);
        this.errorMessage.set('No se pudieron cargar las sedes de la clínica seleccionada.');
      },
    });
  }
}