import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { PENDING_VERIFICATION_EMAIL_KEY } from '../../../core/constants/storage-keys';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verificacion-correo',
  imports: [ReactiveFormsModule],
  templateUrl: './verificacion-correo.html',
  styleUrl: './verificacion-correo.scss',
})
export class VerificacionCorreoComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly email = signal('');
  protected readonly changeMode = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.email.set(this.resolveEmail());
  }

  protected changeEmail(): void {
    this.errorMessage.set(null);
    this.emailForm.reset({ email: '' });
    this.changeMode.set(true);
  }

  protected cancelChange(): void {
    this.errorMessage.set(null);
    this.changeMode.set(false);
  }

  protected saveNewEmail(): void {
    this.errorMessage.set(null);

    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const nextEmail = this.emailForm.getRawValue().email.trim();
    sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, nextEmail);
    this.auth.updateStoredEmail(nextEmail);
    this.email.set(nextEmail);
    this.changeMode.set(false);
  }

  protected resend(): void {
    // Flujo demo: mantenemos al usuario en la pantalla.
  }

  protected continueFlow(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }

  private resolveEmail(): string {
    const fromState = this.readNavigationEmail();
    if (fromState) {
      return fromState;
    }

    const stored = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY)?.trim();
    if (stored) {
      return stored;
    }

    return this.auth.getCurrentUser()?.email?.trim() ?? '';
  }

  private readNavigationEmail(): string {
    const state = this.router.currentNavigation()?.extras.state as { email?: string } | undefined;
    const historyEmail = (history.state as { email?: string } | undefined)?.email;
    return state?.email?.trim() || historyEmail?.trim() || '';
  }
}
