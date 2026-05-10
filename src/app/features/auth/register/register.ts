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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Sin backend de login activo: abrimos sesión demo local.
    this.auth.enterDemoSession();
    void this.router.navigate(['/panelpaciente']);
  }

  protected goHome(): void {
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
