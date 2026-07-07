import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-config-actividad',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-config-actividad.html',
  styleUrls: ['../../institution-admin.shared.scss', '../admin-config/admin-config.scss', './admin-config-actividad.scss'],
})
export class AdminConfigActividadComponent {}
