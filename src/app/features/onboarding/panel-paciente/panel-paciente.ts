import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { ChatMessageResponse, ChatService } from '../../../core/services/chat.service';

import {
  Appointment as BackendAppointment,
  AppointmentModality,
} from '../../../core/models/appointment.model';
import { PatientProfile as BackendPatientProfile } from '../../../core/models/patient.model';
import { Doctor as BackendDoctor } from '../../../core/models/doctor.model';

type PatientSection =
  | 'dashboard'
  | 'citas'
  | 'salas'
  | 'recordatorios'
  | 'chat-postconsulta'
  | 'salud-mental'
  | 'historial'
  | 'perfil';
type Modalidad = 'Virtual' | 'Presencial';
type EstadoCita = 'Confirmada' | 'Programada' | 'Reprogramada' | 'Cancelada' | 'Completada';
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

interface MentalTestResult {
  score: number;
  level: 'Sin síntomas relevantes' | 'Leve' | 'Moderado' | 'Alto riesgo emocional';
  dateLabel: string;
  highlights: string[];
}

interface PostconsultaDoctor {
  id: number;
  etiqueta: 'Doctor';
  avatar: string;
  online: boolean;
  disponible: boolean;
  consultaFecha: string;
  modalidad: Modalidad;
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
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly chatService = inject(ChatService);
  @ViewChild('postconsultaMessagesContainer') private postconsultaMessagesContainer?: ElementRef<HTMLDivElement>;
  protected readonly activeSection = signal<PatientSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly bookingStep = signal<'doctores' | 'horarios' | 'resumen' | 'pago' | 'exito'>('doctores');
  protected readonly selectedDoctor = signal<DoctorOption | null>(null);
  protected readonly selectedHorarioId = signal<string | null>(null);
  protected readonly reprogrammingAppointmentId = signal<string | null>(null);
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
  protected readonly mentalView = signal<'home' | 'intro' | 'test' | 'result'>('home');
  protected readonly mentalQuestionIndex = signal(0);
  protected readonly mentalAnswers = signal<number[]>(Array(9).fill(-1));
  protected readonly mentalShowRecommendations = signal(false);
  protected readonly mentalResults = signal<MentalTestResult[]>([]);
  protected readonly bookingSpecialtyFilter = signal('');
  protected readonly selectedPostconsultaDoctorId = signal<number | null>(null);
  protected readonly postconsultaInput = signal('');
  protected readonly doctorTyping = signal(false);
  protected editingReminderId: string | null = null;
  protected editingProfile = false;

  protected readonly appointments = signal<PatientAppointment[]>([]);

  protected readonly doctors = signal<DoctorOption[]>([]);
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
  protected readonly chatMessagesByDoctor = signal<Record<number, ChatMessage[]>>({});
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
  protected readonly mentalQuestions = [
    'Poco interés o placer en hacer cosas',
    'Sentirse triste o sin esperanza',
    'Problemas para dormir o dormir demasiado',
    'Sentirse cansado/a o con poca energía',
    'Falta de apetito o comer en exceso',
    'Sentirse mal contigo mismo/a',
    'Problemas para concentrarte en actividades diarias',
    'Lentitud o inquietud notable',
    'Pensamientos negativos o de daño',
  ];
  protected readonly mentalAnswerOptions = [
    { label: 'Nunca', value: 0 },
    { label: 'Varios días', value: 1 },
    { label: 'Más de la mitad de los días', value: 2 },
    { label: 'Casi todos los días', value: 3 },
  ];
  protected readonly postconsultaMessagesByDoctor = signal<Record<number, ChatMessage[]>>({});

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

  constructor() {
    this.loadInitialPatientData();
    this.loadDoctorsFromBackend();
  }

