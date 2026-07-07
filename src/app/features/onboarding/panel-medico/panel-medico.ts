import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdherenceService } from '../../../core/services/adherence.service';
import { AiService } from '../../../core/services/ai.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Doctor } from '../../../shared/models/doctor.model';
import { Appointment, AppointmentModality, AppointmentStatus } from '../../../shared/models/appointment.model';
import { ChatMessageResponse, ChatService } from '../../../core/services/telemedicine.service';

type MedicoSection = 'dashboard' | 'agenda' | 'horarios' | 'pacientes' | 'reportes' | 'adherencia' | 'chat' | 'perfil';
type AdherenciaView = 'tablero' | 'lista' | 'detalle' | 'alertas' | 'historico';
type PerfilTab = 'general' | 'credenciales';
type AdherenciaRiskFilter = 'todos' | RiesgoNivel;
type AgendaStatus = 'Programada' | 'Reprogramada' | 'Confirmada' | 'Cancelada' | 'Completada';
type HorarioModalidad = 'Presencial' | 'Virtual';
type HorarioStatus = 'Disponible' | 'Reservado';
type AdherenciaNivel = 'Alta' | 'Media' | 'Baja';
type RiesgoNivel = 'Riesgo alto' | 'Riesgo medio' | 'Riesgo bajo';

interface AgendaItem {
  id: number;
  paciente: string;
  dia: string;
  semana: string;
  mes: string;
  fecha: string;
  hora: string;
  modalidad: HorarioModalidad;
  tipo: HorarioModalidad;
  estado: AgendaStatus;
}

interface HorarioItem {
  id: number;
  dia: string;
  hora: string;
  modalidad: HorarioModalidad;
  link: string;
  estado: HorarioStatus;
}

interface PerfilMedico {
  nombre: string;
  apellido: string;
  correo: string;
  especialidad: string;
  sede: string;
  foto: string;
  estado: 'Activo' | 'Inactivo';
  tarifaConsulta: number | null;
}

interface PacienteReserva {
  id: number;
  paciente: string;
  fecha: string;
  hora: string;
  modalidad: HorarioModalidad;
  estado: string;
}

interface ChatMedicoMessage {
  from: 'medico' | 'paciente';
  text: string;
  time: string;
}

interface ChatPacienteItem {
  id: number;
  iniciales: string;
  nombre: string;
  online: boolean;
  disponible: boolean;
  ultimoMensaje: string;
}

interface AdherenciaMedicamento {
  nombre: string;
  dosis: string;
  horario: string;
  cumplimiento: number;
}

interface AsistenciaConsulta {
  modalidad: HorarioModalidad;
  fecha: string;
  asistio: boolean;
}

interface AdherenciaPaciente {
  id: number;
  nombre: string;
  edad: number;
  diagnostico: string;
  dni: string;
  tiempoTratamiento: string;
  adherenciaPorcentaje: number;
  nivel: AdherenciaNivel;
  riesgo: RiesgoNivel;
  medicamentos: AdherenciaMedicamento[];
  alertas: string[];
  asistenciaConsultas: AsistenciaConsulta[];
}

interface DashboardKpi {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
}

interface WeekDayColumn {
  key: string;
  label: string;
  date: string;
  dayNum: number;
  isToday: boolean;
}

interface AgendaCalendarSlot {
  key: string;
  dayKey: string;
  time: string;
  paciente: string;
  modalidad: HorarioModalidad;
  estado: AgendaStatus;
  id: number;
}

interface CalendarCell {
  dayKey: string;
  trackKey: string;
  slot: AgendaCalendarSlot | null;
}

interface CalendarRow {
  time: string;
  cells: CalendarCell[];
}

interface DaySchedule {
  dia: string;
  enabled: boolean;
  inicio: string;
  fin: string;
  descansoInicio: string;
  descansoFin: string;
}

interface CredencialDocumento {
  id: string;
  titulo: string;
  estado: 'Verificado' | 'Pendiente' | 'Rechazado';
  fecha: string;
}

interface AdherenciaAlertaFeed {
  id: string;
  pacienteId: number;
  paciente: string;
  mensaje: string;
  riesgo: RiesgoNivel;
  fecha: string;
}

interface AdherenciaHistoricoPoint {
  mes: string;
  promedio: number;
  width: number;
}

