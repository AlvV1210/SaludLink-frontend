import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-institucion',
  templateUrl: './registro-institucion.html',
  styleUrl: './registro-institucion.scss',
})
export class RegistroInstitucionComponent {
  private readonly router = inject(Router);

  protected continue(): void {
    void this.router.navigate(['/verificacionadmin']);
  }
}
