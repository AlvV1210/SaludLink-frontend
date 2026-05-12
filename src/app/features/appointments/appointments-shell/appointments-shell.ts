import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Contenedor para rutas hijas: `/appointments` y `/appointments/nueva`. */
@Component({
  selector: 'app-appointments-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppointmentsShellComponent {}
