import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

@Component({
  selector: 'app-consulta-previa',
  imports: [PatientDashboardShellComponent],
  templateUrl: './consulta-previa.html',
  styleUrl: './consulta-previa.scss',
})
export class ConsultaPreviaComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  protected readonly shellNav = inject(PatientShellNav);

  protected joinMeet(): void {
    const appointmentId = Number(this.route.snapshot.queryParamMap.get('appointmentId') ?? '1');
    void this.router.navigate(['/paciente/consulta/videollamada'], {
      queryParams: { appointmentId: Number.isFinite(appointmentId) ? appointmentId : 1 },
    });
  }

  protected goFinalizadaDemo(): void {
    void this.router.navigate(['/paciente/consulta/finalizada'], {
      queryParams: { appointmentId: this.route.snapshot.queryParamMap.get('appointmentId') ?? 1 },
    });
  }
}
