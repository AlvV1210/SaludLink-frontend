import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly selectedRole = signal<'PACIENTE' | 'PROFESIONAL' | 'CLINICA'>('PACIENTE');

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  protected selectRole(role: 'PACIENTE' | 'PROFESIONAL' | 'CLINICA'): void {
    this.selectedRole.set(role);
  }

  protected togglePassword(): void {
    this.showPassword.update((current) => !current);
  }

  protected submit(): void {
    console.log('SUBMIT EJECUTADO');
    console.log('FORM VALUE:', this.form.getRawValue());
    console.log('FORM VALID:', this.form.valid);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: (response) => {
        console.log('LOGIN OK:', response);

        this.loading.set(false);

        const route = this.auth.getDefaultRouteByRole();
        console.log('RUTA A NAVEGAR:', route);

        this.router.navigateByUrl(route).then((navigated) => {
          console.log('NAVEGÓ:', navigated);

          if (!navigated) {
            void this.router.navigateByUrl('/paciente/dashboard');
          }
        });
      },
      error: (error) => {
        console.error('LOGIN ERROR:', error);

        this.loading.set(false);
        this.errorMessage.set(
          error?.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.'
        );
      },
    });
  }

  protected goHome(): void {
    void this.router.navigateByUrl('/bienvenidacuenta');
  }

  protected goRecoverPassword(): void {
    void this.router.navigateByUrl('/recuperar-contrasena');
  }
}