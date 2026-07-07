import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { DoctorService } from '../../../core/services/doctor.service';

const DOCTOR_REGISTRATION_KEY = 'saludlink.doctorRegistration';

interface DoctorRegistrationDraft {
  specialty: string;
  licenseNumber: string;
  consultationFee?: number;
}

@Component({
  selector: 'app-validacion-credenciales',
  templateUrl: './validacion-credenciales.html',
  styleUrl: './validacion-credenciales.scss',
})
export class ValidacionCredencialesComponent {
  private readonly router = inject(Router);
  private readonly doctors = inject(DoctorService);

  protected readonly licenseUrl = 'https://docs.saludlink.pe/credentials/demo-cmp.pdf';
  protected readonly errorMessage = '';

  protected submitValidation(): void {
    const draft = this.readRegistrationDraft();
    this.doctors
      .submitCredentials({
        licenseDocumentUrl: this.licenseUrl,
        specialty: draft?.specialty,
        licenseNumber: draft?.licenseNumber,
        consultationFee: draft?.consultationFee,
      })
      .subscribe({
        next: () => {
          sessionStorage.removeItem(DOCTOR_REGISTRATION_KEY);
          void this.router.navigate(['/medico/bienvenida']);
        },
        error: (error) => {
          alert(apiErrorMessage(error, 'No se pudieron enviar las credenciales.'));
        },
      });
  }

  private readRegistrationDraft(): DoctorRegistrationDraft | null {
    const raw = sessionStorage.getItem(DOCTOR_REGISTRATION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as DoctorRegistrationDraft;
      if (!parsed.specialty?.trim() || !parsed.licenseNumber?.trim()) {
        return null;
      }
      return {
        specialty: parsed.specialty.trim(),
        licenseNumber: parsed.licenseNumber.trim(),
      };
    } catch {
      return null;
    }
  }
}
