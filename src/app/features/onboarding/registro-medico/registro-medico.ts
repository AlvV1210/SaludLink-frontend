import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';

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

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    specialty: ['', [Validators.required, Validators.minLength(2)]],
    licenseNumber: ['', [Validators.required, Validators.minLength(4)]],
    consultationFee: ['', [Validators.required, Validators.min(1)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    terms: [true, [Validators.requiredTrue]],
  });

  protected finish(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);

    this.auth
      .register({
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        email: raw.email.trim(),
        phone: raw.phone.trim(),
        password: raw.password,
        role: 'DOCTOR',
        specialty: raw.specialty.trim(),
        licenseNumber: raw.licenseNumber.trim(),
        consultationFee: Number(raw.consultationFee),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          sessionStorage.setItem(
            'saludlink.doctorRegistration',
            JSON.stringify({
              specialty: raw.specialty.trim(),
              licenseNumber: raw.licenseNumber.trim(),
              consultationFee: Number(raw.consultationFee),
            }),
          );
          void this.router.navigateByUrl('/validacioncredenciales');
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(
            apiErrorMessage(error, 'No se pudo crear la cuenta profesional. Revisa los datos.'),
          );
        },
      });
  }

  protected goLogin(): void {
    void this.router.navigateByUrl('/registro');
  }
}
