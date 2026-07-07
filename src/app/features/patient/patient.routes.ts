import { Routes } from '@angular/router';

export const PATIENT_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../onboarding/perfil-salud/perfil-salud').then((m) => m.PerfilSaludComponent),
  },
  {
    path: 'dashboard/salud',
    loadComponent: () =>
      import('../onboarding/panel-paciente/panel-paciente').then((m) => m.PanelPacienteComponent),
  },
  {
    path: 'perfil/datos-clinicos',
    loadComponent: () =>
      import('../onboarding/perfil-datos-clinicos/perfil-datos-clinicos').then(
        (m) => m.PerfilDatosClinicosComponent,
      ),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('../onboarding/historial-paciente/historial-paciente').then(
        (m) => m.HistorialPacienteComponent,
      ),
  },
  {
    path: 'historial/exportar',
    loadComponent: () =>
      import('../onboarding/historial-exportar/historial-exportar').then(
        (m) => m.HistorialExportarComponent,
      ),
  },
  {
    path: 'historial/exportar/generando',
    loadComponent: () =>
      import('../onboarding/historial-exportar/historial-exportar').then(
        (m) => m.HistorialExportarComponent,
      ),
  },
  {
    path: 'historial/exportar/listo',
    loadComponent: () =>
      import('../onboarding/historial-exportar/historial-exportar').then(
        (m) => m.HistorialExportarComponent,
      ),
  },
  {
    path: 'historial/subir',
    loadComponent: () =>
      import('../onboarding/historial-subir/historial-subir').then((m) => m.HistorialSubirComponent),
  },
  {
    path: 'salud-mental',
    loadComponent: () =>
      import('../onboarding/salud-mental-paciente/salud-mental-paciente').then(
        (m) => m.SaludMentalPacienteComponent,
      ),
  },
  {
    path: 'salud-mental/test',
    loadComponent: () =>
      import('../onboarding/salud-mental-paciente/salud-mental-paciente').then(
        (m) => m.SaludMentalPacienteComponent,
      ),
  },
  {
    path: 'salud-mental/resultado',
    loadComponent: () =>
      import('../onboarding/salud-mental-paciente/salud-mental-paciente').then(
        (m) => m.SaludMentalPacienteComponent,
      ),
  },
  {
    path: 'asistente',
    loadComponent: () =>
      import('../assistant/patient-assistant').then((m) => m.PatientAssistantPage),
  },
  {
    path: 'planes',
    loadComponent: () =>
      import('../onboarding/planes-paciente/planes-paciente').then((m) => m.PlanesPacienteComponent),
  },
  {
    path: 'citas',
    loadComponent: () =>
      import('../onboarding/citas-paciente/citas-paciente').then((m) => m.CitasPacienteComponent),
  },
  {
    path: 'citas/buscar-especialista',
    loadComponent: () =>
      import('../onboarding/citas-buscar-especialista/citas-buscar-especialista').then(
        (m) => m.CitasBuscarEspecialistaComponent,
      ),
  },
  {
    path: 'citas/seleccionar-fecha-hora',
    loadComponent: () =>
      import('../onboarding/citas-seleccionar-fecha-hora/citas-seleccionar-fecha-hora').then(
        (m) => m.CitasSeleccionarFechaHoraComponent,
      ),
  },
  {
    path: 'citas/resumen',
    loadComponent: () =>
      import('../onboarding/citas-resumen/citas-resumen').then((m) => m.CitasResumenComponent),
  },
  {
    path: 'citas/pago',
    loadComponent: () =>
      import('../onboarding/citas-pago/citas-pago').then((m) => m.CitasPagoComponent),
  },
  {
    path: 'citas/confirmada',
    loadComponent: () =>
      import('../onboarding/citas-confirmada/citas-confirmada').then(
        (m) => m.CitasConfirmadaComponent,
      ),
  },
  {
    path: 'citas/reprogramar',
    loadComponent: () =>
      import('../onboarding/citas-reprogramar/citas-reprogramar').then(
        (m) => m.CitasReprogramarComponent,
      ),
  },
  {
    path: 'citas/calificar',
    loadComponent: () =>
      import('../onboarding/citas-calificar/citas-calificar').then((m) => m.CitasCalificarComponent),
  },
  {
    path: 'recordatorios',
    loadComponent: () =>
      import('../onboarding/recordatorios-paciente/recordatorios-paciente').then(
        (m) => m.RecordatoriosPacienteComponent,
      ),
  },
  {
    path: 'consulta/previa',
    loadComponent: () =>
      import('../onboarding/consulta-previa/consulta-previa').then((m) => m.ConsultaPreviaComponent),
  },
  {
    path: 'consulta/videollamada',
    loadComponent: () =>
      import('../onboarding/consulta-videollamada/consulta-videollamada').then(
        (m) => m.ConsultaVideollamadaComponent,
      ),
  },
  {
    path: 'consulta/finalizada',
    loadComponent: () =>
      import('../onboarding/consulta-finalizada/consulta-finalizada').then(
        (m) => m.ConsultaFinalizadaComponent,
      ),
  },
  {
    path: 'consulta/chat',
    loadComponent: () =>
      import('../onboarding/consulta-chat/consulta-chat').then((m) => m.ConsultaChatComponent),
  },
  {
    path: 'sos',
    loadComponent: () =>
      import('../onboarding/sos-emergencia/sos-emergencia').then((m) => m.SosEmergenciaComponent),
  },
  {
    path: 'sos/llamando',
    loadComponent: () =>
      import('../onboarding/sos-llamando/sos-llamando').then((m) => m.SosLlamandoComponent),
  },
  {
    path: 'recordatorios/alertas',
    loadComponent: () =>
      import('../onboarding/recordatorios-alertas/recordatorios-alertas').then(
        (m) => m.RecordatoriosAlertasComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];
