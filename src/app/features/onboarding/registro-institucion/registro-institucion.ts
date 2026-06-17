import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

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

  protected readonly currentStep = signal<1 | 2>(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly stepOneSubmitted = signal(false);
  protected readonly stepTwoSubmitted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.minLength(3)]],
    establishmentType: ['', [Validators.required, Validators.minLength(3)]],
    ruc: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    branches: ['', [Validators.required]],

    adminFirstName: ['', [Validators.required, Validators.minLength(2)]],
    adminLastName: ['', [Validators.required, Validators.minLength(2)]],
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
      this.form.controls.branches,
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
      this.form.controls.adminEmail,
      this.form.controls.password,
      this.form.controls.confirmPassword,
      this.form.controls.terms,
    ];

    controls.forEach((control) => control.markAsTouched());

    if (controls.some((control) => control.invalid)) {
      return;
    }

    const {
      businessName,
      establishmentType,
      ruc,
      address,
      phone,
      branches,
      adminFirstName,
      adminLastName,
      adminEmail,
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
        firstName: adminFirstName.trim(),
        lastName: adminLastName.trim(),
        email: adminEmail.trim(),
        phone: phone.trim(),
        password,
        role: 'ADMIN',

        businessName: businessName.trim(),
        establishmentType: establishmentType.trim(),
        ruc: ruc.trim(),
        address: address.trim(),
        branchesSummary: branches.trim(),
      })
      .subscribe({
        next: (response) => {
          console.log('REGISTRO INSTITUCIÓN OK:', response);

          this.loading.set(false);
          void this.router.navigateByUrl(this.auth.getDefaultRouteByRole());
        },
        error: (error) => {
          console.error('REGISTRO INSTITUCIÓN ERROR:', error);

          this.loading.set(false);
          this.errorMessage.set(
            error?.error?.message ||
              'No se pudo crear la cuenta de institución. Revisa los datos.'
          );
        },
      });
  }

  protected goLogin(): void {
    void this.router.navigateByUrl('/registro');
  }
}