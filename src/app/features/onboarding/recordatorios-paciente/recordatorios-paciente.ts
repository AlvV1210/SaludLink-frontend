import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { MedicationReminder, MedicationService } from '../../../core/services/medication.service';
import { Medication } from '../../../shared/models/medication.model';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

type ViewMode = 'empty' | 'activated' | 'list' | 'form' | 'alerts' | 'missed' | 'notify-preview';
type ListTab = 'pending' | 'taken' | 'skipped';
type FormStep = 1 | 2;
type EndType = 'indefinido' | 'fecha';

interface ReminderTimeSlot {
  time: string;
  note: string;
}

interface ReminderFormState {
  name: string;
  dosage: string;
  route: string;
  treatmentReason: string;
  startDate: string;
  endType: EndType;
  endDate: string;
  frequencyPerDay: 1 | 2 | 3;
  weekDays: boolean[];
  timeSlots: ReminderTimeSlot[];
}

interface MedicationBundle {
  medication: Medication;
  reminders: MedicationReminder[];
}

interface ReminderListEntry {
  id: number;
  virtual: boolean;
  medication: Medication;
  reminder: MedicationReminder;
  status: ListTab;
  subtitle: string;
  statusLabel: string;
}

const ALERT_STORAGE_KEY = 'saludlink.reminderAlerts';

interface AlertSettings {
  sound: string;
  volume: number;
  doNotDisturb: boolean;
  morningReminder: boolean;
  eveningReminder: boolean;
  vibration: boolean;
}

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  sound: 'Campana suave',
  volume: 70,
  doNotDisturb: false,
  morningReminder: true,
  eveningReminder: true,
  vibration: true,
};

interface MissedDoseItem {
  id: string;
  medication: string;
  scheduledAt: string;
  status: string;
}

const MISSED_GRACE_MS = 30 * 60 * 1000;

const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const WEEKDAY_FORM_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAY_FORM_NAMES = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo',
];
const ROUTE_OPTIONS = ['Oral', 'Topica', 'Inyectable'];
const FREQUENCY_OPTIONS: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 1, label: '1 vez/dia' },
  { value: 2, label: '2 veces/dia' },
  { value: 3, label: '3 veces/dia' },
];
const DEFAULT_TIME_SLOTS: Record<1 | 2 | 3, ReminderTimeSlot[]> = {
  1: [{ time: '08:00', note: 'Con desayuno' }],
  2: [
    { time: '08:00', note: 'Con desayuno' },
    { time: '20:00', note: 'Con cena' },
  ],
  3: [
    { time: '08:00', note: 'Con desayuno' },
    { time: '14:00', note: 'Con almuerzo' },
    { time: '20:00', note: 'Con cena' },
  ],
};
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

