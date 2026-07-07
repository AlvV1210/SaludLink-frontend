import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ReviewService } from '../../../../core/services/review.service';
import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';
import { Appointment } from '../../../../shared/models/appointment.model';
import { ReviewResponse } from '../../../../shared/models/review.model';

type DetalleTab = 'resumen' | 'agenda' | 'documentos' | 'facturacion';

const AVATAR_TONES = ['tone-a', 'tone-b', 'tone-c', 'tone-d'];

@Component({
  selector: 'app-admin-medico-detalle',
  templateUrl: './admin-medico-detalle.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-medico-detalle.scss'],
})
export class AdminMedicoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reviewsService = inject(ReviewService);
  protected readonly store = inject(InstitutionAdminStoreService);

  protected readonly tab = signal<DetalleTab>('resumen');
  protected readonly reviews = signal<ReviewResponse[]>([]);
  protected readonly reviewsLoading = signal(false);

  protected readonly doctorId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  protected readonly doctor = computed(() => this.store.getDoctorById(this.doctorId()));

  protected readonly doctorAppointments = computed(() =>
    this.store.appointments().filter((item) => item.doctorId === this.doctorId()),
  );

  protected readonly patientCount = computed(() => {
    const ids = new Set<string>();
    for (const appointment of this.doctorAppointments()) {
      ids.add(String(appointment.patientId ?? appointment.patientName ?? appointment.id));
    }
    return ids.size;
  });

  protected readonly patientsThisWeek = computed(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const firstSeen = new Map<string, number>();
    for (const appointment of this.doctorAppointments()) {
      const key = String(appointment.patientId ?? appointment.patientName ?? appointment.id);
      const date = this.appointmentTime(appointment);
      if (!date) {
        continue;
      }
      const current = firstSeen.get(key);
      if (current === undefined || date < current) {
        firstSeen.set(key, date);
      }
    }
    let count = 0;
    for (const first of firstSeen.values()) {
      if (first >= weekAgo) {
        count += 1;
      }
    }
    return count;
  });

  protected readonly monthAppointments = computed(() => {
    const now = new Date();
    return this.doctorAppointments().filter((appointment) => {
      const date = this.appointmentDate(appointment);
      return date?.getFullYear() === now.getFullYear() && date?.getMonth() === now.getMonth();
    }).length;
  });

  protected readonly monthAppointmentsDelta = computed(() => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const current = this.monthAppointments();
    const previous = this.doctorAppointments().filter((appointment) => {
      const date = this.appointmentDate(appointment);
      return date?.getFullYear() === prevYear && date?.getMonth() === prevMonth;
    }).length;
    if (!previous) {
      return null;
    }
    return Math.round(((current - previous) / previous) * 100);
  });

  protected readonly noShowRate = computed(() => {
    const total = this.doctorAppointments().length;
    if (!total) {
      return 0;
    }
    const noShows = this.doctorAppointments().filter((item) => item.status === 'NO_SHOW').length;
    return Math.round((noShows / total) * 1000) / 10;
  });

  protected readonly averageRating = computed(() => {
    const list = this.reviews();
    if (!list.length) {
      return 0;
    }
    const sum = list.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / list.length) * 10) / 10;
  });

  protected readonly reviewCount = computed(() => this.reviews().length);

  protected readonly sortedAgenda = computed(() =>
    [...this.doctorAppointments()].sort((a, b) => {
      const left = this.appointmentTime(a) ?? 0;
      const right = this.appointmentTime(b) ?? 0;
      return right - left;
    }),
  );

  ngOnInit(): void {
    if (!this.store.doctors().length) {
      this.store.refreshCore();
    }
    this.loadReviews();
  }

  protected setTab(tab: DetalleTab): void {
    this.tab.set(tab);
  }

  protected initials(): string {
    const doctor = this.doctor();
    if (!doctor) {
      return '—';
    }
    return `${doctor.firstName.charAt(0)}${doctor.lastName.charAt(0)}`.toUpperCase();
  }

  protected doctorLabel(): string {
    const doctor = this.doctor();
    if (!doctor) {
      return '';
    }
    return `Dr(a). ${doctor.firstName} ${doctor.lastName}`.trim();
  }

  protected avatarTone(): string {
    const doctor = this.doctor();
    if (!doctor) {
      return AVATAR_TONES[0];
    }
    return AVATAR_TONES[doctor.id % AVATAR_TONES.length];
  }

  protected starsLabel(): string {
    if (!this.reviewCount()) {
      return 'Sin reseñas aún';
    }
    const filled = '★'.repeat(Math.round(this.averageRating()));
    const empty = '☆'.repeat(Math.max(0, 5 - Math.round(this.averageRating())));
    return `${filled}${empty} ${this.averageRating()} · ${this.reviewCount()} reseña${this.reviewCount() === 1 ? '' : 's'}`;
  }

  protected feeLabel(): string {
    const fee = this.doctor()?.consultationFee;
    if (fee === undefined || fee === null) {
      return '—';
    }
    return `S/ ${Number(fee).toFixed(2)}`;
  }

  protected noShowHint(): string {
    if (!this.doctorAppointments().length) {
      return 'sin datos';
    }
    return this.noShowRate() <= 5 ? 'excelente' : 'mejorable';
  }

  protected formatAppointmentDate(appointment: Appointment): string {
    const date = this.appointmentDate(appointment);
    if (!date) {
      return '—';
    }
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected statusLabel(status: string): string {
    const labels: Record<string, string> = {
      SCHEDULED: 'Programada',
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No-show',
    };
    return labels[status] ?? status;
  }

  protected back(): void {
    void this.router.navigate(['/admin/medicos']);
  }

  private loadReviews(): void {
    const id = this.doctorId();
    if (!id) {
      return;
    }
    this.reviewsLoading.set(true);
    this.reviewsService.listByDoctor(id).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.reviewsLoading.set(false);
      },
      error: () => {
        this.reviews.set([]);
        this.reviewsLoading.set(false);
      },
    });
  }

  private appointmentDate(appointment: Appointment): Date | null {
    const raw = appointment.appointmentDate ?? appointment.date ?? appointment.scheduledAt;
    if (!raw) {
      return null;
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private appointmentTime(appointment: Appointment): number | null {
    const date = this.appointmentDate(appointment);
    return date ? date.getTime() : null;
  }
}
