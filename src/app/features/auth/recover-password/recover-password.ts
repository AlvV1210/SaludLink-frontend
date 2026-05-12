import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recover-password',
  imports: [ReactiveFormsModule],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.scss',
})
export class RecoverPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    void this.router.navigate(['/registro']);
  }

  protected back(): void {
    void this.router.navigate(['/registro']);
  }
}
