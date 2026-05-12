import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type PatientSection = 'dashboard' | 'citas' | 'salas' | 'recordatorios' | 'salud-mental' | 'historial' | 'perfil';
type Modalidad = 'Virtual' | 'Presencial';
type EstadoCita = 'Confirmada' | 'Programada' | 'Reprogramada' | 'Cancelada';
type PaymentMethod = 'Tarjeta' | 'Yape' | 'Plin' | 'Transferencia' | 'Pago presencial';
type ReminderFrequency = '1 vez/día' | '2 veces/día' | '3 veces/día';

interface DoctorOption {
  id: number;
  nombreCompleto: string;
  especialidad: string;
  sede: string;
  foto: string;
  modalidades: Modalidad[];
  horarios: {
    id: string;
    fecha: string;
    hora: string;
    modalidad: Modalidad;
    sede: string;
    link?: string;
  }[];
}

interface PatientAppointment {
  id: string;
  doctor: string;
  especialidad: string;
  fecha: string;
  hora: string;
  modalidad: Modalidad;
  sede: string;
  estado: EstadoCita;
  tipo: 'Virtual' | 'Presencial';
}

interface ReminderItem {
  id: string;
  medicamento: string;
  dosis: string;
  via: string;
  motivo: string;
  inicio: string;
  fin: string;
  frecuencia: ReminderFrequency;
  hora: string;
  activo: boolean;
}

interface ChatDoctor {
  id: number;
  nombre: string;
  especialidad: string;
  online: boolean;
  horario: string;
}

interface ChatMessage {
  from: 'me' | 'doctor';
  text: string;
  time: string;
}

interface PatientProfile {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  dni: string;
  direccion: string;
  fechaNacimiento: string;
  genero: string;
  foto: string;
  estado: 'Activa' | 'Inactiva';
}

interface MedicalDocumentItem {
  id: string;
  nombre: string;
  tipoArchivo: string;
  fecha: string;
  hora: string;
  estado: 'Guardado' | 'Pendiente';
  resumen: string;
  sizeLabel: string;
  observaciones: string;
  previewUrl?: string;
}

interface MentalMoodOption {
  id: string;
  emoji: string;
  label: string;
}

interface MentalResourceItem {
  id: string;
  title: string;
  description: string;
  minutes: string;
}