  protected readonly quickSummary = computed(() => {
    const citas = this.appointments();
    return {
      total: citas.length,
      activas: citas.filter((cita) => cita.estado !== 'Cancelada' && cita.estado !== 'Completada').length,
      virtuales: citas.filter(
        (cita) => cita.modalidad === 'Virtual' && cita.estado !== 'Cancelada' && cita.estado !== 'Completada',
      ).length,
      presenciales: citas.filter(
        (cita) => cita.modalidad === 'Presencial' && cita.estado !== 'Cancelada' && cita.estado !== 'Completada',
      ).length,
      mental: citas.filter((cita) => cita.especialidad.toLowerCase().includes('psic')).length,
      reminders: this.reminders().filter((item) => item.activo).length,
      documentos: this.documents().length,
      chatsPostconsulta: this.postconsultaDoctors().length,
    };
  });

  protected readonly mentalSummary = computed(() => {
    const latest = this.mentalResults()[0];
    return {
      totalTests: this.mentalResults().length,
      lastLevel: latest?.level ?? 'Sin evaluaciones',
      lastDate: latest?.dateLabel ?? '-',
    };
  });

  protected readonly nextAppointment = computed(() => {
    return this.appointments().find((cita) => cita.estado !== 'Cancelada' && cita.estado !== 'Completada') ?? null;
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

  protected readonly filteredBookingDoctors = computed(() => {
    const specialty = this.bookingSpecialtyFilter().trim().toLowerCase();
    if (!specialty) {
      return this.doctors();
    }
    return this.doctors().filter((doctor) => doctor.especialidad.toLowerCase().includes(specialty));
  });

  protected readonly virtualAppointments = computed(() =>
    this.appointments().filter((item) => item.modalidad === 'Virtual' && item.estado === 'Confirmada'),
  );

  protected readonly chatDoctors = computed<ChatDoctor[]>(() => {
    return this.virtualAppointments()
      .map((cita) => {
        const appointmentId = Number(cita.id);

        if (!Number.isFinite(appointmentId)) {
          return null;
        }

        return {
          id: appointmentId,
          nombre: cita.doctor,
          especialidad: cita.especialidad,
          online: true,
          horario: `${cita.fecha} · ${cita.hora}`,
        };
      })
      .filter((doctor): doctor is ChatDoctor => doctor !== null);
  });

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

  protected readonly postconsultaDoctors = computed<PostconsultaDoctor[]>(() => {
    const completed = this.appointments().filter((item) => item.estado === 'Completada');
    const byDoctor = new Map<string, PostconsultaDoctor>();
    for (const cita of completed) {
      const key = cita.doctor;
      if (byDoctor.has(key)) {
        continue;
      }
      byDoctor.set(key, {
        id: this.getDoctorSeed(key),
        etiqueta: 'Doctor',
        avatar: 'DR',
        online: true,
        disponible: true,
        consultaFecha: cita.fecha,
        modalidad: cita.modalidad,
      });
    }
    return Array.from(byDoctor.values());
  });

  protected readonly selectedPostconsultaDoctor = computed(() => {
    const id = this.selectedPostconsultaDoctorId();
    if (!id) {
      return null;
    }
    return this.postconsultaDoctors().find((doctor) => doctor.id === id) ?? null;
  });

  protected readonly activePostconsultaMessages = computed(() => {
    const doctor = this.selectedPostconsultaDoctor();
    if (!doctor) {
      return [];
    }
    return this.postconsultaMessagesByDoctor()[doctor.id] ?? [];
  });

  protected readonly currentMentalQuestion = computed(() => this.mentalQuestions[this.mentalQuestionIndex()]);

  protected readonly mentalProgress = computed(() => Math.round(((this.mentalQuestionIndex() + 1) / this.mentalQuestions.length) * 100));

  protected readonly canContinueMental = computed(() => this.mentalAnswers()[this.mentalQuestionIndex()] >= 0);

  protected readonly activeMentalResult = computed(() => this.mentalResults()[0] ?? null);

  protected goDashboard(): void {
    this.activeSection.set('dashboard');
    void this.router.navigate(['/paciente/dashboard']);
  }

  protected selectMentalMood(moodId: string): void {
    this.selectedMoodId.set(moodId);
  }

  protected startMentalTest(): void {
    this.mentalView.set('intro');
  }

  protected beginMentalQuestionnaire(): void {
    this.mentalView.set('test');
    this.mentalQuestionIndex.set(0);
    this.mentalAnswers.set(Array(this.mentalQuestions.length).fill(-1));
    this.mentalShowRecommendations.set(false);
  }

  protected goBackMentalHome(): void {
    this.mentalView.set('home');
  }

  protected selectMentalAnswer(value: number): void {
    this.mentalAnswers.update((answers) => {
      const updated = [...answers];
      updated[this.mentalQuestionIndex()] = value;
      return updated;
    });
  }

  protected previousMentalQuestion(): void {
    this.mentalQuestionIndex.update((index) => Math.max(index - 1, 0));
  }

  protected nextMentalQuestion(): void {
    if (!this.canContinueMental()) {
      return;
    }
    if (this.mentalQuestionIndex() >= this.mentalQuestions.length - 1) {
      this.finishMentalQuestionnaire();
      return;
    }
    this.mentalQuestionIndex.update((index) => index + 1);
  }

  protected openMentalRecommendations(): void {
    this.mentalShowRecommendations.set(true);
  }

  protected schedulePsychologyAppointment(): void {
    this.openBookingFlow('Psicología');
    this.showToast('Filtro aplicado: Especialidad Psicología.');
  }

  protected openSection(section: PatientSection): void {
    this.activeSection.set(section);
    if (section === 'salud-mental') {
      this.mentalView.set('home');
      this.mentalShowRecommendations.set(false);
    }
    if (section === 'chat-postconsulta' && !this.selectedPostconsultaDoctorId()) {
      const firstDoctor = this.postconsultaDoctors()[0];
      if (firstDoctor) {
        this.selectPostconsultaDoctor(firstDoctor.id);
      }
    }
  }

  protected selectPostconsultaDoctor(id: number): void {
    this.selectedPostconsultaDoctorId.set(id);
    this.postconsultaInput.set('');
    this.ensurePostconsultaThread(id);
    this.scrollPostconsultaToBottom();
  }

  protected selectPostconsultaDoctorFromSelect(rawId: string): void {
    const parsed = Number(rawId);
    if (Number.isNaN(parsed) || parsed <= 0) {
      this.selectedPostconsultaDoctorId.set(null);
      return;
    }
    this.selectPostconsultaDoctor(parsed);
  }

  protected updatePostconsultaInput(value: string): void {
    this.postconsultaInput.set(value);
  }

  protected sendPostconsultaMessage(): void {
    const doctor = this.selectedPostconsultaDoctor();
    const text = this.postconsultaInput().trim();
    if (!doctor || !text) {
      return;
    }
    const time = this.getCurrentTime();
    this.postconsultaMessagesByDoctor.update((all) => ({
      ...all,
      [doctor.id]: [...(all[doctor.id] ?? []), { from: 'me', text, time }],
    }));
    this.postconsultaInput.set('');
    this.doctorTyping.set(true);
    this.scrollPostconsultaToBottom();
    setTimeout(() => {
      this.postconsultaMessagesByDoctor.update((all) => ({
        ...all,
        [doctor.id]: [
          ...(all[doctor.id] ?? []),
          {
            from: 'doctor',
            text: 'Recibido. Continúa con la medicación indicada y avísame si presentas algún cambio.',
            time: this.getCurrentTime(),
          },
        ],
      }));
      this.doctorTyping.set(false);
      this.scrollPostconsultaToBottom();
    }, 1200);
  }

  protected openBookingFlow(specialtyFilter = ''): void {
    this.activeSection.set('citas');
    this.showBookingFlow.set(true);
    this.bookingStep.set('doctores');
    this.bookingSpecialtyFilter.set(specialtyFilter);
    this.selectedDoctor.set(null);
    this.selectedHorarioId.set(null);
    this.reprogrammingAppointmentId.set(null);
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

    const appointmentDateTime = `${horario.fecha}T${
      horario.hora.length === 5 ? `${horario.hora}:00` : horario.hora
    }`;

    const payload = {
      doctorId: doctor.id,
      appointmentDate: appointmentDateTime,
      modality: horario.modalidad === 'Virtual'
        ? AppointmentModality.virtual
        : AppointmentModality.presencial,
      notes: `Consulta de ${doctor.especialidad} | Sede: ${horario.sede}`,
    };

    const reprogrammingId = this.reprogrammingAppointmentId();

    if (reprogrammingId) {
      const numericId = Number(reprogrammingId);

      if (Number.isNaN(numericId)) {
        this.showToast('ID de cita inválido.');
        return;
      }

      this.appointmentService.updateAppointment(numericId, payload).subscribe({
        next: (updated) => {
          const mapped = this.mapBackendAppointment(
            updated as BackendAppointment & Record<string, unknown>
          );

          this.appointments.update((items) =>
            items.map((item) => (item.id === reprogrammingId ? mapped : item))
          );

          this.reprogrammingAppointmentId.set(null);
          this.bookingStep.set('exito');
          this.showToast('Cita reprogramada correctamente. Quedó pendiente de confirmación.');
        },
        error: (error) => {
          console.error('ERROR AL REPROGRAMAR CITA:', error);
          this.showToast(
            error?.error?.message || 'No se pudo reprogramar la cita.'
          );
        },
      });

      return;
    }

    this.appointmentService.createAppointment(payload).subscribe({
      next: (created) => {
        const mapped = this.mapBackendAppointment(
          created as BackendAppointment & Record<string, unknown>
        );

        this.appointments.update((items) => [mapped, ...items]);
        this.bookingStep.set('exito');
        this.showToast(`Cita confirmada correctamente (${mapped.id}).`);
      },
      error: (error) => {
        console.error('ERROR AL CREAR CITA:', error);
        this.showToast(
          error?.error?.message || 'No se pudo registrar la cita en el backend.'
        );
      },
    });
  }

  protected closeBookingFlow(): void {
    this.showBookingFlow.set(false);
    this.bookingStep.set('doctores');
    this.bookingSpecialtyFilter.set('');
    this.selectedDoctor.set(null);
    this.selectedHorarioId.set(null);
    this.reprogrammingAppointmentId.set(null);
  }

  protected openVirtualRoom(citaId: string): void {
    this.selectedVirtualAppointmentId.set(citaId);

    const appointmentId = Number(citaId);

    if (Number.isFinite(appointmentId)) {
      this.selectChatDoctor(appointmentId);
    }
  }

  protected getVirtualLink(cita: PatientAppointment): string {
    const code = cita.id.toLowerCase().replace(/[^a-z0-9]/g, '').padEnd(9, 'x').slice(0, 9);

    return `https://meet.google.com/${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;
  }

  protected getRemainingText(cita: PatientAppointment): string {
    const start = new Date(`${cita.fecha}T${cita.hora}:00`);

    if (Number.isNaN(start.getTime())) {
      return 'Horario por confirmar';
    }

    const diffMinutes = Math.ceil((start.getTime() - Date.now()) / 60000);

    if (diffMinutes > 60) {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      return minutes > 0 ? `Faltan ${hours} h ${minutes} min` : `Faltan ${hours} h`;
    }

    if (diffMinutes > 0) {
      return `Faltan ${diffMinutes} min`;
    }

    return 'La sala ya está disponible';
  }

  protected toggleSosModal(): void {
    this.showSosModal.update((value) => !value);
  }

  protected selectChatDoctor(doctorId: number): void {
    this.selectedChatDoctorId.set(doctorId);
    this.chatInput.set('');
    this.loadChatMessages(doctorId);
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

    this.chatService.sendMessage(doctor.id, text).subscribe({
      next: (message) => {
        const mapped = this.mapBackendChatMessage(message);

        this.chatMessagesByDoctor.update((all) => ({
          ...all,
          [doctor.id]: [...(all[doctor.id] ?? []), mapped],
        }));

        this.chatInput.set('');
      },
      error: (error) => {
        console.error('ERROR AL ENVIAR MENSAJE:', error);
        this.showToast(error?.error?.message || 'No se pudo enviar el mensaje.');
      },
    });
  }


  private loadChatMessages(appointmentId: number): void {
    this.chatService.getMessagesByAppointment(appointmentId).subscribe({
      next: (messages) => {
        this.chatMessagesByDoctor.update((all) => ({
          ...all,
          [appointmentId]: messages.map((message) => this.mapBackendChatMessage(message)),
        }));
      },
      error: (error) => {
        console.error('ERROR AL CARGAR MENSAJES DEL CHAT:', error);
        this.showToast(error?.error?.message || 'No se pudieron cargar los mensajes del chat.');
      },
    });
  }

  private mapBackendChatMessage(message: ChatMessageResponse): ChatMessage {
    const date = new Date(message.sentAt);
    const time = Number.isNaN(date.getTime())
      ? ''
      : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    return {
      from: message.senderRole === 'PATIENT' ? 'me' : 'doctor',
      text: message.message,
      time,
    };
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
    const cita = this.appointments().find((item) => item.id === id);

    if (!cita) {
      this.showToast('No se encontró la cita seleccionada.');
      return;
    }

    this.activeSection.set('citas');
    this.showBookingFlow.set(true);
    this.bookingStep.set('doctores');
    this.bookingSpecialtyFilter.set(cita.especialidad);
    this.selectedDoctor.set(null);
    this.selectedHorarioId.set(null);
    this.reprogrammingAppointmentId.set(id);

    this.showToast('Selecciona nuevo médico y horario para reprogramar la cita.');
  }

  protected cancelAppointment(id: string): void {
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      this.showToast('ID de cita inválido.');
      return;
    }

    this.appointmentService.cancelAppointment(numericId).subscribe({
      next: () => {
        this.appointments.update((items) =>
          items.map((item) =>
            item.id === id ? { ...item, estado: 'Cancelada' as EstadoCita } : item
          )
        );

        this.showToast('Cita cancelada correctamente.');
      },
      error: (error) => {
        console.error('ERROR AL CANCELAR CITA:', error);
        this.showToast(
          error?.error?.message || 'No se pudo cancelar la cita.'
        );
      },
    });
  }

  protected finalizeAppointment(id: string): void {
    this.appointments.update((items) =>
      items.map((item) => (item.id === id ? { ...item, estado: 'Completada' as EstadoCita } : item)),
    );
    this.showToast('Consulta finalizada. Chat postconsulta habilitado.');
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
    if (status === 'Completada') {
      return 'status done';
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

  private finishMentalQuestionnaire(): void {
    const answers = this.mentalAnswers().map((item) => (item < 0 ? 0 : item));
    const score = answers.reduce((sum, value) => sum + value, 0);
    const level = this.getMentalLevel(score);
    const highlights = answers
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((item) => `${this.mentalQuestions[item.index]} (${item.value} pts)`);

    this.mentalResults.update((items) => [
      {
        score,
        level,
        dateLabel: this.getTodayLabel(),
        highlights: highlights.length > 0 ? highlights : ['Sin síntomas destacados en esta evaluación.'],
      },
      ...items,
    ]);
    this.mentalView.set('result');
    this.mentalShowRecommendations.set(false);
  }

  private getMentalLevel(score: number): MentalTestResult['level'] {
    if (score <= 4) {
      return 'Sin síntomas relevantes';
    }
    if (score <= 9) {
      return 'Leve';
    }
    if (score <= 14) {
      return 'Moderado';
    }
    return 'Alto riesgo emocional';
  }

  private getTodayLabel(): string {
    const now = new Date();
    return now.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private getCurrentTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  private ensurePostconsultaThread(doctorId: number): void {
    const existing = this.postconsultaMessagesByDoctor()[doctorId];
    if (existing && existing.length > 0) {
      return;
    }
    this.postconsultaMessagesByDoctor.update((all) => ({
      ...all,
      [doctorId]: [
        {
          from: 'doctor',
          text: 'Hola Lupe, te dejo las indicaciones de hoy en tu historial. Cualquier duda, escríbeme por aquí.',
          time: '15:42',
        },
      ],
    }));
  }

  private getDoctorSeed(value: string): number {
    let seed = 0;
    for (const char of value) {
      seed += char.charCodeAt(0);
    }
    return seed;
  }

  private scrollPostconsultaToBottom(): void {
    setTimeout(() => {
      const container = this.postconsultaMessagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 30);
  }

  private loadInitialPatientData(): void {
    this.patientService.getMyProfile().subscribe({
      next: (profile) => {
        this.applyPatientProfile(profile);
        this.loadAppointments();
      },
      error: (error) => {
        console.error('ERROR AL CARGAR PERFIL PACIENTE:', error);
        this.showToast('No se pudo cargar el perfil del paciente.');
        this.loadAppointments();
      },
    });
  }

  private loadAppointments(): void {
    this.appointmentService.getAppointmentsByPatient().subscribe({
      next: (appointments) => {
        this.appointments.set(
          appointments.map((appointment) =>
            this.mapBackendAppointment(
              appointment as BackendAppointment & Record<string, unknown>
            )
          )
        );
      },
      error: (error) => {
        console.error('ERROR AL CARGAR CITAS:', error);
        this.appointments.set([]);
        this.showToast('No se pudieron cargar tus citas.');
      },
    });
  }

  private loadDoctorsFromBackend(): void {
    this.appointmentService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors.set(
          doctors.map((doctor, index) =>
            this.mapBackendDoctorToOption(doctor, index)
          )
        );
      },
      error: (error) => {
        console.error('ERROR AL CARGAR MÉDICOS:', error);
        this.doctors.set([]);
        this.showToast('No se pudieron cargar los médicos disponibles.');
      },
    });
  }

  private applyPatientProfile(profile: Partial<BackendPatientProfile> & { dni?: unknown }): void {
    const current = this.patientProfile();
    const fullName = `${profile['firstName'] ?? ''} ${profile['lastName'] ?? ''}`.trim();

    this.patientProfile.set({
      ...current,
      nombreCompleto: fullName || current.nombreCompleto,
      correo: String(profile['email'] ?? current.correo),
      telefono: String(profile['phone'] ?? current.telefono),
      dni: String(profile['documentNumber'] ?? profile['dni'] ?? current.dni),
      direccion: String(profile['address'] ?? current.direccion),
      fechaNacimiento: String(profile['birthDate'] ?? current.fechaNacimiento),
      genero: String(profile['gender'] ?? current.genero),
    });

    this.profileDraft = { ...this.patientProfile() };
  }

  private mapBackendDoctorToOption(doctor: BackendDoctor, index: number): DoctorOption {
    const nombreCompleto =
      doctor.name ||
      `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() ||
      `Médico ${doctor.id}`;

    const sede =
      doctor.branchName ||
      doctor.branchAddress ||
      doctor.clinicName ||
      'Sede por confirmar';

    const firstDate = this.getFutureDate(1);
    const secondDate = this.getFutureDate(2);

    return {
      id: doctor.id,
      nombreCompleto,
      especialidad: doctor.specialty || 'Medicina General',
      sede,
      foto: `https://i.pravatar.cc/180?img=${(index % 20) + 10}`,
      modalidades: ['Virtual', 'Presencial'],
      horarios: [
        {
          id: `doctor-${doctor.id}-virtual`,
          fecha: firstDate,
          hora: '10:00',
          modalidad: 'Virtual',
          sede: 'Sala Telemedicina',
          link: 'https://meet.google.com/saludlink-virtual',
        },
        {
          id: `doctor-${doctor.id}-presencial`,
          fecha: secondDate,
          hora: '16:00',
          modalidad: 'Presencial',
          sede,
        },
      ],
    };
  }

  private mapBackendAppointment(
    appointment: Partial<BackendAppointment> & Record<string, unknown>
  ): PatientAppointment {
    const doctorFromAppointment = appointment['doctor'] as BackendDoctor | undefined;

    const rawDate = String(
      appointment['appointmentDate'] ??
        appointment['scheduledAt'] ??
        appointment['date'] ??
        ''
    );

    const rawTime = String(
      appointment['startTime'] ??
        appointment['time'] ??
        appointment['appointmentTime'] ??
        ''
    );

    const dateTime = this.splitAppointmentDate(rawDate);

    const fecha = dateTime.fecha;
    const hora = rawTime ? rawTime.slice(0, 5) : dateTime.hora;

    const modalidad = this.mapAppointmentModality(
      String(appointment['modality'] ?? appointment['type'] ?? 'Presencial')
    );

    const doctorName =
      String(
        appointment['doctorName'] ??
          appointment['doctorFullName'] ??
          ''
      ) ||
      `${doctorFromAppointment?.firstName ?? ''} ${doctorFromAppointment?.lastName ?? ''}`.trim() ||
      doctorFromAppointment?.name ||
      'Médico asignado';

    const especialidad =
      String(
        appointment['specialty'] ??
          appointment['specialtyName'] ??
          appointment['especialidad'] ??
          ''
      ) ||
      doctorFromAppointment?.specialty ||
      'Especialidad';

    const sede =
      String(
        appointment['location'] ??
          appointment['branchName'] ??
          appointment['sede'] ??
          ''
      ) ||
      doctorFromAppointment?.branchName ||
      doctorFromAppointment?.branchAddress ||
      (modalidad === 'Virtual' ? 'Sala Telemedicina' : 'Sede por confirmar');

    return {
      id: String(appointment['id'] ?? `SL-${Date.now()}`),
      doctor: doctorName,
      especialidad,
      fecha,
      hora,
      modalidad,
      sede,
      estado: this.mapAppointmentStatus(String(appointment['status'] ?? 'Programada')),
      tipo: modalidad,
    };
  }

  private splitAppointmentDate(value: string): { fecha: string; hora: string } {
    if (!value) {
      return {
        fecha: '-',
        hora: '-',
      };
    }

    if (value.includes('T')) {
      const [fecha, time] = value.split('T');

      return {
        fecha,
        hora: time?.slice(0, 5) || '-',
      };
    }

    return {
      fecha: value.slice(0, 10),
      hora: '-',
    };
  }

  private mapAppointmentModality(value: string): Modalidad {
    const normalized = value.toUpperCase();

    if (normalized.includes('VIRTUAL')) {
      return 'Virtual';
    }

    return 'Presencial';
  }

  private mapAppointmentStatus(value: string): EstadoCita {
    const normalized = value.toUpperCase();

    if (normalized.includes('CONFIRM')) {
      return 'Confirmada';
    }

    if (normalized.includes('CANCEL')) {
      return 'Cancelada';
    }

    if (normalized.includes('COMPLETE') || normalized.includes('COMPLET')) {
      return 'Completada';
    }

    if (normalized.includes('REPROGRAM')) {
      return 'Reprogramada';
    }

    return 'Programada';
  }

  private getFutureDate(daysFromToday: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);

    return date.toISOString().slice(0, 10);
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
