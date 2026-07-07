import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AppointmentBookingService } from '../../../core/services/appointment-booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

type PaymentMethodOption = 'card' | 'yape';

@Component({
  selector: 'app-citas-pago',
  imports: [CommonModule, FormsModule, PatientDashboardShellComponent],
  templateUrl: './citas-pago.html',
  styleUrls: ['./citas-pago.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class CitasPagoComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly booking = inject(AppointmentBookingService);
  private readonly payments = inject(PaymentService);

  protected readonly paymentMethod = signal<PaymentMethodOption>('card');
  protected readonly cardNumber = signal('');
  protected readonly expiry = signal('');
  protected readonly cvv = signal('');
  protected readonly cardholder = signal('');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly feeLabel = computed(() => {
    const fee = this.booking.booking().doctor?.consultationFee;
    if (fee === undefined || fee === null) {
      return 'N/A';
    }
    return `S/ ${fee.toFixed(2)}`;
  });

  protected readonly payButtonLabel = computed(() => {
    const fee = this.booking.booking().doctor?.consultationFee;
    if (fee === undefined || fee === null) {
      return 'Confirmar pago';
    }
    return `Pagar S/${fee} ahora`;
  });

  protected readonly canPay = computed(() => {
    if (this.paymentMethod() === 'yape') {
      return true;
    }
    return (
      this.cardNumber().replace(/\s/g, '').length >= 4 &&
      this.expiry().trim().length >= 4 &&
      this.cvv().trim().length >= 3 &&
      this.cardholder().trim().length > 0
    );
  });

  ngOnInit(): void {
    if (!this.booking.booking().appointmentId) {
      void this.router.navigate(['/paciente/citas/resumen']);
      return;
    }

    const user = this.auth.getCurrentUser();
    if (user) {
      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      if (name) {
        this.cardholder.set(name.toUpperCase());
      }
    }
  }

  protected selectPaymentMethod(method: PaymentMethodOption): void {
    this.paymentMethod.set(method);
  }

  protected payNow(): void {
    const appointmentId = this.booking.booking().appointmentId;
    const fee = this.booking.booking().doctor?.consultationFee;
    if (!appointmentId || !this.canPay()) {
      return;
    }
    if (fee === undefined || fee === null || fee <= 0) {
      this.errorMessage.set('No hay monto de consulta definido para esta cita.');
      return;
    }

    const methodLabel = this.paymentMethod() === 'yape' ? 'Yape/Plin' : 'Tarjeta';
    const digits = this.cardNumber().replace(/\D/g, '');
    const cardLast4 = digits.length >= 4 ? digits.slice(-4) : '0000';

    this.loading.set(true);
    this.errorMessage.set('');
    this.payments
      .payAppointment(appointmentId, {
        amount: fee,
        paymentMethod: methodLabel,
        cardLast4: this.paymentMethod() === 'yape' ? undefined : cardLast4,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigate(['/paciente/citas/confirmada']);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo procesar el pago.'));
        },
      });
  }

  protected goDashboard(): void {
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected goCitas(): void {
    void this.router.navigate(['/paciente/citas']);
  }

  protected goRecordatorios(): void {
    void this.router.navigate(['/paciente/recordatorios']);
  }

  protected goHistorial(): void {
    void this.router.navigate(['/paciente/historial']);
  }

  protected goMental(): void {
    void this.router.navigate(['/paciente/salud-mental']);
  }

  protected goPlanes(): void {
    void this.router.navigate(['/paciente/planes']);
  }

  protected goPerfil(): void {
    void this.router.navigate(['/paciente/dashboard/salud']);
  }

  protected goConfig(): void {
    void this.router.navigate(['/contact']);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }
}
