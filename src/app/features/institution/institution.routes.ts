import { Routes } from '@angular/router';

export const INSTITUTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/institution-admin-shell/institution-admin-shell').then(
        (m) => m.InstitutionAdminShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'medicos',
        loadComponent: () =>
          import('./pages/admin-medicos/admin-medicos').then((m) => m.AdminMedicosComponent),
      },
      {
        path: 'medicos/agregar',
        loadComponent: () =>
          import('./pages/admin-medico-vincular/admin-medico-vincular').then(
            (m) => m.AdminMedicoVincularComponent,
          ),
      },
      {
        path: 'medicos/:id',
        loadComponent: () =>
          import('./pages/admin-medico-detalle/admin-medico-detalle').then(
            (m) => m.AdminMedicoDetalleComponent,
          ),
      },
      {
        path: 'citas',
        loadComponent: () =>
          import('./pages/admin-citas/admin-citas').then((m) => m.AdminCitasComponent),
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./pages/admin-pacientes/admin-pacientes').then((m) => m.AdminPacientesComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/admin-reportes/admin-reportes').then((m) => m.AdminReportesComponent),
      },
      {
        path: 'reportes/asistencia/resultado',
        loadComponent: () =>
          import('./pages/admin-reporte-asistencia-resultado/admin-reporte-asistencia-resultado').then(
            (m) => m.AdminReporteAsistenciaResultadoComponent,
          ),
      },
      {
        path: 'reportes/asistencia',
        loadComponent: () =>
          import('./pages/admin-reporte-asistencia/admin-reporte-asistencia').then(
            (m) => m.AdminReporteAsistenciaComponent,
          ),
      },
      {
        path: 'facturacion',
        loadComponent: () =>
          import('./pages/admin-facturacion/admin-facturacion').then(
            (m) => m.AdminFacturacionComponent,
          ),
      },
      {
        path: 'asistente',
        loadComponent: () =>
          import('../assistant/institution-assistant').then((m) => m.InstitutionAssistantPage),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./pages/admin-config/admin-config').then((m) => m.AdminConfigComponent),
      },
      {
        path: 'config/actividad',
        loadComponent: () =>
          import('./pages/admin-config-actividad/admin-config-actividad').then(
            (m) => m.AdminConfigActividadComponent,
          ),
      },
      {
        path: 'config/mi-clinica',
        loadComponent: () =>
          import('./pages/admin-config-clinica/admin-config-clinica').then(
            (m) => m.AdminConfigClinicaComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
