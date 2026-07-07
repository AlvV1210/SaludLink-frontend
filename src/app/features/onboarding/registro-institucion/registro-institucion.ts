import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { InstitutionService } from '../../../core/services/institution.service';
import { EstablishmentType } from '../../../shared/models/institution.model';

@Component({
  selector: 'app-registro-institucion',
  imports: [ReactiveFormsModule],
  templateUrl: './registro-institucion.html',
  styleUrl: './registro-institucion.scss',
})
export class RegistroInstitucionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly institutionService = inject(InstitutionService);

  protected readonly currentStep = signal<1 | 2>(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly stepOneSubmitted = signal(false);
  protected readonly stepTwoSubmitted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.minLength(3)]],
    establishmentType: ['CLINIC', [Validators.required]],
    ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    adminFirstName: ['', [Validators.required, Validators.minLength(2)]],
    adminLastName: ['', [Validators.required, Validators.minLength(2)]],
    adminJobTitle: ['', [Validators.required, Validators.minLength(2)]],
    adminDni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    terms: [true, [Validators.requiredTrue]],
  });

  protected continue(): void {
    this.errorMessage.set(null);
    this.stepOneSubmitted.set(true);
    const controls = [
      this.form.controls.businessName,
      this.form.controls.establishmentType,
      this.form.controls.ruc,
      this.form.controls.address,
      this.form.controls.phone,
    ];
    controls.forEach((control) => control.markAsTouched());
    if (controls.some((control) => control.invalid)) {
      return;
    }
    this.currentStep.set(2);
  }

  protected backToStepOne(): void {
    this.errorMessage.set(null);
    this.currentStep.set(1);
  }

  protected submit(): void {
    this.errorMessage.set(null);
    this.stepTwoSubmitted.set(true);
    const controls = [
      this.form.controls.adminFirstName,
      this.form.controls.adminLastName,
      this.form.controls.adminJobTitle,
      this.form.controls.adminDni,
      this.form.controls.adminEmail,
      this.form.controls.password,
      this.form.controls.confirmPassword,
      this.form.controls.terms,
    ];
    controls.forEach((control) => control.markAsTouched());
    if (controls.some((control) => control.invalid)) {
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);

    this.institutionService
      .register({
        adminFirstName: raw.adminFirstName.trim(),
        adminLastName: raw.adminLastName.trim(),
        adminEmail: raw.adminEmail.trim(),
        adminPassword: raw.password,
        adminPhone: raw.phone.trim(),
        name: raw.businessName.trim(),
        ruc: raw.ruc.trim(),
        address: raw.address.trim(),
        establishmentType: raw.establishmentType as EstablishmentType,
      })
      .pipe(
        switchMap(() =>
          this.auth.login({
            email: raw.adminEmail.trim(),
            password: raw.password,
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl('/admin/dashboard');
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(
            apiErrorMessage(error, 'No se pudo crear la cuenta de institución. Revisa los datos.'),
          );
        },
      });
  }

  protected goLogin(): void {
    void this.router.navigateByUrl('/registro');
  }
}
