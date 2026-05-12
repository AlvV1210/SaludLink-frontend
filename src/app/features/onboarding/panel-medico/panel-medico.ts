import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type MedicoSection = 'dashboard' | 'agenda' | 'horarios' | 'pacientes' | 'reportes' | 'adherencia' | 'chat' | 'perfil';
type AgendaStatus = 'Programada' | 'Reprogramada';
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
  tipo: 'Virtual';
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

@Component({
  selector: 'app-panel-medico',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-medico.html',
  styleUrl: './panel-medico.scss',
})
export class PanelMedicoComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  @ViewChild('doctorChatMessagesContainer') private doctorChatMessagesContainer?: ElementRef<HTMLDivElement>;
  protected readonly activeSection = signal<MedicoSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly patientSearch = signal('');
  protected readonly selectedChatPacienteId = signal<number | null>(null);
  protected readonly chatMedicoInput = signal('');
  protected readonly pacienteTyping = signal(false);
  protected readonly selectedAdherenciaPacienteId = signal<number | null>(null);
  protected readonly agendaItems = signal<AgendaItem[]>([
    { id: 1, paciente: 'Lupe Cunyas', dia: 'Lunes', semana: 'Semana 1', mes: 'Mayo', tipo: 'Virtual', estado: 'Programada' },
    { id: 2, paciente: 'Maria Torres', dia: 'Martes', semana: 'Semana 1', mes: 'Mayo', tipo: 'Virtual', estado: 'Programada' },
  ]);
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

  protected readonly totalPacientes = computed(() => new Set(this.agendaItems().map((item) => item.paciente.toLowerCase())).size);
  protected readonly totalCitas = computed(() => this.agendaItems().length);
  protected readonly totalCitasVirtuales = computed(
    () => this.agendaItems().filter((item) => item.tipo === 'Virtual').length,
  );
  protected readonly totalHorarios = computed(() => this.horarios().length);

  protected readonly pacientesReservados = computed<PacienteReserva[]>(() => {
    const map = new Map<string, PacienteReserva>();
    this.agendaItems().forEach((agenda, index) => {
      const horario = this.horarios()[index % Math.max(this.horarios().length, 1)];
      if (!horario) {
        return;
      }
      map.set(agenda.paciente, {
        id: this.getNumericId(agenda.paciente),
        paciente: agenda.paciente,
        fecha: `${agenda.dia}, ${agenda.mes}`,
        hora: horario.hora || 'Sin hora',
        modalidad: horario.modalidad,
        estado: agenda.estado === 'Programada' ? 'Pendiente' : 'Reprogramada',
      });
    });
    return [...map.values()];
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
        ultimoMensaje: last?.text ?? 'Paciente agregado automáticamente por reserva en tu horario.',
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
    if (section === 'chat' && !this.selectedChatPacienteId()) {
      const first = this.pacientesChat()[0];
      if (first) {
        this.selectChatPaciente(first.id);
      }
    }
    if (section === 'adherencia' && !this.selectedAdherenciaPacienteId()) {
      const first = this.adherenciaPacientes()[0];
      if (first) {
        this.selectedAdherenciaPacienteId.set(first.id);
      }
    }
  }

  protected createVirtualCita(): void {
    this.agendaAttempted = true;
    if (this.agendaForm.paciente.trim().length < 3) {
      return;
    }
    this.agendaItems.update((items) => [
      ...items,
      {
        id: this.nextAgendaId++,
        paciente: this.agendaForm.paciente.trim(),
        dia: this.agendaForm.dia,
        semana: this.agendaForm.semana,
        mes: this.agendaForm.mes,
        tipo: 'Virtual',
        estado: 'Programada',
      },
    ]);
    this.agendaForm.paciente = '';
    this.agendaAttempted = false;
    this.showToast('Cita virtual creada correctamente.');
  }

  protected removeCita(id: number): void {
    this.agendaItems.update((items) => items.filter((item) => item.id !== id));
    this.showToast('Cita eliminada.');
  }

  protected reprogramCita(id: number): void {
    this.agendaItems.update((items) =>
      items.map((item) => (item.id === id ? { ...item, estado: 'Reprogramada', semana: 'Semana 2' } : item)),
    );
    this.showToast('Cita reprogramada.');
  }

  protected saveHorario(): void {
    this.horarioAttempted = true;
    if (!this.horarioForm.hora || (this.horarioForm.modalidad === 'Virtual' && !this.horarioForm.link.trim())) {
      return;
    }

    if (this.editingHorarioId) {
      this.horarios.update((items) =>
        items.map((item) =>
          item.id === this.editingHorarioId
            ? {
                ...item,
                dia: this.horarioForm.dia,
                hora: this.horarioForm.hora,
                modalidad: this.horarioForm.modalidad,
                link: this.horarioForm.modalidad === 'Virtual' ? this.horarioForm.link.trim() : '-',
              }
            : item,
        ),
      );
      this.showToast('Horario actualizado.');
    } else {
      this.horarios.update((items) => [
        ...items,
        {
          id: this.nextHorarioId++,
          dia: this.horarioForm.dia,
          hora: this.horarioForm.hora,
          modalidad: this.horarioForm.modalidad,
          link: this.horarioForm.modalidad === 'Virtual' ? this.horarioForm.link.trim() : '-',
          estado: 'Disponible',
        },
      ]);
      this.showToast('Horario guardado correctamente.');
    }

    this.resetHorarioForm();
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
    this.ensureChatThread(id);
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
    this.chatMessagesByPaciente.update((all) => ({
      ...all,
      [paciente.id]: [...(all[paciente.id] ?? []), { from: 'medico', text, time: this.getCurrentTime() }],
    }));
    this.chatMedicoInput.set('');
    this.pacienteTyping.set(true);
    this.scrollDoctorChatToBottom();
    setTimeout(() => {
      this.chatMessagesByPaciente.update((all) => ({
        ...all,
        [paciente.id]: [
          ...(all[paciente.id] ?? []),
          {
            from: 'paciente',
            text: 'Gracias doctor, seguiré las indicaciones y le actualizo en la noche.',
            time: this.getCurrentTime(),
          },
        ],
      }));
      this.pacienteTyping.set(false);
      this.scrollDoctorChatToBottom();
    }, 1200);
  }

  protected selectAdherenciaPaciente(id: number): void {
    this.selectedAdherenciaPacienteId.set(id);
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

  private resetHorarioForm(): void {
    this.horarioForm.dia = 'Lunes';
    this.horarioForm.hora = '';
    this.horarioForm.modalidad = 'Virtual';
    this.horarioForm.link = '';
    this.horarioAttempted = false;
    this.editingHorarioId = null;
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
    };
  }

  private ensureChatThread(pacienteId: number): void {
    const existing = this.chatMessagesByPaciente()[pacienteId];
    if (existing && existing.length > 0) {
      return;
    }
    this.chatMessagesByPaciente.update((all) => ({
      ...all,
      [pacienteId]: [
        {
          from: 'paciente',
          text: 'Hola doctor, confirmo que reservé mi cita y estaré atento a sus indicaciones.',
          time: '15:42',
        },
      ],
    }));
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
