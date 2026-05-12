import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import {
  distinctUntilChanged,
  finalize,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import {
  AppointmentModality,
  Doctor,
} from '../../../core/models/appointment.model';
import { AppointmentService } from '../../../core/services/appointment.service';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatError,
    MatFormField,
    MatHint,
    MatLabel,
    MatSuffix,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSnackBarModule,
    RouterLink,
  ],
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.scss',
})
export class AppointmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form: FormGroup = this.fb.group({
    specialty: [null as string | null, Validators.required],
    doctorId: [null as number | null, Validators.required],
    date: [null as Date | null, Validators.required],
    time: [
      '09:00',
      [Validators.required, Validators.pattern(/^([0-1]\d|2[0-3]):[0-5]\d$/)],
    ],
    modality: [AppointmentModality.inPerson, Validators.required],
    notes: [''],
  });

  protected readonly specialties = signal<string[]>([]);
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly isSubmitting = signal(false);
  protected readonly isLoadingMeta = signal(true);
  protected readonly AppointmentModality = AppointmentModality;
  protected readonly minDate = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  })();

  ngOnInit(): void {
    this.appointmentService
      .getSpecialties()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingMeta.set(false)),
      )
      .subscribe({
        next: (list) => this.specialties.set([...list].sort()),
        error: () => {
          this.snackBar.open('No se pudieron cargar las especialidades', 'Cerrar', {
            duration: 4000,
          });
        },
      });

    this.form
      .get('specialty')!
      .valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        startWith(this.form.get('specialty')?.value as string | null),
        distinctUntilChanged(),
        tap(() => {
          this.form.get('doctorId')?.setValue(null);
        }),
        switchMap((specialty) =>
          specialty
            ? this.appointmentService.getDoctorsBySpecialty(specialty)
            : of([] as Doctor[]),
        ),
      )
      .subscribe((list) => this.doctors.set(list));
  }

  private combineToIso(d: Date, time: string): string {
    const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
    const out = new Date(d);
    out.setHours(hh, mm, 0, 0);
    return out.toISOString();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue() as {
      doctorId: number;
      date: Date;
      time: string;
      modality: string;
      notes: string;
    };
    this.isSubmitting.set(true);
    this.appointmentService
      .createAppointment({
        doctorId: raw.doctorId,
        appointmentDate: this.combineToIso(raw.date, raw.time),
        modality: raw.modality,
        notes: raw.notes?.trim() ? raw.notes.trim() : undefined,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Cita confirmada', 'Cerrar', { duration: 3000 });
          void this.router.navigate(['/appointments']);
        },
        error: () => {
          this.snackBar.open('No se pudo confirmar la cita', 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }
}
