import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PatientShellNav } from '../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../shared/components/patient-dashboard-shell/patient-dashboard-shell';
import { Assistant } from './assistant';

@Component({
  selector: 'app-patient-assistant',
  imports: [PatientDashboardShellComponent, Assistant],
  template: `
    <app-patient-dashboard-shell
      activeItem="asistente"
      [userFirstName]="userFirstName()"
      (dashboard)="shellNav.goDashboard()"
      (citas)="shellNav.goCitas()"
      (recordatorios)="shellNav.goRecordatorios()"
      (historial)="shellNav.goHistorial()"
      (mental)="shellNav.goMental()"
      (perfil)="shellNav.goPerfil()"
      (planes)="shellNav.goPlanes()"
      (config)="shellNav.goConfig()"
      (logout)="shellNav.logout()"
    >
      <app-assistant />
    </app-patient-dashboard-shell>
  `,
})
export class PatientAssistantPage {
  private readonly auth = inject(AuthService);
  protected readonly shellNav = inject(PatientShellNav);

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );
}
