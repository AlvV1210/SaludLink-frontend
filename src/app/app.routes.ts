import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register';
import { RecoverPasswordComponent } from './features/auth/recover-password/recover-password';
import { LandingComponent } from './features/landing/landing';
import { BienvenidaCuentaComponent } from './features/onboarding/bienvenida-cuenta/bienvenida-cuenta';
import { PerfilesComponent } from './features/onboarding/perfiles/perfiles';
import { RegistroInstitucionComponent } from './features/onboarding/registro-institucion/registro-institucion';
import { RegistroMedicoComponent } from './features/onboarding/registro-medico/registro-medico';
import { RegistroPacienteComponent } from './features/onboarding/registro-paciente/registro-paciente';
import { ValidacionCredencialesComponent } from './features/onboarding/validacion-credenciales/validacion-credenciales';
import { VerificacionAdminComponent } from './features/onboarding/verificacion-admin/verificacion-admin';
import { VerificacionCorreoComponent } from './features/onboarding/verificacion-correo/verificacion-correo';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  { path: 'contact', component: LandingComponent },
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
  { path: 'registro-medico', pathMatch: 'full', redirectTo: 'registromedico' },
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
    pathMatch: 'full',
    redirectTo: 'paciente/dashboard',
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
    loadChildren: () =>
      import('./features/patient/patient.routes').then((m) => m.PATIENT_ROUTES),
  },
  {
    path: 'medico',
    component: AuthLayoutComponent,
    canActivate: [authGuard, roleGuard('DOCTOR')],
    loadChildren: () => import('./features/doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES),
  },
  {
    path: 'admin',
    component: AuthLayoutComponent,
    canActivate: [authGuard, roleGuard('INSTITUTION_ADMIN')],
    loadChildren: () =>
      import('./features/institution/institution.routes').then((m) => m.INSTITUTION_ROUTES),
  },
  { path: 'register', pathMatch: 'full', redirectTo: 'registro' },
  { path: 'auth/register', pathMatch: 'full', redirectTo: 'registro' },
  { path: 'login', pathMatch: 'full', redirectTo: 'registro' },
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
  { path: 'consulta/chat', pathMatch: 'full', redirectTo: 'paciente/consulta/chat' },
  { path: 'sos', pathMatch: 'full', redirectTo: 'paciente/sos' },
  { path: 'sos/llamando', pathMatch: 'full', redirectTo: 'paciente/sos/llamando' },
  { path: 'recordatorios/alertas', pathMatch: 'full', redirectTo: 'paciente/recordatorios/alertas' },
  { path: 'historial', pathMatch: 'full', redirectTo: 'paciente/historial' },
  { path: 'historial/exportar', pathMatch: 'full', redirectTo: 'paciente/historial/exportar' },
  { path: 'salud-mental', pathMatch: 'full', redirectTo: 'paciente/salud-mental' },
  { path: 'planes-paciente', pathMatch: 'full', redirectTo: 'paciente/planes' },
  { path: 'panelmedico', pathMatch: 'full', redirectTo: 'medico/dashboard' },
  { path: 'paneladmininstitucional', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  { path: '**', redirectTo: '' },
];
