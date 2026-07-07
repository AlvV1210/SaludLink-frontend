import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AiService } from '../../core/services/ai.service';
import { TokenService } from '../../core/services/token.service';
import { apiErrorMessage } from '../../core/services/api-error';
import { AssistantMode, PatientAssistantTopic } from '../../shared/models/ai.model';
import { UserRole } from '../../shared/models/user.model';

interface Message {
  from: 'user' | 'bot';
  text: string;
  sources?: string[];
  error?: boolean;
}

@Component({
  selector: 'app-assistant',
  imports: [
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './assistant.html',
  styleUrl: './assistant.css',
})
export class Assistant {
  private ai = inject(AiService);
  private tokens = inject(TokenService);
  private snack = inject(MatSnackBar);

  private bodyRef = viewChild<ElementRef<HTMLElement>>('chatBody');

  readonly role = this.tokens.role;
  readonly isInstitutionAdmin = this.role === 'INSTITUTION_ADMIN';

  draft = '';
  mode = signal<AssistantMode>(this.tokens.role === 'INSTITUTION_ADMIN' ? 'support' : 'assistant');
  patientTopic = signal<PatientAssistantTopic>('appointment');
  sending = signal(false);
  ingesting = signal(false);
  messages = signal<Message[]>([{ from: 'bot', text: this.buildGreeting() }]);

  readonly supportSuggestionsPatient = [
    '¿Cómo cancelo una cita?',
    '¿Puedo reprogramar una cita?',
    '¿Cómo marco un recordatorio como tomado?',
    '¿Cómo me uno a una videoconsulta?',
  ];

  readonly supportSuggestionsDoctor = [
    '¿Cómo bloqueo un horario?',
    '¿Cómo inicio una videoconsulta?',
    '¿Qué hago si un paciente no se conecta?',
    '¿Puedo usar el chat post-consulta?',
  ];

  readonly supportSuggestionsAdmin = [
    '¿Cómo funciona el módulo de recordatorios?',
    '¿Qué hago ante una emergencia médica?',
    '¿Cómo se une un paciente a teleconsulta?',
    '¿Cómo cancelo una cita como paciente?',
  ];

  readonly appointmentSuggestions = [
    'Reserva pediatría el lunes a las 9 en la mañana',
    '¿Qué citas tengo pendientes?',
    'Busca cardiología para esta semana',
    'Reserva telemedicina el miércoles a las 10',
  ];

  readonly medicationSuggestions = [
    '¿Qué recordatorios tengo hoy?',
    'Ya tomé la de las 8',
    'Lista mis medicamentos activos',
    '¿Qué recordatorios quedan pendientes hoy?',
  ];

  readonly scheduleSuggestions = [
    '¿Cuántas citas tengo mañana?',
    'Muéstrame mi agenda de hoy',
    '¿Tengo huecos libres el viernes?',
    'Lista mis citas virtuales de hoy',
  ];

  suggestions = computed(() => {
    if (this.mode() === 'support') {
      if (this.role === 'DOCTOR') {
        return this.supportSuggestionsDoctor;
      }
      if (this.role === 'INSTITUTION_ADMIN') {
        return this.supportSuggestionsAdmin;
      }
      return this.supportSuggestionsPatient;
    }
    if (this.role === 'DOCTOR') {
      return this.scheduleSuggestions;
    }
    if (this.patientTopic() === 'medication') {
      return this.medicationSuggestions;
    }
    return this.appointmentSuggestions;
  });

  setMode(mode: AssistantMode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    this.messages.set([{ from: 'bot', text: this.buildGreeting() }]);
    this.draft = '';
  }

  setPatientTopic(topic: PatientAssistantTopic): void {
    if (topic === this.patientTopic()) return;
    this.patientTopic.set(topic);
    if (this.mode() === 'assistant') {
      this.messages.set([{ from: 'bot', text: this.buildGreeting() }]);
      this.draft = '';
    }
  }

  send(text: string = this.draft): void {
    const value = text.trim();
    if (!value || this.sending()) return;

    this.push({ from: 'user', text: value });
    this.draft = '';
    this.sending.set(true);

    if (this.mode() === 'assistant') {
      this.sendAssistant(value);
      return;
    }

    this.ai.supportAsk(value).subscribe({
      next: (res) => {
        this.push({ from: 'bot', text: res.reply, sources: res.sources });
        this.sending.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  ingest(): void {
    if (this.ingesting()) return;
    this.ingesting.set(true);
    this.ai.ingest().subscribe({
      next: (res) => {
        this.ingesting.set(false);
        this.snack.open(`Documentos cargados: ${res.chunksIngested} fragmentos.`, 'OK', {
          duration: 4000,
        });
      },
      error: (err) => {
        this.ingesting.set(false);
        this.snack.open(apiErrorMessage(err, 'No se pudo ingestar.'), 'OK', { duration: 4000 });
      },
    });
  }

  private sendAssistant(value: string): void {
    const request$ =
      this.role === 'DOCTOR'
        ? this.ai.scheduleChat(value)
        : this.patientTopic() === 'medication'
          ? this.ai.medicationChat(value)
          : this.ai.appointmentChat(value);

    request$.subscribe({
      next: (res) => {
        this.push({ from: 'bot', text: res.reply });
        this.sending.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  private buildGreeting(): string {
    if (this.mode() === 'support') {
      if (this.role === 'INSTITUTION_ADMIN') {
        return 'Modo soporte: respondo con las guías oficiales de SaludLink. Puedes probar las preguntas sugeridas o cargar documentos si actualizaste los PDF.';
      }
      return 'Modo soporte: respondo con la guía de SaludLink (RAG). ¿En qué te ayudo?';
    }
    const greetings: Partial<Record<UserRole, string>> = {
      DOCTOR:
        '¡Hola! Soy tu asistente de agenda. Puedo consultar tus citas y disponibilidad. ¿Qué necesitas?',
      PATIENT:
        this.patientTopic() === 'medication'
          ? '¡Hola! Puedo ayudarte con tus medicamentos y recordatorios de hoy.'
          : '¡Hola! Puedo buscar especialistas y reservar citas por ti. ¿Qué necesitas?',
      INSTITUTION_ADMIN:
        'Asistente institucional listo. Usa el modo Soporte para consultar las guías o el botón Cargar documentos para actualizar el vector store.',
    };
    return greetings[this.role ?? 'PATIENT'] ?? 'Asistente SaludLink listo para ayudarte.';
  }

  private fail(err: HttpErrorResponse): void {
    this.push({
      from: 'bot',
      text: apiErrorMessage(err, 'No pude procesar tu solicitud. Intenta de nuevo.'),
      error: true,
    });
    this.sending.set(false);
  }

  private push(msg: Message): void {
    this.messages.update((list) => [...list, msg]);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.bodyRef()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