@Component({
  selector: 'app-panel-paciente',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-paciente.html',
  styleUrl: './panel-paciente.scss',
})
export class PanelPacienteComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly activeSection = signal<PatientSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly bookingStep = signal<'doctores' | 'horarios' | 'resumen' | 'pago' | 'exito'>('doctores');
  protected readonly selectedDoctor = signal<DoctorOption | null>(null);
  protected readonly selectedHorarioId = signal<string | null>(null);
  protected readonly selectedPayment = signal<PaymentMethod>('Tarjeta');
  protected readonly paymentMethods: PaymentMethod[] = ['Tarjeta', 'Yape', 'Plin', 'Transferencia', 'Pago presencial'];
  protected readonly showBookingFlow = signal(false);
  protected readonly showSosModal = signal(false);
  protected readonly showUploadModal = signal(false);
  protected readonly selectedVirtualAppointmentId = signal<string | null>(null);
  protected readonly selectedDocumentId = signal<string | null>(null);
  protected readonly selectedChatDoctorId = signal<number | null>(null);
  protected readonly chatInput = signal('');
  protected readonly showReminderForm = signal(false);
  protected readonly reminderStep = signal<1 | 2>(1);
  protected readonly uploadStep = signal<'upload' | 'form'>('upload');
  protected readonly uploadProgress = signal(0);
  protected readonly pendingFile = signal<File | null>(null);
  protected readonly selectedMoodId = signal('normal');
  protected editingReminderId: string | null = null;
  protected editingProfile = false;

  protected readonly appointments = signal<PatientAppointment[]>([
    {
      id: 'SL-PT-10421',
      doctor: 'Dr. Juan Perez',
      especialidad: 'Cardiología',
      fecha: '2026-05-18',
      hora: '14:30',
      modalidad: 'Virtual',
      sede: 'Sede Central',
      estado: 'Confirmada',
      tipo: 'Virtual',
    },
    {
      id: 'SL-PT-10612',
      doctor: 'Dra. Maria Rios',
      especialidad: 'Psicología',
      fecha: '2026-05-20',
      hora: '18:00',
      modalidad: 'Virtual',
      sede: 'Sala Telemedicina',
      estado: 'Programada',
      tipo: 'Virtual',
    },
  ]);

  protected readonly doctors = signal<DoctorOption[]>(this.getDoctorCatalog());
  protected readonly reminders = signal<ReminderItem[]>([
    {
      id: 'REM-501',
      medicamento: 'Metformina 850mg',
      dosis: '1 tableta',
      via: 'Oral',
      motivo: 'Diabetes tipo 2',
      inicio: '2026-05-04',
      fin: 'Indefinido',
      frecuencia: '2 veces/día',
      hora: '08:00',
      activo: true,
    },
  ]);
  protected readonly chatDoctors = signal<ChatDoctor[]>([
    { id: 1, nombre: 'Dr. Juan Perez', especialidad: 'Cardiología', online: true, horario: '08:00 - 17:00' },
    { id: 2, nombre: 'Dra. Maria Rios', especialidad: 'Psicología', online: true, horario: '10:00 - 19:00' },
    { id: 3, nombre: 'Dr. Luis Mejia', especialidad: 'Medicina General', online: false, horario: '09:00 - 13:00' },
  ]);
  protected readonly chatMessagesByDoctor = signal<Record<number, ChatMessage[]>>({
    1: [
      { from: 'doctor', text: 'Hola, recuerda conectarte 10 minutos antes.', time: '09:15' },
      { from: 'me', text: 'Gracias doctor, estaré puntual.', time: '09:16' },
    ],
    2: [{ from: 'doctor', text: '¿Cómo te sentiste esta semana?', time: '18:20' }],
  });
  protected readonly documents = signal<MedicalDocumentItem[]>([
    {
      id: 'DOC-301',
      nombre: 'Examen glucosa mayo',
      tipoArchivo: 'PDF',
      fecha: '2026-05-03',
      hora: '10:15',
      estado: 'Guardado',
      resumen: 'Resultados de control metabólico.',
      sizeLabel: '1.2 MB',
      observaciones: 'Llevar a próxima consulta de cardiología.',
    },
  ]);
  protected readonly mentalMoods: MentalMoodOption[] = [
    { id: 'genial', emoji: '😁', label: 'Genial' },
    { id: 'bien', emoji: '🙂', label: 'Bien' },
    { id: 'normal', emoji: '😐', label: 'Normal' },
    { id: 'mal', emoji: '😟', label: 'Mal' },
    { id: 'muy-mal', emoji: '😢', label: 'Muy mal' },
  ];
  protected readonly mentalResources: MentalResourceItem[] = [
    {
      id: 'viaje-breve',
      title: 'Viaje guiado de respiración',
      description: 'Relajación y respiración consciente para bajar ansiedad.',
      minutes: '6 min',
    },
    {
      id: 'mindful-break',
      title: 'Pausa de bienestar',
      description: 'Micro rutina para recuperar enfoque y reducir tensión.',
      minutes: '4 min',
    },
    {
      id: 'sueno-saludable',
      title: 'Higiene del sueño',
      description: 'Recomendaciones prácticas para dormir mejor.',
      minutes: '5 min',
    },
  ];

  protected reminderForm = {
    medicamento: '',
    dosis: '',
    via: 'Oral',
    motivo: '',
    inicio: '',
    fin: 'Indefinido',
    frecuencia: '2 veces/día' as ReminderFrequency,
    hora: '',
  };

  protected readonly patientProfile = signal<PatientProfile>(this.getInitialProfile());
  protected profileDraft: PatientProfile = this.patientProfile();
  protected documentForm = {
    nombre: '',
    fecha: '',
    hora: '',
    observaciones: '',
  };

  protected readonly quickSummary = computed(() => {
    const citas = this.appointments();
    return {
      total: citas.length,
      activas: citas.filter((cita) => cita.estado !== 'Cancelada').length,
      virtuales: citas.filter((cita) => cita.modalidad === 'Virtual' && cita.estado !== 'Cancelada').length,
      presenciales: citas.filter((cita) => cita.modalidad === 'Presencial' && cita.estado !== 'Cancelada').length,
      mental: citas.filter((cita) => cita.especialidad.toLowerCase().includes('psic')).length,
      reminders: this.reminders().filter((item) => item.activo).length,
      documentos: this.documents().length,
    };
  });

  protected readonly nextAppointment = computed(() => {
    return this.appointments().find((cita) => cita.estado !== 'Cancelada') ?? null;
  });

  protected readonly alerts = computed(() => {
    const messages: string[] = [];
    if (this.appointments().some((item) => item.estado === 'Cancelada')) {
      messages.push('Tienes citas canceladas que requieren reprogramación.');
    }
    if (this.reminders().some((item) => !item.activo)) {
      messages.push('Hay recordatorios desactivados en tu tratamiento.');
    }
    if (messages.length === 0) {
      messages.push('Todo en orden. No tienes alertas pendientes.');
    }
    return messages;
  });

  protected readonly chartData = computed(() => {
    const total = Math.max(this.appointments().length, 1);
    const virtuales = this.quickSummary().virtuales;
    const presenciales = this.quickSummary().presenciales;
    return [
      { label: 'Virtuales', value: virtuales, width: Math.max(18, Math.round((virtuales / total) * 100)) },
      { label: 'Presenciales', value: presenciales, width: Math.max(18, Math.round((presenciales / total) * 100)) },
    ];
  });

  protected readonly selectedHorario = computed(() => {
    const doctor = this.selectedDoctor();
    const horarioId = this.selectedHorarioId();
    if (!doctor || !horarioId) {
      return null;
    }
    return doctor.horarios.find((item) => item.id === horarioId) ?? null;
  });

  protected readonly bookingPrice = computed(() => {
    const horario = this.selectedHorario();
    if (!horario) {
      return 'S/ 0.00';
    }
    return horario.modalidad === 'Virtual' ? 'S/ 85.00' : 'S/ 120.00';
  });

  protected readonly virtualAppointments = computed(() =>
    this.appointments().filter((item) => item.modalidad === 'Virtual' && item.estado !== 'Cancelada'),
  );

  protected readonly selectedVirtualAppointment = computed(() => {
    const id = this.selectedVirtualAppointmentId();
    if (!id) {
      return null;
    }
    return this.virtualAppointments().find((item) => item.id === id) ?? null;
  });

  protected readonly selectedChatDoctor = computed(() => {
    const id = this.selectedChatDoctorId();
    if (!id) {
      return null;
    }
    return this.chatDoctors().find((doctor) => doctor.id === id) ?? null;
  });

  protected readonly activeChatMessages = computed(() => {
    const doctor = this.selectedChatDoctor();
    if (!doctor) {
      return [];
    }
    return this.chatMessagesByDoctor()[doctor.id] ?? [];
  });

  protected readonly onlineChatDoctors = computed(() => this.chatDoctors().filter((doctor) => doctor.online).length);

  protected readonly selectedDocument = computed(() => {
    const id = this.selectedDocumentId();
    if (!id) {
      return null;
    }
    return this.documents().find((item) => item.id === id) ?? null;
  });

  protected goDashboard(): void {
    this.activeSection.set('dashboard');
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected selectMentalMood(moodId: string): void {
    this.selectedMoodId.set(moodId);
  }

  protected startMentalTest(): void {
    this.showToast('Test de bienestar emocional iniciado.');
  }

  protected openSection(section: PatientSection): void {
    this.activeSection.set(section);
  }

  protected openBookingFlow(): void {
    this.activeSection.set('citas');
    this.showBookingFlow.set(true);
    this.bookingStep.set('doctores');
    this.selectedDoctor.set(null);
    this.selectedHorarioId.set(null);
  }

  protected openUploadDocumentModal(): void {
    this.showUploadModal.set(true);
    this.uploadStep.set('upload');
    this.uploadProgress.set(0);
    this.pendingFile.set(null);
    this.resetDocumentForm();
  }

  protected closeUploadDocumentModal(): void {
    this.showUploadModal.set(false);
    this.uploadStep.set('upload');
    this.uploadProgress.set(0);
    this.pendingFile.set(null);
    this.resetDocumentForm();
  }

  protected handleDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected handleFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    this.prepareFile(file);
  }

  protected handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.prepareFile(file);
  }

  protected continueDocumentForm(): void {
    if (!this.pendingFile()) {
      return;
    }
    this.uploadStep.set('form');
  }

  protected goBackToUploadStep(): void {
    this.uploadStep.set('upload');
  }

  protected saveDocument(): void {
    const file = this.pendingFile();
    if (!file || this.documentForm.nombre.trim().length < 3 || !this.documentForm.fecha || !this.documentForm.hora) {
      return;
    }

    const docId = `DOC-${Math.floor(100 + Math.random() * 900)}`;
    const extension = file.name.split('.').pop()?.toUpperCase() ?? file.type.split('/').pop()?.toUpperCase() ?? 'ARCHIVO';
    const sizeLabel = file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(file.size / 1024)} KB`;
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

    this.documents.update((items) => [
      {
        id: docId,
        nombre: this.documentForm.nombre.trim(),
        tipoArchivo: extension,
        fecha: this.documentForm.fecha,
        hora: this.documentForm.hora,
        estado: 'Guardado',
        resumen: `${extension} subido por paciente`,
        sizeLabel,
        observaciones: this.documentForm.observaciones.trim() || 'Sin observaciones.',
        previewUrl,
      },
      ...items,
    ]);

    this.selectedDocumentId.set(docId);
    this.showUploadModal.set(false);
    this.uploadStep.set('upload');
    this.uploadProgress.set(0);
    this.pendingFile.set(null);
    this.resetDocumentForm();
    this.showToast('Documento guardado correctamente.');
  }

  protected selectDocument(id: string): void {
    this.selectedDocumentId.set(id);
  }

  protected deleteDocument(id: string): void {
    const current = this.documents().find((item) => item.id === id);
    if (current?.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
    }
    this.documents.update((items) => items.filter((item) => item.id !== id));
    if (this.selectedDocumentId() === id) {
      this.selectedDocumentId.set(null);
    }
    this.showToast('Documento eliminado.');
  }

  protected downloadDocument(id: string): void {
    const doc = this.documents().find((item) => item.id === id);
    if (!doc) {
      return;
    }
    const content = `Documento: ${doc.nombre}\nTipo: ${doc.tipoArchivo}\nFecha: ${doc.fecha} ${doc.hora}\nResumen: ${doc.resumen}\nObservaciones: ${doc.observaciones}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${doc.nombre.replace(/\s+/g, '_')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  protected selectDoctor(doctor: DoctorOption): void {
    this.selectedDoctor.set(doctor);
    this.selectedHorarioId.set(null);
    this.bookingStep.set('horarios');
  }

  protected chooseHorario(horarioId: string): void {
    this.selectedHorarioId.set(horarioId);
  }

  protected goToResumen(): void {
    if (!this.selectedDoctor() || !this.selectedHorario()) {
      return;
    }
    this.bookingStep.set('resumen');
  }

  protected goToPago(): void {
    this.bookingStep.set('pago');
  }

  protected setPaymentMethod(method: PaymentMethod): void {
    this.selectedPayment.set(method);
  }

  protected confirmPaymentAndReserve(): void {
    const doctor = this.selectedDoctor();
    const horario = this.selectedHorario();
    if (!doctor || !horario) {
      return;
    }

    const appointmentId = `SL-PT-${Math.floor(10000 + Math.random() * 89999)}`;
    this.appointments.update((items) => [
      {
        id: appointmentId,
        doctor: doctor.nombreCompleto,
        especialidad: doctor.especialidad,
        fecha: horario.fecha,
        hora: horario.hora,
        modalidad: horario.modalidad,
        sede: horario.sede,
        estado: 'Confirmada',
        tipo: horario.modalidad,
      },
      ...items,
    ]);
    this.bookingStep.set('exito');
    this.showToast(`Cita confirmada correctamente (${appointmentId}).`);
  }

  protected closeBookingFlow(): void {
    this.showBookingFlow.set(false);
    this.bookingStep.set('doctores');
    this.selectedDoctor.set(null);
    this.selectedHorarioId.set(null);
  }

  protected openVirtualRoom(citaId: string): void {
    this.selectedVirtualAppointmentId.set(citaId);
  }

  protected getVirtualLink(cita: PatientAppointment): string {
    return `https://meet.google.com/${cita.id.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 3)}-${Math.floor(
      Math.random() * 900 + 100,
    )}-saludlink`;
  }

  protected getRemainingText(_cita: PatientAppointment): string {
    return 'Faltan 15 minutos';
  }

  protected toggleSosModal(): void {
    this.showSosModal.update((value) => !value);
  }

  protected selectChatDoctor(doctorId: number): void {
    this.selectedChatDoctorId.set(doctorId);
    this.chatInput.set('');
  }

  protected updateChatInput(value: string): void {
    this.chatInput.set(value);
  }

  protected sendChatMessage(): void {
    const doctor = this.selectedChatDoctor();
    const text = this.chatInput().trim();
    if (!doctor || !text) {
      return;
    }
    if (!doctor.online) {
      this.showToast('Este médico está fuera de horario en este momento.');
      return;
    }

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.chatMessagesByDoctor.update((all) => ({
      ...all,
      [doctor.id]: [...(all[doctor.id] ?? []), { from: 'me', text, time }],
    }));
    this.chatInput.set('');
  }

  protected openReminderForm(): void {
    this.showReminderForm.set(true);
    this.reminderStep.set(1);
    this.resetReminderForm();
    this.editingReminderId = null;
  }

  protected goReminderStep(step: 1 | 2): void {
    this.reminderStep.set(step);
  }

  protected saveReminder(): void {
    if (
      this.reminderForm.medicamento.trim().length < 3 ||
      !this.reminderForm.dosis.trim() ||
      !this.reminderForm.inicio ||
      !this.reminderForm.hora
    ) {
      return;
    }

    const payload: ReminderItem = {
      id: this.editingReminderId ?? `REM-${Math.floor(100 + Math.random() * 900)}`,
      medicamento: this.reminderForm.medicamento.trim(),
      dosis: this.reminderForm.dosis.trim(),
      via: this.reminderForm.via,
      motivo: this.reminderForm.motivo.trim(),
      inicio: this.reminderForm.inicio,
      fin: this.reminderForm.fin,
      frecuencia: this.reminderForm.frecuencia,
      hora: this.reminderForm.hora,
      activo: true,
    };

    if (this.editingReminderId) {
      this.reminders.update((items) => items.map((item) => (item.id === this.editingReminderId ? payload : item)));
      this.showToast('Recordatorio actualizado.');
    } else {
      this.reminders.update((items) => [payload, ...items]);
      this.showToast('Recordatorio activado.');
    }
    this.showReminderForm.set(false);
    this.reminderStep.set(1);
    this.resetReminderForm();
    this.editingReminderId = null;
  }

  protected editReminder(item: ReminderItem): void {
    this.editingReminderId = item.id;
    this.reminderForm = {
      medicamento: item.medicamento,
      dosis: item.dosis,
      via: item.via,
      motivo: item.motivo,
      inicio: item.inicio,
      fin: item.fin,
      frecuencia: item.frecuencia,
      hora: item.hora,
    };
    this.showReminderForm.set(true);
    this.reminderStep.set(1);
  }

  protected removeReminder(id: string): void {
    this.reminders.update((items) => items.filter((item) => item.id !== id));
    this.showToast('Recordatorio eliminado.');
  }

  protected toggleReminder(id: string): void {
    this.reminders.update((items) => items.map((item) => (item.id === id ? { ...item, activo: !item.activo } : item)));
  }

  protected beginEditProfile(): void {
    this.profileDraft = { ...this.patientProfile() };
    this.editingProfile = true;
  }

  protected saveProfile(): void {
    this.patientProfile.set({ ...this.profileDraft });
    this.editingProfile = false;
    this.showToast('Perfil actualizado.');
  }

  protected changePassword(): void {
    this.showToast('Cambio de contraseña próximamente.');
  }

  protected reprogramAppointment(id: string): void {
    this.appointments.update((items) =>
      items.map((item) => (item.id === id ? { ...item, estado: 'Reprogramada' } : item)),
    );
    this.showToast('Cita reprogramada.');
  }

  protected cancelAppointment(id: string): void {
    this.appointments.update((items) =>
      items.map((item) => (item.id === id ? { ...item, estado: 'Cancelada' } : item)),
    );
    this.showToast('Cita cancelada.');
  }

  protected getStatusClass(status: EstadoCita): string {
    if (status === 'Confirmada') {
      return 'status ok';
    }
    if (status === 'Cancelada') {
      return 'status off';
    }
    if (status === 'Reprogramada') {
      return 'status reprog';
    }
    return 'status pending';
  }

  protected clearToast(): void {
    this.toastMessage.set('');
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }

  private getInitialProfile(): PatientProfile {
    const user = this.auth.getCurrentUser();
    const fullName = `${user?.firstName ?? 'Paciente'} ${user?.lastName ?? 'SaludLink'}`.trim();
    return {
      nombreCompleto: fullName,
      correo: user?.email ?? 'paciente@saludlink.pe',
      telefono: '+51 999 123 456',
      dni: '74261358',
      direccion: 'Av. Primavera 1234, Lima',
      fechaNacimiento: '1998-03-14',
      genero: 'Femenino',
      foto: 'https://i.pravatar.cc/200?img=32',
      estado: 'Activa',
    };
  }

  private resetReminderForm(): void {
    this.reminderForm = {
      medicamento: '',
      dosis: '',
      via: 'Oral',
      motivo: '',
      inicio: '',
      fin: 'Indefinido',
      frecuencia: '2 veces/día',
      hora: '',
    };
  }

  private prepareFile(file: File): void {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g|webp|gif)$/i)) {
      this.showToast('Formato no permitido. Usa PDF o imagen.');
      return;
    }
    this.pendingFile.set(file);
    this.uploadProgress.set(15);
    setTimeout(() => this.uploadProgress.set(48), 120);
    setTimeout(() => this.uploadProgress.set(82), 250);
    setTimeout(() => this.uploadProgress.set(100), 380);
  }

  private resetDocumentForm(): void {
    this.documentForm = {
      nombre: '',
      fecha: '',
      hora: '',
      observaciones: '',
    };
  }

  private getDoctorCatalog(): DoctorOption[] {
    const defaultDoctors: DoctorOption[] = [
      {
        id: 1,
        nombreCompleto: 'Dr. Juan Perez',
        especialidad: 'Cardiología',
        sede: 'Sede Central',
        foto: 'https://i.pravatar.cc/180?img=12',
        modalidades: ['Virtual', 'Presencial'],
        horarios: [
          { id: 'd1-h1', fecha: '2026-05-18', hora: '14:30', modalidad: 'Virtual', sede: 'Sede Central', link: 'https://meet.google.com/abc-defg-hij' },
          { id: 'd1-h2', fecha: '2026-05-19', hora: '09:00', modalidad: 'Presencial', sede: 'Sede Central' },
        ],
      },
      {
        id: 2,
        nombreCompleto: 'Dra. Maria Rios',
        especialidad: 'Pediatría',
        sede: 'Sede Norte',
        foto: 'https://i.pravatar.cc/180?img=47',
        modalidades: ['Virtual', 'Presencial'],
        horarios: [
          { id: 'd2-h1', fecha: '2026-05-20', hora: '11:30', modalidad: 'Virtual', sede: 'Sede Norte', link: 'https://meet.google.com/rst-uvwx-yza' },
          { id: 'd2-h2', fecha: '2026-05-21', hora: '15:00', modalidad: 'Presencial', sede: 'Sede Norte' },
        ],
      },
    ];

    const rawMedicos = localStorage.getItem('saludlink_admin_medicos');
    const rawSedes = localStorage.getItem('saludlink_admin_sedes');
    if (!rawMedicos || !rawSedes) {
      return defaultDoctors;
    }

    try {
      const medicos = JSON.parse(rawMedicos) as Array<{ id: number; nombre: string; apellido: string; sedeId: number }>;
      const sedes = JSON.parse(rawSedes) as Array<{ id: number; nombre: string }>;
      if (!Array.isArray(medicos) || medicos.length === 0) {
        return defaultDoctors;
      }

      return medicos.map((medico, index) => {
        const sede = sedes.find((item) => item.id === medico.sedeId)?.nombre ?? 'Sede institucional';
        return {
          id: medico.id,
          nombreCompleto: `Dr. ${medico.nombre} ${medico.apellido}`,
          especialidad: 'Medicina General',
          sede,
          foto: `https://i.pravatar.cc/180?img=${(index % 20) + 10}`,
          modalidades: ['Virtual', 'Presencial'],
          horarios: [
            {
              id: `m-${medico.id}-1`,
              fecha: '2026-05-22',
              hora: '10:00',
              modalidad: 'Virtual',
              sede,
              link: 'https://meet.google.com/med-virtual-room',
            },
            { id: `m-${medico.id}-2`, fecha: '2026-05-23', hora: '16:00', modalidad: 'Presencial', sede },
          ],
        };
      });
    } catch {
      return defaultDoctors;
    }
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set('');
      }
    }, 2600);
  }
}