@Component({
  selector: 'app-panel-medico',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-medico.html',
  styleUrl: './panel-medico.scss',
})
export class PanelMedicoComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly adherenceService = inject(AdherenceService);
  private readonly auth = inject(AuthService);
  private readonly doctorService = inject(DoctorService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly chatService = inject(ChatService);
  private readonly aiService = inject(AiService);
  @ViewChild('doctorChatMessagesContainer') private doctorChatMessagesContainer?: ElementRef<HTMLDivElement>;
  protected readonly activeSection = signal<MedicoSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly patientSearch = signal('');
  protected readonly selectedChatPacienteId = signal<number | null>(null);
  protected readonly chatMedicoInput = signal('');
  protected readonly pacienteTyping = signal(false);
  protected readonly currentDoctorId = signal<number | null>(null);
  protected readonly loadingAppointments = signal(false);
  protected readonly selectedAdherenciaPacienteId = signal<number | null>(null);
  protected readonly adherenceAiInsight = signal<string>('');
  protected readonly adherenceAiLoading = signal(false);
  protected readonly adherenceAiError = signal('');
  protected readonly adherenciaView = signal<AdherenciaView>('tablero');
  protected readonly perfilTab = signal<PerfilTab>('general');
  protected readonly adherenciaSearch = signal('');
  protected readonly adherenciaRiskFilter = signal<AdherenciaRiskFilter>('todos');
  protected readonly selectedAgendaSlotKey = signal<string | null>(null);
  protected readonly agendaWeekOffset = signal(0);
  protected readonly daySchedules = signal<DaySchedule[]>(this.createDefaultDaySchedules());
  protected readonly agendaItems = signal<AgendaItem[]>([]);
  protected readonly horarios = signal<HorarioItem[]>([
    { id: 1, dia: 'Lunes', hora: '10:00', modalidad: 'Virtual', link: 'https://meet.google.com/abc-defg-hij', estado: 'Reservado' },
    { id: 2, dia: 'Miércoles', hora: '16:30', modalidad: 'Presencial', link: '-', estado: 'Disponible' },
  ]);

  protected readonly agendaForm = {
    paciente: '',
    dia: 'Lunes',
    semana: 'Semana 1',
    mes: 'Mayo',
    tipo: 'Virtual' as const,
  };

  protected readonly horarioForm = {
    dia: 'Lunes',
    hora: '',
    modalidad: 'Virtual' as HorarioModalidad,
    link: '',
  };

  protected readonly perfil = signal<PerfilMedico>(this.createInitialProfile());
  protected perfilDraft: PerfilMedico = this.perfil();
  protected editingPerfil = false;

  protected agendaAttempted = false;
  protected horarioAttempted = false;
  protected editingHorarioId: number | null = null;

  private nextAgendaId = 3;
  private nextHorarioId = 3;

  ngOnInit(): void {
    this.loadAvailabilityFromApi();
    const section = this.route.snapshot.queryParamMap.get('section');
    if (section && this.isMedicoSection(section)) {
      this.openSection(section);
    }
  }

  private isMedicoSection(value: string): value is MedicoSection {
    return (
      value === 'dashboard' ||
      value === 'agenda' ||
      value === 'horarios' ||
      value === 'pacientes' ||
      value === 'reportes' ||
      value === 'adherencia' ||
      value === 'chat' ||
      value === 'perfil'
    );
  }

  constructor() {
    this.loadCurrentDoctorAndAppointments();
  }

  protected readonly totalPacientes = computed(() => new Set(this.agendaItems().map((item) => item.paciente.toLowerCase())).size);
  protected readonly totalCitas = computed(() => this.agendaItems().length);
  protected readonly totalCitasVirtuales = computed(
    () => this.agendaItems().filter((item) => item.tipo === 'Virtual').length,
  );
  protected readonly totalHorarios = computed(() => this.horarios().length);
  protected readonly consultationFeeLabel = computed(() => this.formatConsultationFee(this.perfil().tarifaConsulta));

  protected readonly dashboardGreeting = computed(() => {
    const hour = new Date().getHours();
    const saludo = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    return `${saludo}, Dr. ${this.perfil().apellido}`;
  });

  protected readonly citasHoy = computed(() => {
    const today = this.formatDateKey(new Date());
    return this.agendaItems()
      .filter((item) => item.fecha === today)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  });

  protected readonly weekDays = computed<WeekDayColumn[]>(() => {
    const start = this.getWeekStart(new Date(), this.agendaWeekOffset());
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const todayKey = this.formatDateKey(new Date());
    return labels.map((label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = this.formatDateKey(date);
      return {
        key,
        label,
        date: key,
        dayNum: date.getDate(),
        isToday: key === todayKey,
      };
    });
  });

  protected readonly agendaTimeSlots = computed(() => ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']);

  protected readonly agendaCalendarSlots = computed<AgendaCalendarSlot[]>(() => {
    return this.agendaItems()
      .filter((item) => this.weekDays().some((day) => day.key === item.fecha))
      .map((item) => ({
        key: `${item.fecha}-${item.hora}`,
        dayKey: item.fecha,
        time: item.hora,
        paciente: item.paciente,
        modalidad: item.modalidad,
        estado: item.estado,
        id: item.id,
      }));
  });

  protected readonly calendarRows = computed<CalendarRow[]>(() => {
    const slots = this.agendaCalendarSlots();
    return this.agendaTimeSlots().map((time) => ({
      time,
      cells: this.weekDays().map((day) => ({
        dayKey: day.key,
        trackKey: `${day.key}-${time}`,
        slot: slots.find((item) => item.dayKey === day.key && item.time === time) ?? null,
      })),
    }));
  });

  protected readonly selectedAgendaSlot = computed(() => {
    const key = this.selectedAgendaSlotKey();
    if (!key) {
      return null;
    }
    return this.agendaCalendarSlots().find((slot) => slot.key === key) ?? null;
  });

  protected readonly weekRangeLabel = computed(() => {
    const days = this.weekDays();
    if (days.length === 0) {
      return '';
    }
    const first = days[0];
    const last = days[days.length - 1];
    return `${first.dayNum} – ${last.dayNum} ${this.getMonthName(first.date)}`;
  });

  protected readonly credencialesMedico = computed(() => ({
    cmp: `CMP ${45000 + (this.currentDoctorId() ?? 12)}`,
    verificado: this.perfil().estado === 'Activo',
    documentos: [
      { id: 'cmp', titulo: 'Carnet CMP', estado: 'Verificado' as const, fecha: '2026-01-15' },
      { id: 'diploma', titulo: 'Diploma de especialidad', estado: 'Verificado' as const, fecha: '2026-01-16' },
      { id: 'dni', titulo: 'Documento de identidad', estado: 'Verificado' as const, fecha: '2026-01-14' },
    ] satisfies CredencialDocumento[],
  }));

  protected readonly filteredAdherenciaPacientes = computed(() => {
    const term = this.adherenciaSearch().trim().toLowerCase();
    const filter = this.adherenciaRiskFilter();
    return this.adherenciaPacientes().filter((item) => {
      const matchesSearch =
        !term ||
        item.nombre.toLowerCase().includes(term) ||
        item.diagnostico.toLowerCase().includes(term) ||
        item.dni.includes(term);
      const matchesRisk = filter === 'todos' || item.riesgo === filter;
      return matchesSearch && matchesRisk;
    });
  });

  protected readonly adherenciaAlertasFeed = computed<AdherenciaAlertaFeed[]>(() => {
    return this.adherenciaPacientes().flatMap((paciente) =>
      paciente.alertas.map((alerta, index) => ({
        id: `${paciente.id}-${index}`,
        pacienteId: paciente.id,
        paciente: paciente.nombre,
        mensaje: alerta,
        riesgo: paciente.riesgo,
        fecha: '2026-06-28',
      })),
    );
  });

  protected readonly adherenciaHistorico = computed<AdherenciaHistoricoPoint[]>(() => {
    const base = this.adherenciaResumen().promedio;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((mes, index) => {
      const promedio = Math.max(45, Math.min(98, base - (months.length - index - 1) * 4 + (index % 2) * 3));
      return {
        mes,
        promedio,
        width: Math.max(12, Math.round((promedio / 100) * 100)),
      };
    });
  });

  protected readonly pacientesReservados = computed<PacienteReserva[]>(() => {
    return this.agendaItems().map((agenda, index) => {
      const horario = this.horarios()[index % Math.max(this.horarios().length, 1)];

      return {
        id: agenda.id,
        paciente: agenda.paciente,
        fecha: agenda.fecha,
        hora: agenda.hora || horario?.hora || 'Sin hora',
        modalidad: agenda.modalidad,
        estado: agenda.estado,
      };
    });
  });

  protected readonly filteredPacientes = computed(() => {
    const term = this.patientSearch().trim().toLowerCase();
    if (!term) {
      return this.pacientesReservados();
    }
    return this.pacientesReservados().filter((item) => item.paciente.toLowerCase().includes(term));
  });

  protected readonly reporteMes = computed(() => {
    const counts = new Map<string, number>();
    this.agendaItems().forEach((item) => counts.set(item.mes, (counts.get(item.mes) ?? 0) + 1));
    return [...counts.entries()].map(([mes, total]) => ({
      mes,
      total,
      width: Math.max(18, Math.round((total / Math.max(this.totalCitas(), 1)) * 100)),
    }));
  });

  protected readonly chatMessagesByPaciente = signal<Record<number, ChatMedicoMessage[]>>({});

  protected readonly pacientesChat = computed<ChatPacienteItem[]>(() => {
    return this.pacientesReservados().map((paciente) => {
      const thread = this.chatMessagesByPaciente()[paciente.id] ?? [];
      const last = thread[thread.length - 1];
      return {
        id: paciente.id,
        iniciales: this.getInitials(paciente.paciente),
        nombre: paciente.paciente,
        online: true,
        disponible: true,
        ultimoMensaje: last?.text ?? 'Sin mensajes todavía.',
      };
    });
  });

  protected readonly selectedPacienteChat = computed(() => {
    const id = this.selectedChatPacienteId();
    if (!id) {
      return null;
    }
    return this.pacientesChat().find((item) => item.id === id) ?? null;
  });

  protected readonly activeChatMessages = computed(() => {
    const paciente = this.selectedPacienteChat();
    if (!paciente) {
      return [];
    }
    return this.chatMessagesByPaciente()[paciente.id] ?? [];
  });

  protected readonly adherenciaPacientes = computed<AdherenciaPaciente[]>(() => {
    const source = this.pacientesReservados();
    const riskOrder: Record<RiesgoNivel, number> = {
      'Riesgo alto': 0,
      'Riesgo medio': 1,
      'Riesgo bajo': 2,
    };
    return source
      .map((item, index) => this.createAdherenciaPaciente(item, index))
      .sort((a, b) => riskOrder[a.riesgo] - riskOrder[b.riesgo] || a.adherenciaPorcentaje - b.adherenciaPorcentaje);
  });

  protected readonly adherenciaResumen = computed(() => {
    const list = this.adherenciaPacientes();
    const total = Math.max(list.length, 1);
    const alta = list.filter((item) => item.nivel === 'Alta').length;
    const media = list.filter((item) => item.nivel === 'Media').length;
    const baja = list.filter((item) => item.nivel === 'Baja').length;
    const promedio = Math.round(list.reduce((sum, item) => sum + item.adherenciaPorcentaje, 0) / total);
    const riesgoAlto = list.filter((item) => item.riesgo === 'Riesgo alto').length;
    return {
      total: list.length,
      alta,
      media,
      baja,
      promedio,
      riesgoAlto,
      altaPct: Math.round((alta / total) * 100),
      mediaPct: Math.round((media / total) * 100),
      bajaPct: Math.round((baja / total) * 100),
    };
  });

  protected readonly selectedAdherenciaPaciente = computed(() => {
    const id = this.selectedAdherenciaPacienteId();
    if (!id) {
      return null;
    }
    return this.adherenciaPacientes().find((item) => item.id === id) ?? null;
  });

  protected readonly dashboardKpis = computed<DashboardKpi[]>(() => {
    const citasHoy = this.citasHoy().length;
    const adherencia = this.adherenciaResumen().promedio;
    return [
      { label: 'Pacientes activos', value: String(this.totalPacientes()), trend: 8, trendLabel: 'vs mes anterior' },
      { label: 'Citas hoy', value: String(citasHoy), trend: citasHoy > 0 ? 12 : -4, trendLabel: 'programadas hoy' },
      { label: 'Adherencia promedio', value: `${adherencia}%`, trend: adherencia >= 75 ? 6 : -3, trendLabel: 'semana actual' },
      { label: 'Citas virtuales', value: String(this.totalCitasVirtuales()), trend: 5, trendLabel: 'modalidad remota' },
    ];
  });

  protected goDashboard(): void {
    this.activeSection.set('dashboard');
    void this.router.navigate(['/medico/dashboard']);
  }

  protected openSection(section: MedicoSection): void {
    if (section === 'dashboard') {
      this.goDashboard();
      return;
    }
    this.activeSection.set(section);
    if (section === 'agenda' || section === 'pacientes' || section === 'reportes' || section === 'chat' || section === 'adherencia') {
      this.loadDoctorAppointments();
    }
    if (section === 'chat' && !this.selectedChatPacienteId()) {
      const first = this.pacientesChat()[0];
      if (first) {
        this.selectChatPaciente(first.id);
      }
    }
    if (section === 'adherencia') {
      this.adherenciaView.set('tablero');
      if (!this.selectedAdherenciaPacienteId()) {
        const first = this.adherenciaPacientes()[0];
        if (first) {
          this.selectedAdherenciaPacienteId.set(first.id);
        }
      }
    }
  }

  protected setAdherenciaView(view: AdherenciaView): void {
    this.adherenciaView.set(view);
    if (view === 'detalle' && !this.selectedAdherenciaPacienteId()) {
      const first = this.adherenciaPacientes()[0];
      if (first) {
        this.selectedAdherenciaPacienteId.set(first.id);
      }
    }
  }

  protected setPerfilTab(tab: PerfilTab): void {
    this.perfilTab.set(tab);
  }

  protected setAdherenciaSearch(value: string): void {
    this.adherenciaSearch.set(value);
  }

  protected setAdherenciaRiskFilter(filter: AdherenciaRiskFilter): void {
    this.adherenciaRiskFilter.set(filter);
  }

  protected openAdherenciaDetalle(id: number): void {
    this.selectAdherenciaPaciente(id);
    this.adherenciaView.set('detalle');
  }

  protected selectAgendaSlot(key: string): void {
    this.selectedAgendaSlotKey.set(key);
  }

  protected shiftAgendaWeek(delta: number): void {
    this.agendaWeekOffset.update((value) => value + delta);
    this.selectedAgendaSlotKey.set(null);
  }

  protected toggleDaySchedule(dia: string): void {
    this.daySchedules.update((items) =>
      items.map((item) => (item.dia === dia ? { ...item, enabled: !item.enabled } : item)),
    );
  }

  protected updateDayScheduleField(dia: string, field: keyof DaySchedule, value: string | boolean): void {
    this.daySchedules.update((items) =>
      items.map((item) => (item.dia === dia ? { ...item, [field]: value } : item)),
    );
  }

  protected getSemaforoClass(riesgo: RiesgoNivel): string {
    if (riesgo === 'Riesgo alto') {
      return 'red';
    }
    if (riesgo === 'Riesgo medio') {
      return 'yellow';
    }
    return 'green';
  }

  protected createVirtualCita(): void {
    this.showToast('Las citas se generan desde el panel del paciente.');
  }

  protected confirmCita(id: number): void {
    this.changeAppointmentStatus(id, AppointmentStatus.CONFIRMED, 'Cita confirmada correctamente.');
  }

  protected completeCita(id: number): void {
    this.changeAppointmentStatus(id, AppointmentStatus.COMPLETED, 'Cita marcada como completada.');
  }

  protected removeCita(id: number): void {
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        this.loadDoctorAppointments();
        this.showToast('Cita cancelada correctamente.');
      },
      error: (error) => {
        console.error('ERROR AL CANCELAR CITA MÉDICO:', error);
        this.showToast(error?.error?.message || 'No se pudo cancelar la cita.');
      },
    });
  }

  protected reprogramCita(id: number): void {
    console.warn('Reprogramación por médico pendiente de flujo específico:', id);
    this.showToast('La reprogramación la realiza el paciente o el administrador.');
  }

  protected saveHorario(): void {
    this.horarioAttempted = true;
    if (!this.horarioForm.hora) {
      return;
    }

    const dayMap: Record<string, string> = {
      Lunes: 'MONDAY',
      Martes: 'TUESDAY',
      Miércoles: 'WEDNESDAY',
      Jueves: 'THURSDAY',
      Viernes: 'FRIDAY',
      Sábado: 'SATURDAY',
      Domingo: 'SUNDAY',
    };

    this.doctorService
      .setAvailability({
        dayOfWeek: dayMap[this.horarioForm.dia] ?? 'MONDAY',
        startTime: `${this.horarioForm.hora}:00`.slice(0, 8),
        endTime: `${this.horarioForm.hora.slice(0, 2)}:59:00`,
        blocked: false,
      })
      .subscribe({
        next: () => {
          this.showToast('Horario guardado en el servidor.');
          this.loadAvailabilityFromApi();
          this.resetHorarioForm();
        },
        error: (error) => {
          this.showToast(error?.error?.message || 'No se pudo guardar el horario.');
        },
      });
  }

  protected editHorario(item: HorarioItem): void {
    this.horarioForm.dia = item.dia;
    this.horarioForm.hora = item.hora;
    this.horarioForm.modalidad = item.modalidad;
    this.horarioForm.link = item.modalidad === 'Virtual' ? item.link : '';
    this.editingHorarioId = item.id;
  }

  protected deleteHorario(id: number): void {
    this.horarios.update((items) => items.filter((item) => item.id !== id));
    this.showToast('Horario eliminado.');
    if (this.editingHorarioId === id) {
      this.resetHorarioForm();
    }
  }

  protected setPatientSearch(value: string): void {
    this.patientSearch.set(value);
  }

  protected selectChatPaciente(id: number): void {
    this.selectedChatPacienteId.set(id);
    this.chatMedicoInput.set('');
    this.loadChatMessages(id);
    this.scrollDoctorChatToBottom();
  }

  protected selectChatPacienteFromSelect(rawId: string): void {
    const parsed = Number(rawId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.selectedChatPacienteId.set(null);
      return;
    }
    this.selectChatPaciente(parsed);
  }

  protected updateDoctorChatInput(value: string): void {
    this.chatMedicoInput.set(value);
  }

  protected sendDoctorChatMessage(): void {
    const paciente = this.selectedPacienteChat();
    const text = this.chatMedicoInput().trim();

    if (!paciente || !text) {
      return;
    }

    this.chatService.sendMessage(paciente.id, text).subscribe({
      next: (message) => {
        const mapped = this.mapBackendChatMessage(message);

        this.chatMessagesByPaciente.update((all) => ({
          ...all,
          [paciente.id]: [...(all[paciente.id] ?? []), mapped],
        }));

        this.chatMedicoInput.set('');
        this.scrollDoctorChatToBottom();
      },
      error: (error) => {
        console.error('ERROR AL ENVIAR MENSAJE MÉDICO:', error);
        this.showToast(error?.error?.message || 'No se pudo enviar el mensaje.');
      },
    });
  }

  protected selectAdherenciaPaciente(id: number): void {
    this.selectedAdherenciaPacienteId.set(id);
    this.loadAdherenceAiInsight(id);
  }

  protected goAsistente(): void {
    void this.router.navigate(['/medico/asistente']);
  }

  private loadAdherenceAiInsight(patientId: number): void {
    this.adherenceAiLoading.set(true);
    this.adherenceAiError.set('');
    this.adherenceAiInsight.set('');
    this.aiService.adherenceReport(patientId).subscribe({
      next: (res) => {
        const text = [
          res.insight.resumen,
          `Patrón: ${res.insight.patronDetectado}`,
          `Sugerencia: ${res.insight.sugerenciaSeguimiento}`,
          `Datos reales: ${res.data.adherencePercent}% (${res.data.takenReminders}/${res.data.totalReminders} recordatorios)`,
        ].join('\n');
        this.adherenceAiInsight.set(text);
        this.adherenceAiLoading.set(false);
      },
      error: (error) => {
        this.adherenceAiError.set(
          apiErrorMessage(error, 'No se pudo generar el insight de adherencia.'),
        );
        this.adherenceAiLoading.set(false);
      },
    });
  }

  protected adjustTreatment(): void {
    this.showToast('Ajuste de tratamiento registrado.');
  }

  protected messageFromAdherencia(): void {
    const selected = this.selectedAdherenciaPaciente();
    if (!selected) {
      return;
    }
    this.openSection('chat');
    this.selectChatPaciente(selected.id);
    this.showToast('Paciente abierto en chat para seguimiento.');
  }

  protected getAdherenciaClass(value: number): string {
    if (value >= 80) {
      return 'good';
    }
    if (value >= 60) {
      return 'medium';
    }
    return 'low';
  }

  protected editPerfil(): void {
    this.perfilDraft = { ...this.perfil() };
    this.editingPerfil = true;
  }

  protected savePerfil(): void {
    this.perfil.set({ ...this.perfilDraft });
    this.editingPerfil = false;
    this.showToast('Perfil actualizado correctamente.');
  }

  protected changePassword(): void {
    this.showToast('Flujo de cambio de contraseña próximamente.');
  }

  protected clearToast(): void {
    this.toastMessage.set('');
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }


  private loadCurrentDoctorAndAppointments(): void {
    const currentUser = this.auth.getCurrentUser();
    const email = currentUser?.email;

    if (!email) {
      this.showToast('No se encontró el usuario médico logueado.');
      return;
    }

    this.doctorService.listVerified().subscribe({
      next: (doctors) => {
        const doctor = doctors.find((item) => item.email === email);

        if (!doctor) {
          this.showToast('No se encontró el perfil del médico.');
          return;
        }

        this.currentDoctorId.set(doctor.id);
        this.applyDoctorProfile(doctor);
        this.loadDoctorAppointments();
      },
      error: (error) => {
        console.error('ERROR AL CARGAR PERFIL MÉDICO:', error);
        this.showToast('No se pudo cargar el perfil médico.');
      },
    });
  }

  private loadDoctorAppointments(): void {
    const doctorId = this.currentDoctorId();

    if (!doctorId) {
      return;
    }

    this.loadingAppointments.set(true);

    this.appointmentService.getAppointmentsByDoctor(doctorId).subscribe({
      next: (appointments) => {
        this.loadingAppointments.set(false);
        this.agendaItems.set(appointments.map((appointment) => this.mapAppointmentToAgendaItem(appointment)));
      },
      error: (error) => {
        console.error('ERROR AL CARGAR CITAS DEL MÉDICO:', error);
        this.loadingAppointments.set(false);
        this.agendaItems.set([]);
        this.showToast('No se pudieron cargar las citas del médico.');
      },
    });
  }

  private applyDoctorProfile(doctor: Doctor): void {
    const profile: PerfilMedico = {
      nombre: doctor.firstName,
      apellido: doctor.lastName,
      correo: doctor.email,
      especialidad: doctor.specialty,
      sede: doctor.branchName || doctor.clinicName || 'Sede por confirmar',
      foto: 'https://i.pravatar.cc/160?img=12',
      estado: doctor.verified ? 'Activo' : 'Inactivo',
      tarifaConsulta:
        doctor.consultationFee === undefined || doctor.consultationFee === null
          ? null
          : Number(doctor.consultationFee),
    };

    this.perfil.set(profile);
    this.perfilDraft = { ...profile };
  }

  private formatConsultationFee(fee: number | null): string {
    if (fee === null || Number.isNaN(fee)) {
      return 'N/A';
    }
    return `S/${fee}`;
  }

  private mapAppointmentToAgendaItem(appointment: Appointment): AgendaItem {
    const dateTime = this.splitDateTime(appointment.appointmentDate ?? appointment.scheduledAt ?? '');
    const modality = this.mapModalityToLabel(String(appointment.modality));
    const monthLabel = this.getMonthName(dateTime.fecha);

    return {
      id: appointment.id,
      paciente: appointment.patientName ?? 'Paciente',
      dia: this.getDayName(dateTime.fecha),
      semana: this.getWeekLabel(dateTime.fecha),
      mes: monthLabel,
      fecha: dateTime.fecha,
      hora: dateTime.hora,
      modalidad: modality,
      tipo: modality,
      estado: this.mapStatusToAgendaStatus(String(appointment.status)),
    };
  }

  private splitDateTime(value: string): { fecha: string; hora: string } {
    if (!value) {
      return { fecha: '-', hora: '-' };
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

  private getDayName(dateValue: string): string {
    if (!dateValue || dateValue === '-') {
      return '-';
    }

    const date = new Date(`${dateValue}T00:00:00`);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return days[date.getDay()] ?? '-';
  }

  private getMonthName(dateValue: string): string {
    if (!dateValue || dateValue === '-') {
      return '-';
    }

    const date = new Date(`${dateValue}T00:00:00`);
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    return months[date.getMonth()] ?? '-';
  }

  private getWeekLabel(dateValue: string): string {
    if (!dateValue || dateValue === '-') {
      return '-';
    }

    const day = Number(dateValue.slice(8, 10));
    const week = Math.max(1, Math.ceil(day / 7));

    return `Semana ${week}`;
  }

  private mapModalityToLabel(value: string): HorarioModalidad {
    return value.toUpperCase().includes('VIRTUAL') ? 'Virtual' : 'Presencial';
  }

  private mapStatusToAgendaStatus(status: string): AgendaStatus {
    const normalized = status.toUpperCase();

    if (normalized.includes('CONFIRMED')) {
      return 'Confirmada';
    }

    if (normalized.includes('CANCELLED')) {
      return 'Cancelada';
    }

    if (normalized.includes('COMPLETED')) {
      return 'Completada';
    }

    return 'Programada';
  }

  private changeAppointmentStatus(id: number, status: AppointmentStatus, successMessage: string): void {
    this.appointmentService.updateAppointmentStatus(id, { status }).subscribe({
      next: () => {
        this.loadDoctorAppointments();
        this.showToast(successMessage);
      },
      error: (error) => {
        console.error('ERROR AL ACTUALIZAR ESTADO DE CITA:', error);
        this.showToast(error?.error?.message || 'No se pudo actualizar la cita.');
      },
    });
  }

  private resetHorarioForm(): void {
    this.horarioForm.dia = 'Lunes';
    this.horarioForm.hora = '';
    this.horarioForm.modalidad = 'Virtual';
    this.horarioForm.link = '';
    this.horarioAttempted = false;
    this.editingHorarioId = null;
  }

  private createDefaultDaySchedules(): DaySchedule[] {
    return [
      { dia: 'Lunes', enabled: true, inicio: '08:00', fin: '18:00', descansoInicio: '13:00', descansoFin: '14:00' },
      { dia: 'Martes', enabled: true, inicio: '08:00', fin: '18:00', descansoInicio: '13:00', descansoFin: '14:00' },
      { dia: 'Miércoles', enabled: true, inicio: '08:00', fin: '14:00', descansoInicio: '12:00', descansoFin: '12:30' },
      { dia: 'Jueves', enabled: true, inicio: '09:00', fin: '17:00', descansoInicio: '13:00', descansoFin: '14:00' },
      { dia: 'Viernes', enabled: true, inicio: '08:00', fin: '16:00', descansoInicio: '12:30', descansoFin: '13:30' },
      { dia: 'Sábado', enabled: false, inicio: '09:00', fin: '13:00', descansoInicio: '', descansoFin: '' },
      { dia: 'Domingo', enabled: false, inicio: '', fin: '', descansoInicio: '', descansoFin: '' },
    ];
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getWeekStart(reference: Date, weekOffset: number): Date {
    const date = new Date(reference);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff + weekOffset * 7);
    return date;
  }

  private createInitialProfile(): PerfilMedico {
    const user = this.auth.getCurrentUser();
    return {
      nombre: user?.firstName ?? 'Juan',
      apellido: user?.lastName ?? 'Pérez',
      correo: user?.email ?? 'doctor@saludlink.pe',
      especialidad: 'Cardiología',
      sede: 'Sede Central',
      foto: 'https://i.pravatar.cc/160?img=12',
      estado: 'Activo',
      tarifaConsulta: null,
    };
  }

  private loadChatMessages(appointmentId: number): void {
    this.chatService.getMessagesByAppointment(appointmentId).subscribe({
      next: (messages) => {
        this.chatMessagesByPaciente.update((all) => ({
          ...all,
          [appointmentId]: messages.map((message) => this.mapBackendChatMessage(message)),
        }));

        this.scrollDoctorChatToBottom();
      },
      error: (error) => {
        console.error('ERROR AL CARGAR MENSAJES DEL CHAT MÉDICO:', error);
        this.showToast(error?.error?.message || 'No se pudieron cargar los mensajes del chat.');
      },
    });
  }

  private mapBackendChatMessage(message: ChatMessageResponse): ChatMedicoMessage {
    const date = new Date(message.sentAt);
    const time = Number.isNaN(date.getTime())
      ? ''
      : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    return {
      from: message.senderName?.toLowerCase().includes('doctor') ? 'medico' : 'paciente',
      text: message.message,
      time,
    };
  }

  private getCurrentTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  private getNumericId(text: string): number {
    let seed = 0;
    for (const char of text) {
      seed += char.charCodeAt(0);
    }
    return seed;
  }

  private getInitials(name: string): string {
    const parts = name
      .split(' ')
      .map((item) => item.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return 'PT';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  private createAdherenciaPaciente(item: PacienteReserva, index: number): AdherenciaPaciente {
    const seed = (item.id + index * 13) % 100;
    const adherencia = Math.max(42, Math.min(96, 92 - seed));
    const nivel: AdherenciaNivel = adherencia >= 80 ? 'Alta' : adherencia >= 60 ? 'Media' : 'Baja';
    const riesgo: RiesgoNivel = adherencia < 60 ? 'Riesgo alto' : adherencia < 80 ? 'Riesgo medio' : 'Riesgo bajo';
    return {
      id: item.id,
      nombre: item.paciente,
      edad: 24 + (seed % 38),
      diagnostico: index % 2 === 0 ? 'Hipertensión arterial' : 'Diabetes tipo 2',
      dni: `74${String(200000 + item.id).slice(0, 6)}`,
      tiempoTratamiento: `${4 + (seed % 10)} meses`,
      adherenciaPorcentaje: adherencia,
      nivel,
      riesgo,
      medicamentos: [
        { nombre: 'Metformina', dosis: '850 mg', horario: '08:00', cumplimiento: Math.max(45, adherencia - 8) },
        { nombre: 'Losartán', dosis: '50 mg', horario: '21:00', cumplimiento: Math.max(40, adherencia - 18) },
      ],
      alertas:
        adherencia < 60
          ? ['Patrón detectado: omite dosis nocturnas.', 'Baja adherencia en las últimas 2 semanas.']
          : adherencia < 80
            ? ['Seguimiento irregular en fines de semana.', 'Riesgo moderado de incumplimiento.']
            : ['Buen cumplimiento global.', 'Mantener monitoreo quincenal.'],
      asistenciaConsultas: [
        { modalidad: 'Presencial', fecha: '2026-05-01', asistio: adherencia >= 70 },
        { modalidad: 'Virtual', fecha: '2026-05-08', asistio: adherencia >= 55 },
        { modalidad: item.modalidad, fecha: '2026-05-15', asistio: adherencia >= 65 },
      ],
    };
  }

  private loadAvailabilityFromApi(): void {
    this.doctorService.getMyAvailability().subscribe({
      next: (items) => {
        const reverseDay: Record<string, string> = {
          MONDAY: 'Lunes',
          TUESDAY: 'Martes',
          WEDNESDAY: 'Miércoles',
          THURSDAY: 'Jueves',
          FRIDAY: 'Viernes',
          SATURDAY: 'Sábado',
          SUNDAY: 'Domingo',
        };
        this.horarios.set(
          items.map((item, index) => ({
            id: item.id ?? index + 1,
            dia: reverseDay[item.dayOfWeek] ?? item.dayOfWeek,
            hora: item.startTime?.slice(0, 5) ?? '09:00',
            modalidad: 'Presencial',
            link: '-',
            estado: item.blocked ? 'Reservado' : 'Disponible',
          })),
        );
      },
      error: () => undefined,
    });
  }

  private scrollDoctorChatToBottom(): void {
    setTimeout(() => {
      const container = this.doctorChatMessagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 30);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set('');
      }
    }, 2200);
  }
}
