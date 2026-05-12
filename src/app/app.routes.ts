import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register';
import { RecoverPasswordComponent } from './features/auth/recover-password/recover-password';
import { LandingComponent } from './features/landing/landing';
import { BienvenidaCuentaComponent } from './features/onboarding/bienvenida-cuenta/bienvenida-cuenta';
import { PerfilesComponent } from './features/onboarding/perfiles/perfiles';
import { RegistroInstitucionComponent } from './features/onboarding/registro-institucion/registro-institucion';
import { RegistroMedicoComponent } from './features/onboarding/registro-medico/registro-medico';
import { RegistroPacienteComponent } from './features/onboarding/registro-paciente/registro-paciente';
import { PanelAdminInstitucionalComponent } from './features/onboarding/panel-admin-institucional/panel-admin-institucional';
import { PanelMedicoComponent } from './features/onboarding/panel-medico/panel-medico';
import { PanelPacienteComponent } from './features/onboarding/panel-paciente/panel-paciente';
import { PerfilSaludComponent } from './features/onboarding/perfil-salud/perfil-salud';
import { ValidacionCredencialesComponent } from './features/onboarding/validacion-credenciales/validacion-credenciales';
import { VerificacionAdminComponent } from './features/onboarding/verificacion-admin/verificacion-admin';
import { VerificacionCorreoComponent } from './features/onboarding/verificacion-correo/verificacion-correo';
import { CitasPacienteComponent } from './features/onboarding/citas-paciente/citas-paciente';
import { CitasBuscarEspecialistaComponent } from './features/onboarding/citas-buscar-especialista/citas-buscar-especialista';
import { CitasSeleccionarFechaHoraComponent } from './features/onboarding/citas-seleccionar-fecha-hora/citas-seleccionar-fecha-hora';
import { CitasResumenComponent } from './features/onboarding/citas-resumen/citas-resumen';
import { CitasPagoComponent } from './features/onboarding/citas-pago/citas-pago';
import { CitasConfirmadaComponent } from './features/onboarding/citas-confirmada/citas-confirmada';
import { CitasReprogramarComponent } from './features/onboarding/citas-reprogramar/citas-reprogramar';
import { CitasCalificarComponent } from './features/onboarding/citas-calificar/citas-calificar';
import { RecordatoriosPacienteComponent } from './features/onboarding/recordatorios-paciente/recordatorios-paciente';
import { ConsultaPreviaComponent } from './features/onboarding/consulta-previa/consulta-previa';
import { ConsultaVideollamadaComponent } from './features/onboarding/consulta-videollamada/consulta-videollamada';
import { ConsultaFinalizadaComponent } from './features/onboarding/consulta-finalizada/consulta-finalizada';
import { SosEmergenciaComponent } from './features/onboarding/sos-emergencia/sos-emergencia';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: LandingComponent,
  },
  {
    path: 'contact',
    component: LandingComponent,
  },
  {
    path: 'bienvenidacuenta',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [{ path: '', component: BienvenidaCuentaComponent }],
  },
  {
    path: 'perfiles',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [{ path: '', component: PerfilesComponent }],
  },
  {
    path: 'registropaciente',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    data: { allowAuthenticated: true },
    children: [{ path: '', component: RegistroPacienteComponent }],
  },
  {
    path: 'registromedico',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    data: { allowAuthenticated: true },
    children: [{ path: '', component: RegistroMedicoComponent }],
  },
  {
    path: 'registro-medico',
    pathMatch: 'full',
    redirectTo: 'registromedico',
  },
  {
    path: 'registroinstitucion',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    data: { allowAuthenticated: true },
    children: [{ path: '', component: RegistroInstitucionComponent }],
  },
  {
    path: 'verificacioncorreo',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    data: { allowAuthenticated: true },
    children: [{ path: '', component: VerificacionCorreoComponent }],
  },
  {
    path: 'perfilsalud',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    data: { allowAuthenticated: true },
    children: [{ path: '', component: PerfilSaludComponent }],
  },
  {
    path: 'validacioncredenciales',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    data: { allowAuthenticated: true },
    children: [{ path: '', component: ValidacionCredencialesComponent }],
  },
  {
    path: 'verificacionadmin',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    data: { allowAuthenticated: true },
    children: [{ path: '', component: VerificacionAdminComponent }],
  },
  {
    path: 'registro',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [{ path: '', component: RegisterComponent }],
  },
  {
    path: 'recuperar-contrasena',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [{ path: '', component: RecoverPasswordComponent }],
  },
  {
    path: 'paciente',
    component: AuthLayoutComponent,
    canActivate: [authGuard, roleGuard('PATIENT')],
    children: [
      { path: 'dashboard', component: PanelPacienteComponent },
      { path: 'citas', component: CitasPacienteComponent },
      { path: 'citas/buscar-especialista', component: CitasBuscarEspecialistaComponent },
      { path: 'citas/seleccionar-fecha-hora', component: CitasSeleccionarFechaHoraComponent },
      { path: 'citas/resumen', component: CitasResumenComponent },
      { path: 'citas/pago', component: CitasPagoComponent },
      { path: 'citas/confirmada', component: CitasConfirmadaComponent },
      { path: 'citas/reprogramar', component: CitasReprogramarComponent },
      { path: 'citas/calificar', component: CitasCalificarComponent },
      { path: 'recordatorios', component: RecordatoriosPacienteComponent },
      { path: 'consulta/previa', component: ConsultaPreviaComponent },
      { path: 'consulta/videollamada', component: ConsultaVideollamadaComponent },
      { path: 'consulta/finalizada', component: ConsultaFinalizadaComponent },
      { path: 'sos', component: SosEmergenciaComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'medico',
    component: AuthLayoutComponent,
    canActivate: [authGuard, roleGuard('DOCTOR')],
    children: [
      { path: 'dashboard', component: PanelMedicoComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'admin',
    component: AuthLayoutComponent,
    canActivate: [authGuard, roleGuard('ADMIN')],
    children: [
      { path: 'dashboard', component: PanelAdminInstitucionalComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  {
    path: 'register',
    pathMatch: 'full',
    redirectTo: 'registro',
  },
  {
    path: 'auth/register',
    pathMatch: 'full',
    redirectTo: 'registro',
  },
  {
    path: 'login',
    pathMatch: 'full',
    redirectTo: 'registro',
  },
  { path: 'panelpaciente', pathMatch: 'full', redirectTo: 'paciente/dashboard' },
  { path: 'citas', pathMatch: 'full', redirectTo: 'paciente/citas' },
  { path: 'citas/buscar-especialista', pathMatch: 'full', redirectTo: 'paciente/citas/buscar-especialista' },
  { path: 'citas/seleccionar-fecha-hora', pathMatch: 'full', redirectTo: 'paciente/citas/seleccionar-fecha-hora' },
  { path: 'citas/resumen', pathMatch: 'full', redirectTo: 'paciente/citas/resumen' },
  { path: 'citas/pago', pathMatch: 'full', redirectTo: 'paciente/citas/pago' },
  { path: 'citas/confirmada', pathMatch: 'full', redirectTo: 'paciente/citas/confirmada' },
  { path: 'citas/reprogramar', pathMatch: 'full', redirectTo: 'paciente/citas/reprogramar' },
  { path: 'citas/calificar', pathMatch: 'full', redirectTo: 'paciente/citas/calificar' },
  { path: 'recordatorios', pathMatch: 'full', redirectTo: 'paciente/recordatorios' },
  { path: 'consulta/previa', pathMatch: 'full', redirectTo: 'paciente/consulta/previa' },
  { path: 'consulta/videollamada', pathMatch: 'full', redirectTo: 'paciente/consulta/videollamada' },
  { path: 'consulta/finalizada', pathMatch: 'full', redirectTo: 'paciente/consulta/finalizada' },
  { path: 'sos', pathMatch: 'full', redirectTo: 'paciente/sos' },
  { path: 'panelmedico', pathMatch: 'full', redirectTo: 'medico/dashboard' },
  { path: 'paneladmininstitucional', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  { path: '**', redirectTo: '' },
];
