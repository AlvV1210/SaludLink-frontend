import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

type Perfil = 'paciente' | 'medico' | 'institucion';

@Component({
  selector: 'app-perfiles',
  templateUrl: './perfiles.html',
  styleUrl: './perfiles.scss',
})
export class PerfilesComponent {
  private readonly router = inject(Router);
  protected readonly selected = signal<Perfil>('paciente');

  protected setPerfil(perfil: Perfil): void {
    this.selected.set(perfil);
  }

  protected continue(): void {
    const routeByPerfil: Record<Perfil, string> = {
      paciente: '/registropaciente',
      medico: '/registromedico',
      institucion: '/registroinstitucion',
    };
    void this.router.navigate([routeByPerfil[this.selected()]]);
  }

  protected goLogin(): void {
    void this.router.navigate(['/registro']);
  }
}
