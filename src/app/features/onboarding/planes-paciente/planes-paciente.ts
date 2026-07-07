import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';

interface PlanCard {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const PLANS: PlanCard[] = [
  {
    id: 'basico',
    name: 'Basico',
    price: 'Gratis',
    period: '',
    description: 'Ideal para empezar con telemedicina y recordatorios.',
    features: ['2 citas virtuales/mes', 'Recordatorios de medicacion', 'Historial basico'],
    cta: 'Plan actual',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'S/ 29',
    period: '/mes',
    description: 'Atencion prioritaria y salud mental incluida.',
    features: ['Citas ilimitadas', 'Salud mental PHQ-9', 'Exportacion de historial', 'Chat postconsulta'],
    highlighted: true,
    cta: 'Mejorar plan',
  },
  {
    id: 'familiar',
    name: 'Familiar',
    price: 'S/ 49',
    period: '/mes',
    description: 'Hasta 4 perfiles con dependientes y planes compartidos.',
    features: ['4 perfiles vinculados', 'Todos los beneficios Premium', 'Soporte prioritario 24/7'],
    cta: 'Contactar ventas',
  },
];

@Component({
  selector: 'app-planes-paciente',
  imports: [PatientDashboardShellComponent],
  templateUrl: './planes-paciente.html',
  styleUrls: ['./planes-paciente.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class PlanesPacienteComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly shellNav = inject(PatientShellNav);

  protected readonly plans = PLANS;
  protected readonly selectedPlanId = signal('basico');
  protected readonly toast = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected selectPlan(planId: string): void {
    this.selectedPlanId.set(planId);
  }

  protected activatePlan(plan: PlanCard): void {
    if (plan.id === 'basico') {
      this.toast.set('Ya estas en el plan Basico.');
      return;
    }
    if (plan.id === 'familiar') {
      void this.router.navigate(['/contact']);
      return;
    }
    this.toast.set('Pronto podras activar Premium desde la app.');
  }
}