@Component({
  selector: 'app-recordatorios-paciente',
  imports: [CommonModule, FormsModule, PatientDashboardShellComponent],
  templateUrl: './recordatorios-paciente.html',
  styleUrls: ['./recordatorios-paciente.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class RecordatoriosPacienteComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly medications = inject(MedicationService);

  protected readonly bundles = signal<MedicationBundle[]>([]);
  protected readonly viewMode = signal<ViewMode>('empty');
  protected readonly formStep = signal<FormStep>(1);
  protected readonly listTab = signal<ListTab>('pending');
  protected readonly returnView = signal<ViewMode>('empty');
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly alertSounds = ['Campana suave', 'Tono clasico', 'Pulso corto', 'Silencioso'];
  protected alertSettings: AlertSettings = { ...DEFAULT_ALERT_SETTINGS };
  protected readonly missedDoses = signal<MissedDoseItem[]>([
    {
      id: 'miss-1',
      medication: 'Metformina 850mg',
      scheduledAt: 'Ayer 20:00',
      status: 'No tomado',
    },
    {
      id: 'miss-2',
      medication: 'Losartan 50mg',
      scheduledAt: 'Hoy 08:00',
      status: 'Pendiente',
    },
  ]);
  protected readonly form = signal<ReminderFormState>(this.createDefaultForm());
  protected readonly routeOptions = ROUTE_OPTIONS;
  protected readonly frequencyOptions = FREQUENCY_OPTIONS;
  protected readonly weekdayShort = WEEKDAY_FORM_LABELS;

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly featured = computed(() => {
    const items = this.bundles();
    return items.find((item) => item.medication.active !== false) ?? items[0] ?? null;
  });

  protected readonly medicationSubtitle = computed(() => {
    const bundle = this.featured();
    if (!bundle) {
      return 'N/A';
    }
    const parts = [
      bundle.medication.instructions?.trim(),
      bundle.medication.dosage?.trim(),
    ].filter(Boolean);
    return parts.join(' - ') || bundle.medication.frequency || 'N/A';
  });

  protected readonly scheduleChips = computed(() => {
    const bundle = this.featured();
    if (!bundle) {
      return [] as string[];
    }

    const timeLabels = [...new Set(
      bundle.reminders
        .map((reminder) => this.formatTimeLabel(reminder.scheduledTime))
        .filter((label) => label !== 'N/A'),
    )];

    const chips = [...timeLabels];
    const frequency = bundle.medication.frequency?.trim();
    if (frequency) {
      chips.push(frequency);
    }
    return chips;
  });

  protected readonly allReminderItems = computed(() => {
    const todayIso = this.todayIso();
    const entries: ReminderListEntry[] = [];

    for (const bundle of this.bundles()) {
      if (!this.isMedicationActiveOnDate(bundle.medication, todayIso)) {
        continue;
      }

      for (const dose of this.buildTodayDoses(bundle, todayIso)) {
        const status = this.resolveReminderStatus(dose.reminder, bundle.medication);
        entries.push({
          id: dose.reminder.id,
          virtual: dose.virtual,
          medication: bundle.medication,
          reminder: dose.reminder,
          status,
          subtitle: this.buildReminderSubtitle(bundle.medication, dose.reminder),
          statusLabel: this.buildStatusLabel(dose.reminder, status),
        });
      }
    }

    return entries.sort((a, b) => {
      const aDate = this.parseReminderDateTime(a.reminder)?.getTime() ?? 0;
      const bDate = this.parseReminderDateTime(b.reminder)?.getTime() ?? 0;
      return aDate - bDate;
    });
  });

  protected readonly tabCounts = computed(() => {
    const items = this.allReminderItems();
    return {
      pending: items.filter((item) => item.status === 'pending').length,
      taken: items.filter((item) => item.status === 'taken').length,
      skipped: items.filter((item) => item.status === 'skipped').length,
    };
  });

  protected readonly filteredListItems = computed(() => {
    const tab = this.listTab();
    return this.allReminderItems().filter((item) => item.status === tab);
  });

  protected readonly listHeaderSubtitle = computed(() => {
    const today = new Date();
    const weekday = WEEKDAY_NAMES[today.getDay()];
    const month = MONTH_NAMES[today.getMonth()];
    const todayIso = this.todayIso();
    const count = this.allReminderItems().filter(
      (item) => item.reminder.reminderDate === todayIso,
    ).length;
    return `${weekday}, ${today.getDate()} de ${month} - ${count} dosis programadas`;
  });

  protected readonly nextNotification = computed(() => {
    const bundle = this.featured();
    if (!bundle) {
      return { headline: 'Proxima notificacion: N/A', detail: '' };
    }

    const todayIso = this.todayIso();
    if (!this.isMedicationActiveOnDate(bundle.medication, todayIso)) {
      return { headline: 'Proxima notificacion: N/A', detail: '' };
    }

    const now = new Date();
    const upcoming = this.buildTodayDoses(bundle, todayIso)
      .map((dose) => ({
        reminder: dose.reminder,
        status: this.resolveReminderStatus(dose.reminder, bundle.medication),
        date: this.parseReminderDateTime(dose.reminder),
      }))
      .filter((entry) => entry.status === 'pending' && entry.date && entry.date.getTime() >= now.getTime())
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());

    if (upcoming.length === 0) {
      return { headline: 'Proxima notificacion: N/A', detail: '' };
    }

    const next = upcoming[0];
    const when = next.date!;
    const timeLabel = this.formatTimeLabel(next.reminder.scheduledTime);
    const diffMs = when.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let detail = '';
    if (hours > 0) {
      detail = `En ${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      detail = `En ${minutes}min`;
    }

    return {
      headline: `Proxima notificacion: hoy ${timeLabel}`,
      detail,
    };
  });

  ngOnInit(): void {
    const raw = sessionStorage.getItem(ALERT_STORAGE_KEY);
    if (raw) {
      try {
        this.alertSettings = { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(raw) };
      } catch {
        this.alertSettings = { ...DEFAULT_ALERT_SETTINGS };
      }
    }
    this.loadMedications();
  }

  protected openForm(): void {
    const current = this.viewMode();
    this.returnView.set(current === 'form' ? 'activated' : current);
    this.formStep.set(1);
    this.form.set(this.createDefaultForm());
    this.viewMode.set('form');
    this.errorMessage.set('');
  }

  protected cancelForm(): void {
    this.formStep.set(1);
    this.form.set(this.createDefaultForm());
    const target = this.returnView();
    if (target === 'list' || target === 'activated') {
      this.viewMode.set(target);
      return;
    }
    this.showActivated();
  }

  protected continueFromStep1(): void {
    const body = this.form();
    if (!body.name.trim() || !body.dosage.trim()) {
      this.errorMessage.set('Completa nombre y dosis del medicamento.');
      return;
    }
    if (!body.startDate.trim()) {
      this.errorMessage.set('Indica la fecha de inicio.');
      return;
    }
    if (body.endType === 'fecha' && !body.endDate.trim()) {
      this.errorMessage.set('Indica la fecha de fin o elige Indefinido.');
      return;
    }
    this.errorMessage.set('');
    this.formStep.set(2);
  }

  protected backToStep1(): void {
    this.errorMessage.set('');
    this.formStep.set(1);
  }

  protected selectFrequencyPerDay(value: 1 | 2 | 3): void {
    this.form.update((current) => ({
      ...current,
      frequencyPerDay: value,
      timeSlots: DEFAULT_TIME_SLOTS[value].map((slot) => ({ ...slot })),
    }));
  }

  protected toggleWeekDay(index: number): void {
    this.form.update((current) => {
      const weekDays = [...current.weekDays];
      weekDays[index] = !weekDays[index];
      return { ...current, weekDays };
    });
  }

  protected updateTimeSlot(index: number, field: keyof ReminderTimeSlot, value: string): void {
    this.form.update((current) => {
      const timeSlots = current.timeSlots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot,
      );
      return { ...current, timeSlots };
    });
  }

  protected addTimeSlot(): void {
    this.form.update((current) => ({
      ...current,
      timeSlots: [...current.timeSlots, { time: '12:00', note: '' }],
    }));
  }

  protected removeTimeSlot(index: number): void {
    this.form.update((current) => {
      if (current.timeSlots.length <= 1) {
        return current;
      }
      return {
        ...current,
        timeSlots: current.timeSlots.filter((_, slotIndex) => slotIndex !== index),
      };
    });
  }

  protected stepTwoSubtitle(): string {
    const name = this.form().name.trim();
    return name ? `Cuando debes tomar ${name}?` : 'Cuando debes tomar el medicamento?';
  }

  protected formatTimePreview(raw: string): string {
    return this.formatTimeLabel(raw.length === 5 ? `${raw}:00` : raw);
  }

  protected showList(): void {
    const counts = this.tabCounts();
    if (counts.pending > 0) {
      this.listTab.set('pending');
    } else if (counts.taken > 0) {
      this.listTab.set('taken');
    } else if (counts.skipped > 0) {
      this.listTab.set('skipped');
    } else {
      this.listTab.set('pending');
    }
    this.viewMode.set('list');
  }

  protected selectListTab(tab: ListTab): void {
    this.listTab.set(tab);
  }

  protected personalizeAlerts(): void {
    this.returnView.set(this.viewMode() === 'form' ? 'activated' : this.viewMode());
    this.viewMode.set('alerts');
  }

  protected openMissedDoses(): void {
    this.returnView.set(this.viewMode());
    this.viewMode.set('missed');
  }

  protected openNotifyPreview(): void {
    this.returnView.set(this.viewMode());
    this.viewMode.set('notify-preview');
  }

  protected saveAlertSettings(): void {
    sessionStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(this.alertSettings));
    this.closeSubView();
  }

  protected closeSubView(): void {
    const target = this.returnView();
    if (target === 'list' || target === 'activated' || target === 'empty') {
      this.viewMode.set(target);
      return;
    }
    this.showActivated();
  }

  protected showActivated(): void {
    this.viewMode.set(this.bundles().length > 0 ? 'activated' : 'empty');
  }

  protected saveReminder(): void {
    const body = this.form();
    if (!body.name.trim() || !body.dosage.trim()) {
      this.errorMessage.set('Completa nombre y dosis del medicamento.');
      this.formStep.set(1);
      return;
    }

    const times = body.timeSlots.map((slot) => slot.time.trim()).filter(Boolean);
    if (times.length === 0) {
      this.errorMessage.set('Agrega al menos un horario.');
      return;
    }

    const instructions = [body.route.trim(), body.treatmentReason.trim()].filter(Boolean).join(' - ');
    const frequency = this.buildFrequencySummary(body);

    this.saving.set(true);
    this.errorMessage.set('');
    this.medications
      .addMedication({
        name: body.name.trim(),
        dosage: body.dosage.trim(),
        frequency,
        startDate: body.startDate.trim() || undefined,
        endDate: body.endType === 'fecha' ? body.endDate.trim() || undefined : undefined,
        instructions: instructions || undefined,
      })
      .pipe(
        switchMap((medication) => {
          const today = this.todayIso();
          return forkJoin(
            times.map((scheduledTime) =>
              this.medications.createReminder(medication.id, {
                scheduledTime: scheduledTime.length === 5 ? `${scheduledTime}:00` : scheduledTime,
                reminderDate: today,
              }),
            ),
          ).pipe(map(() => medication));
        }),
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.formStep.set(1);
          this.form.set(this.createDefaultForm());
          this.loadMedications(true);
        },
        error: (error) => {
          this.saving.set(false);
          this.errorMessage.set(apiErrorMessage(error, 'No se pudo activar el recordatorio.'));
        },
      });
  }

  protected updateFormField(field: keyof ReminderFormState, value: string): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  protected updateEndType(value: EndType): void {
    this.form.update((current) => ({
      ...current,
      endType: value,
      endDate: value === 'indefinido' ? '' : current.endDate,
    }));
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

  protected markTaken(entry: ReminderListEntry): void {
    if (entry.status !== 'pending') {
      return;
    }

    const scheduledTime =
      entry.reminder.scheduledTime.length === 5
        ? `${entry.reminder.scheduledTime}:00`
        : entry.reminder.scheduledTime;

    const markExisting = this.medications.markReminderTaken(entry.id);
    const createThenMark = this.medications
      .createReminder(entry.medication.id, {
        scheduledTime,
        reminderDate: entry.reminder.reminderDate,
      })
      .pipe(switchMap((created) => this.medications.markReminderTaken(created.id)));

    (entry.virtual ? createThenMark : markExisting).subscribe({
      next: () => this.loadMedications(false),
      error: (error) =>
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo registrar la toma.')),
    });
  }

  protected buildReminderSubtitle(medication: Medication, reminder: MedicationReminder): string {
    const parts = [
      medication.instructions?.trim(),
      medication.dosage?.trim(),
      this.formatTimeLabel(reminder.scheduledTime),
    ].filter(Boolean);
    return parts.join(' - ') || 'N/A';
  }

  protected resolveReminderStatus(reminder: MedicationReminder, medication: Medication): ListTab {
    const status = reminder.status?.toUpperCase();

    if (reminder.taken || status === 'TAKEN') {
      return 'taken';
    }

    const dateIso = reminder.reminderDate;
    if (!this.isMedicationActiveOnDate(medication, dateIso)) {
      return 'skipped';
    }

    const todayIso = this.todayIso();
    if (dateIso > todayIso) {
      return 'pending';
    }

    if (dateIso < todayIso) {
      return 'skipped';
    }

    if (status === 'MISSED' || status === 'SKIPPED') {
      return 'skipped';
    }

    const dateTime = this.parseReminderDateTime(reminder);
    if (!dateTime) {
      return 'pending';
    }

    if (dateTime.getTime() + MISSED_GRACE_MS < Date.now()) {
      return 'skipped';
    }

    return 'pending';
  }

  protected buildStatusLabel(reminder: MedicationReminder, status: ListTab): string {
    if (status === 'taken') {
      if (reminder.takenAt) {
        const takenDate = new Date(reminder.takenAt);
        if (!Number.isNaN(takenDate.getTime())) {
          const hours = takenDate.getHours();
          const minutes = String(takenDate.getMinutes()).padStart(2, '0');
          const hour12 = hours % 12 || 12;
          return `${hour12}:${minutes}`;
        }
      }
      return this.formatTimeShort(reminder.scheduledTime);
    }
    if (status === 'skipped') {
      return 'Omitido';
    }
    return 'Pendiente';
  }

  private formatTimeShort(raw: string | undefined): string {
    if (!raw) {
      return 'N/A';
    }
    const [hoursText, minutesText = '00'] = raw.split(':');
    const hours = parseInt(hoursText, 10);
    if (Number.isNaN(hours)) {
      return 'N/A';
    }
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutesText.padStart(2, '0')}`;
  }

  private loadMedications(preferActivated = false): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.medications
      .getMedicationsByPatient()
      .pipe(
        switchMap((medications) => {
          if (medications.length === 0) {
            return of([] as MedicationBundle[]);
          }
          return forkJoin(
            medications.map((medication) =>
              this.medications.getReminders(medication.id).pipe(
                map((reminders) => ({ medication, reminders })),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: (items) => {
          this.loading.set(false);
          this.bundles.set(items);
          if (items.length === 0) {
            this.viewMode.set('empty');
            return;
          }
          if (preferActivated || this.viewMode() === 'empty' || this.viewMode() === 'form') {
            this.viewMode.set('activated');
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.bundles.set([]);
          this.viewMode.set('empty');
          this.errorMessage.set(apiErrorMessage(error, 'No se pudieron cargar los recordatorios.'));
        },
      });
  }

  private parseReminderDateTime(reminder: MedicationReminder): Date | null {
    const time = reminder.scheduledTime?.slice(0, 5) ?? '';
    if (!reminder.reminderDate || !time) {
      return null;
    }
    const date = new Date(`${reminder.reminderDate}T${time}:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatTimeLabel(raw: string | undefined): string {
    if (!raw) {
      return 'N/A';
    }
    const [hoursText, minutesText = '00'] = raw.split(':');
    const hours = parseInt(hoursText, 10);
    if (Number.isNaN(hours)) {
      return 'N/A';
    }
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutesText.padStart(2, '0')} ${period}`;
  }

  private formatShortDate(date: Date): string {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private buildTodayDoses(
    bundle: MedicationBundle,
    todayIso: string,
  ): Array<{ reminder: MedicationReminder; virtual: boolean }> {
    const scheduleTimes = this.extractScheduleTimes(bundle.reminders);
    if (scheduleTimes.length === 0) {
      return [];
    }

    return scheduleTimes.map((time) => {
      const existing = bundle.reminders.find(
        (reminder) =>
          reminder.reminderDate === todayIso &&
          this.normalizeTime(reminder.scheduledTime) === time,
      );

      if (existing) {
        return { reminder: existing, virtual: false };
      }

      return {
        reminder: {
          id: 0,
          medicationId: bundle.medication.id,
          scheduledTime: time.length === 5 ? `${time}:00` : time,
          reminderDate: todayIso,
          taken: false,
          status: 'PENDING',
        },
        virtual: true,
      };
    });
  }

  private extractScheduleTimes(reminders: MedicationReminder[]): string[] {
    const times = new Set<string>();
    for (const reminder of reminders) {
      const normalized = this.normalizeTime(reminder.scheduledTime);
      if (normalized) {
        times.add(normalized);
      }
    }
    return [...times].sort();
  }

  private normalizeTime(raw: string | undefined): string {
    if (!raw) {
      return '';
    }
    const [hours = '', minutes = ''] = raw.split(':');
    if (!hours) {
      return '';
    }
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  private isMedicationActiveOnDate(medication: Medication, dateIso: string): boolean {
    if (medication.active === false) {
      return false;
    }
    if (medication.startDate && dateIso < medication.startDate) {
      return false;
    }
    if (medication.endDate && dateIso > medication.endDate) {
      return false;
    }
    return this.matchesFrequencyDay(medication.frequency, dateIso);
  }

  private matchesFrequencyDay(frequency: string | undefined, dateIso: string): boolean {
    if (!frequency?.trim()) {
      return true;
    }

    const normalized = frequency.toLowerCase();
    if (normalized.includes('todos los dias')) {
      return true;
    }

    const date = new Date(`${dateIso}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return true;
    }

    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const dayName = WEEKDAY_FORM_NAMES[dayIndex].toLowerCase();
    const shortName = WEEKDAY_FORM_LABELS[dayIndex].toLowerCase();

    return (
      normalized.includes(dayName) ||
      normalized.includes(`${shortName},`) ||
      normalized.includes(`${shortName} `) ||
      normalized.endsWith(shortName)
    );
  }

  private todayIso(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  private createDefaultForm(): ReminderFormState {
    return {
      name: '',
      dosage: '',
      route: 'Oral',
      treatmentReason: '',
      startDate: this.todayIso(),
      endType: 'indefinido',
      endDate: '',
      frequencyPerDay: 2,
      weekDays: [true, true, true, true, true, true, true],
      timeSlots: DEFAULT_TIME_SLOTS[2].map((slot) => ({ ...slot })),
    };
  }

  private buildFrequencySummary(body: ReminderFormState): string {
    const perDay =
      FREQUENCY_OPTIONS.find((option) => option.value === body.frequencyPerDay)?.label ??
      `${body.frequencyPerDay} veces/dia`;
    const days = this.buildWeekDaySummary(body.weekDays);
    return `${perDay} - ${days}`;
  }

  private buildWeekDaySummary(weekDays: boolean[]): string {
    if (weekDays.every(Boolean)) {
      return 'Todos los dias';
    }
    const selected = weekDays
      .map((active, index) => (active ? WEEKDAY_FORM_NAMES[index] : null))
      .filter(Boolean);
    return selected.length > 0 ? selected.join(', ') : 'Sin dias seleccionados';
  }
}
