import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  {
    path: 'bienvenida',
    loadComponent: () =>
      import('../onboarding/medico-bienvenida/medico-bienvenida').then(
        (m) => m.MedicoBienvenidaComponent,
      ),
  },
  {
    path: 'asistente',
    loadComponent: () =>
      import('../assistant/doctor-assistant').then((m) => m.DoctorAssistantPage),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../onboarding/panel-medico/panel-medico').then((m) => m.PanelMedicoComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
