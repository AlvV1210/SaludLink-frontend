import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type MedicoSection = 'dashboard' | 'agenda' | 'horarios' | 'pacientes' | 'reportes' | 'adherencia' | 'perfil';
type AgendaStatus = 'Programada' | 'Reprogramada';
type HorarioModalidad = 'Presencial' | 'Virtual';
type HorarioStatus = 'Disponible' | 'Reservado';

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

@Component({
  selector: 'app-panel-medico',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-medico.html',
  styleUrl: './panel-medico.scss',
})
export class PanelMedicoComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly activeSection = signal<MedicoSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly patientSearch = signal('');
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

  protected readonly pacientesReservados = computed(() => {
    const map = new Map<string, { paciente: string; fecha: string; hora: string; modalidad: HorarioModalidad; estado: string }>();
    this.agendaItems().forEach((agenda, index) => {
      const horario = this.horarios()[index % Math.max(this.horarios().length, 1)];
      if (!horario) {
        return;
      }
      map.set(agenda.paciente, {
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

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set('');
      }
    }, 2200);
  }
}
