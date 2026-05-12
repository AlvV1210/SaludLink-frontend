import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type AdminSection = 'dashboard' | 'sedes' | 'medicos' | 'reportes' | 'citas';
type SedeStatus = 'Activa' | 'Inactiva';
type CitaStatus = 'Programada' | 'Confirmada' | 'Cancelada';

interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  ruc: string;
  estado: SedeStatus;
}

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  sedeId: number;
  estado: SedeStatus;
}

interface Cita {
  id: number;
  paciente: string;
  dia: string;
  fecha: string;
  hora: string;
  medicoId: number;
  estado: CitaStatus;
}

@Component({
  selector: 'app-panel-admin-institucional',
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin-institucional.html',
  styleUrl: './panel-admin-institucional.scss',
})
export class PanelAdminInstitucionalComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly activeSection = signal<AdminSection>('dashboard');
  protected readonly toastMessage = signal('');
  protected readonly sedes = signal<Sede[]>([
    { id: 1, nombre: 'Sede Central', direccion: 'Av. San Borja 1200, Lima', ruc: '20123456789', estado: 'Activa' },
    { id: 2, nombre: 'Sede Norte', direccion: 'Av. Tomas Valle 450, Lima', ruc: '20987654321', estado: 'Activa' },
  ]);
  protected readonly medicos = signal<Medico[]>([
    { id: 1, nombre: 'Juan', apellido: 'Perez', sedeId: 1, estado: 'Activa' },
    { id: 2, nombre: 'Maria', apellido: 'Rios', sedeId: 2, estado: 'Activa' },
  ]);
  protected readonly citas = signal<Cita[]>([
    { id: 1, paciente: 'Lupe Cunyas', dia: 'Lunes', fecha: '2026-05-18', hora: '14:30', medicoId: 1, estado: 'Confirmada' },
    { id: 2, paciente: 'Carlos Mena', dia: 'Martes', fecha: '2026-05-19', hora: '09:00', medicoId: 2, estado: 'Programada' },
  ]);

  protected sedeForm = { nombre: '', direccion: '', ruc: '' };
  protected medicoForm = { nombre: '', apellido: '', sedeId: 0 };
  protected citaForm = { paciente: '', dia: 'Lunes', fecha: '', hora: '', medicoId: 0 };

  protected editingSedeId: number | null = null;
  protected editingMedicoId: number | null = null;
  protected editingCitaId: number | null = null;

  protected sedeAttempted = false;
  protected medicoAttempted = false;
  protected citaAttempted = false;

  private nextSedeId = 3;
  private nextMedicoId = 3;
  private nextCitaId = 3;

  constructor() {
    this.restoreCatalogFromStorage();
    this.persistCatalog();
  }

  protected readonly totalSedes = computed(() => this.sedes().length);
  protected readonly totalMedicos = computed(() => this.medicos().length);
  protected readonly totalCitas = computed(() => this.citas().length);
  protected readonly citasConfirmadas = computed(() => this.citas().filter((cita) => cita.estado === 'Confirmada').length);
  protected readonly citasCanceladas = computed(() => this.citas().filter((cita) => cita.estado === 'Cancelada').length);
  protected readonly citasProgramadas = computed(() => this.citas().filter((cita) => cita.estado === 'Programada').length);

  protected readonly citasPorMedico = computed(() => {
    const total = this.citas().length || 1;
    return this.medicos().map((medico) => {
      const cantidad = this.citas().filter((cita) => cita.medicoId === medico.id).length;
      return {
        medicoId: medico.id,
        nombreCompleto: `${medico.nombre} ${medico.apellido}`,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
      };
    });
  });

  protected goDashboard(): void {
    this.activeSection.set('dashboard');
    void this.router.navigate(['/admin/dashboard']);
  }

  protected openSection(section: AdminSection): void {
    if (section === 'dashboard') {
      this.goDashboard();
      return;
    }
    this.activeSection.set(section);
  }

  protected registerSede(): void {
    this.sedeAttempted = true;
    if (!this.isSedeFormValid()) {
      return;
    }

    const data = { ...this.sedeForm };
    if (this.editingSedeId) {
      this.sedes.update((items) =>
        items.map((sede) =>
          sede.id === this.editingSedeId ? { ...sede, nombre: data.nombre, direccion: data.direccion, ruc: data.ruc } : sede,
        ),
      );
      this.showToast('Sede actualizada correctamente.');
    } else {
      this.sedes.update((items) => [
        ...items,
        { id: this.nextSedeId++, nombre: data.nombre, direccion: data.direccion, ruc: data.ruc, estado: 'Activa' },
      ]);
      this.showToast('Sede registrada correctamente.');
    }
    this.resetSedeForm();
    this.persistCatalog();
  }

  protected editSede(sede: Sede): void {
    this.sedeForm = { nombre: sede.nombre, direccion: sede.direccion, ruc: sede.ruc };
    this.editingSedeId = sede.id;
  }

  protected deleteSede(sedeId: number): void {
    this.sedes.update((items) => items.filter((sede) => sede.id !== sedeId));
    this.medicos.update((items) => items.filter((medico) => medico.sedeId !== sedeId));
    this.citas.update((items) =>
      items.filter((cita) => this.medicos().some((medico) => medico.id === cita.medicoId)),
    );
    this.showToast('Sede eliminada.');
    if (this.editingSedeId === sedeId) {
      this.resetSedeForm();
    }
    this.persistCatalog();
  }

  protected registerMedico(): void {
    this.medicoAttempted = true;
    if (!this.isMedicoFormValid()) {
      return;
    }

    const data = { ...this.medicoForm };
    if (this.editingMedicoId) {
      this.medicos.update((items) =>
        items.map((medico) =>
          medico.id === this.editingMedicoId
            ? { ...medico, nombre: data.nombre, apellido: data.apellido, sedeId: data.sedeId }
            : medico,
        ),
      );
      this.showToast('Medico actualizado en tiempo real.');
    } else {
      this.medicos.update((items) => [
        ...items,
        { id: this.nextMedicoId++, nombre: data.nombre, apellido: data.apellido, sedeId: data.sedeId, estado: 'Activa' },
      ]);
      this.showToast('Medico registrado correctamente.');
    }
    this.resetMedicoForm();
    this.persistCatalog();
  }

  protected editMedico(medico: Medico): void {
    this.medicoForm = { nombre: medico.nombre, apellido: medico.apellido, sedeId: medico.sedeId };
    this.editingMedicoId = medico.id;
  }

  protected deleteMedico(medicoId: number): void {
    this.medicos.update((items) => items.filter((medico) => medico.id !== medicoId));
    this.citas.update((items) => items.filter((cita) => cita.medicoId !== medicoId));
    this.showToast('Medico eliminado.');
    if (this.editingMedicoId === medicoId) {
      this.resetMedicoForm();
    }
    this.persistCatalog();
  }

  protected deleteCurrentMedico(): void {
    if (!this.editingMedicoId) {
      return;
    }
    this.deleteMedico(this.editingMedicoId);
  }

  protected scheduleCita(): void {
    this.citaAttempted = true;
    if (!this.isCitaFormValid()) {
      return;
    }

    const data = { ...this.citaForm };
    if (this.editingCitaId) {
      this.citas.update((items) =>
        items.map((cita) =>
          cita.id === this.editingCitaId
            ? {
                ...cita,
                paciente: data.paciente,
                dia: data.dia,
                fecha: data.fecha,
                hora: data.hora,
                medicoId: data.medicoId,
              }
            : cita,
        ),
      );
      this.showToast('Cita editada correctamente.');
    } else {
      this.citas.update((items) => [
        ...items,
        {
          id: this.nextCitaId++,
          paciente: data.paciente,
          dia: data.dia,
          fecha: data.fecha,
          hora: data.hora,
          medicoId: data.medicoId,
          estado: 'Programada',
        },
      ]);
      this.showToast('Cita programada con exito.');
    }
    this.resetCitaForm();
  }

  protected editCita(cita: Cita): void {
    this.citaForm = {
      paciente: cita.paciente,
      dia: cita.dia,
      fecha: cita.fecha,
      hora: cita.hora,
      medicoId: cita.medicoId,
    };
    this.editingCitaId = cita.id;
  }

  protected confirmCita(citaId: number): void {
    this.citas.update((items) => items.map((cita) => (cita.id === citaId ? { ...cita, estado: 'Confirmada' } : cita)));
    this.showToast('Cita confirmada.');
  }

  protected cancelCita(citaId: number): void {
    this.citas.update((items) => items.map((cita) => (cita.id === citaId ? { ...cita, estado: 'Cancelada' } : cita)));
    this.showToast('Cita cancelada.');
  }

  protected getSedeName(sedeId: number): string {
    return this.sedes().find((sede) => sede.id === sedeId)?.nombre ?? 'Sin sede';
  }

  protected getMedicoName(medicoId: number): string {
    const medico = this.medicos().find((item) => item.id === medicoId);
    return medico ? `${medico.nombre} ${medico.apellido}` : 'Sin medico';
  }

  protected getCitaStatusClass(status: CitaStatus): string {
    if (status === 'Confirmada') {
      return 'status ok';
    }
    if (status === 'Cancelada') {
      return 'status off';
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

  private isSedeFormValid(): boolean {
    return (
      this.sedeForm.nombre.trim().length >= 3 &&
      this.sedeForm.direccion.trim().length >= 6 &&
      /^[0-9]{11}$/.test(this.sedeForm.ruc.trim())
    );
  }

  private isMedicoFormValid(): boolean {
    return (
      this.medicoForm.nombre.trim().length >= 2 &&
      this.medicoForm.apellido.trim().length >= 2 &&
      this.medicoForm.sedeId > 0
    );
  }

  private isCitaFormValid(): boolean {
    return (
      this.citaForm.paciente.trim().length >= 3 &&
      !!this.citaForm.fecha &&
      !!this.citaForm.hora &&
      this.citaForm.medicoId > 0
    );
  }

  private resetSedeForm(): void {
    this.sedeForm = { nombre: '', direccion: '', ruc: '' };
    this.editingSedeId = null;
    this.sedeAttempted = false;
  }

  private resetMedicoForm(): void {
    this.medicoForm = { nombre: '', apellido: '', sedeId: 0 };
    this.editingMedicoId = null;
    this.medicoAttempted = false;
  }

  private resetCitaForm(): void {
    this.citaForm = { paciente: '', dia: 'Lunes', fecha: '', hora: '', medicoId: 0 };
    this.editingCitaId = null;
    this.citaAttempted = false;
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set('');
      }
    }, 2200);
  }

  private restoreCatalogFromStorage(): void {
    const rawSedes = localStorage.getItem('saludlink_admin_sedes');
    const rawMedicos = localStorage.getItem('saludlink_admin_medicos');
    if (!rawSedes || !rawMedicos) {
      return;
    }

    try {
      const sedes = JSON.parse(rawSedes) as Sede[];
      const medicos = JSON.parse(rawMedicos) as Medico[];
      if (Array.isArray(sedes) && sedes.length > 0) {
        this.sedes.set(sedes);
        this.nextSedeId = Math.max(...sedes.map((item) => item.id), 0) + 1;
      }
      if (Array.isArray(medicos) && medicos.length > 0) {
        this.medicos.set(medicos);
        this.nextMedicoId = Math.max(...medicos.map((item) => item.id), 0) + 1;
      }
    } catch {
      // ignore malformed cache
    }
  }

  private persistCatalog(): void {
    localStorage.setItem('saludlink_admin_sedes', JSON.stringify(this.sedes()));
    localStorage.setItem('saludlink_admin_medicos', JSON.stringify(this.medicos()));
  }
}
