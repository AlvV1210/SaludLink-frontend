import { Routes } from '@angular/router';
import { RegisterComponent } from './features/auth/register/register';
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
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout';

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
    children: [{ path: '', component: BienvenidaCuentaComponent }],
  },
  {
    path: 'perfiles',
    component: AuthLayoutComponent,
    children: [{ path: '', component: PerfilesComponent }],
  },
  {
    path: 'registropaciente',
    component: AuthLayoutComponent,
    children: [{ path: '', component: RegistroPacienteComponent }],
  },
  {
    path: 'registromedico',
    component: AuthLayoutComponent,
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
    children: [{ path: '', component: RegistroInstitucionComponent }],
  },
  {
    path: 'verificacioncorreo',
    component: AuthLayoutComponent,
    children: [{ path: '', component: VerificacionCorreoComponent }],
  },
  {
    path: 'perfilsalud',
    component: AuthLayoutComponent,
    children: [{ path: '', component: PerfilSaludComponent }],
  },
  {
    path: 'panelpaciente',
    component: AuthLayoutComponent,
    children: [{ path: '', component: PanelPacienteComponent }],
  },
  {
    path: 'validacioncredenciales',
    component: AuthLayoutComponent,
    children: [{ path: '', component: ValidacionCredencialesComponent }],
  },
  {
    path: 'panelmedico',
    component: AuthLayoutComponent,
    children: [{ path: '', component: PanelMedicoComponent }],
  },
  {
    path: 'verificacionadmin',
    component: AuthLayoutComponent,
    children: [{ path: '', component: VerificacionAdminComponent }],
  },
  {
    path: 'paneladmininstitucional',
    component: AuthLayoutComponent,
    children: [{ path: '', component: PanelAdminInstitucionalComponent }],
  },
  {
    path: 'registro',
    component: AuthLayoutComponent,
    children: [{ path: '', component: RegisterComponent }],
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
  { path: '**', redirectTo: '' },
];
