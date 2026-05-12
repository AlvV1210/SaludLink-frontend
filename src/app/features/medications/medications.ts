import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Medication, MedicationRequest } from '../../core/models/medication.model';
import { MedicationService } from '../../core/services/medication.service';

@Component({
  selector: 'app-medications',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './medications.html',
  styleUrl: './medications.scss',
})
export class MedicationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly medicationService = inject(MedicationService);

  @ViewChild('nameInput') private readonly nameInput?: ElementRef<HTMLInputElement>;

  medications: Medication[] = [];
  loadingMedicationId: number | null = null;
  savingMedication = false;

  dailyReminders: Reminder[] = [
    { id: 1, medicationName: 'Ibuprofeno', time: '08:00', taken: false },
    { id: 2, medicationName: 'Vitamina D', time: '12:00', taken: true },
    { id: 3, medicationName: 'Paracetamol', time: '20:00', taken: false },
  ];

  medicationForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    dosage: ['', [Validators.required]],
    frequency: ['', [Validators.required]],
    startDate: [null as Date | null, [Validators.required]],
    endDate: [null as Date | null, [Validators.required]],
  });

  get pendingRemindersCount(): number {
    return this.dailyReminders.filter((item) => !item.taken).length;
  }

  constructor() {
    this.loadMedications();
  }

  isInvalid(controlName: keyof MedicationFormValue): boolean {
    const control = this.medicationForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  saveMedication(): void {
    if (this.medicationForm.invalid || this.savingMedication) {
      this.medicationForm.markAllAsTouched();
      return;
    }

    const values = this.medicationForm.getRawValue();
    const request: MedicationRequest = {
      name: values.name.trim(),
      dosage: values.dosage.trim(),
      frequency: values.frequency.trim(),
      startDate: this.toApiDate(values.startDate),
      endDate: this.toApiDate(values.endDate),
    };

    this.savingMedication = true;
    this.medicationService.addMedication(request).subscribe({
      next: (createdMedication) => {
        this.medications = [createdMedication, ...this.medications];
        this.dailyReminders = [
          {
            id: Date.now(),
            medicationName: createdMedication.name,
            time: '09:00',
            taken: false,
          },
          ...this.dailyReminders,
        ];
        this.medicationForm.reset({
          name: '',
          dosage: '',
          frequency: '',
          startDate: null,
          endDate: null,
        });
      },
      error: () => {
        this.savingMedication = false;
      },
      complete: () => {
        this.savingMedication = false;
      },
    });
  }

  deactivateMedication(id: number): void {
    if (this.loadingMedicationId !== null) {
      return;
    }
    this.loadingMedicationId = id;
    this.medicationService.deactivateMedication(id).subscribe({
      next: () => {
        this.medications = this.medications.map((med) =>
          med.id === id ? { ...med, active: false } : med,
        );
      },
      complete: () => {
        this.loadingMedicationId = null;
      },
      error: () => {
        this.loadingMedicationId = null;
      },
    });
  }

  markAsTaken(reminderId: number): void {
    this.dailyReminders = this.dailyReminders.map((item) =>
      item.id === reminderId ? { ...item, taken: true } : item,
    );
  }

  focusForm(): void {
    const formElement = document.querySelector('.form-card');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.nameInput?.nativeElement.focus();
    // Ejemplo para usar desde otro feature:
    // this.router.navigate(['/medications']);
  }

  private loadMedications(): void {
    this.medicationService.getMedicationsByPatient().subscribe({
      next: (response) => {
        this.medications = response;
      },
      error: () => {
        this.medications = [
          {
            id: 0,
            name: 'Ibuprofeno',
            dosage: '250 mg',
            frequency: 'Cada 8 horas',
            startDate: '2026-10-12',
            endDate: '2026-10-14',
            active: true,
          },
        ];
      },
    });
  }

  private toApiDate(value: Date | null): string {
    if (!value) {
      return '';
    }
    const yyyy = value.getFullYear();
    const mm = `${value.getMonth() + 1}`.padStart(2, '0');
    const dd = `${value.getDate()}`.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

type MedicationFormValue = {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date | null;
  endDate: Date | null;
};

interface Reminder {
  id: number;
  medicationName: string;
  time: string;
  taken: boolean;
}
