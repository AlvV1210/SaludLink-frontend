import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro-paciente',
  imports: [ReactiveFormsModule],
  templateUrl: './registro-paciente.html',
  styleUrl: './registro-paciente.scss',
})
export class RegistroPacienteComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
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

    const {
      firstName,
      lastName,
      email,
      phone,
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
        role: 'PATIENT',
      })
      .subscribe({
        next: (response) => {
          console.log('REGISTRO OK:', response);

          this.loading.set(false);

          void this.router.navigateByUrl('/verificacioncorreo');
        },
        error: (error) => {
          console.error('REGISTRO ERROR:', error);

          this.loading.set(false);
          this.errorMessage.set(
            error?.error?.message || 'No se pudo crear la cuenta. Revisa los datos ingresados.'
          );
        },
      });
  }

  protected goLogin(): void {
    void this.router.navigateByUrl('/registro');
  }
}