import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';

@Component({
  selector: 'app-patient-dashboard-shell',
  imports: [NgClass, RouterLink],
  templateUrl: './patient-dashboard-shell.html',
  styleUrl: './patient-dashboard-shell.scss',
})
export class PatientDashboardShellComponent {
  private readonly shellNav = inject(PatientShellNav);
  @Input() public activeItem:
    | 'dashboard'
    | 'citas'
    | 'recordatorios'
    | 'historial'
    | 'mental'
    | 'asistente'
    | 'perfil'
    | 'planes'
    | 'config'
    | '' = '';

  @Input() public userFirstName = '';

  @Output() public readonly dashboard = new EventEmitter<void>();
  @Output() public readonly citas = new EventEmitter<void>();
  @Output() public readonly recordatorios = new EventEmitter<void>();
  @Output() public readonly historial = new EventEmitter<void>();
  @Output() public readonly mental = new EventEmitter<void>();
  @Output() public readonly perfil = new EventEmitter<void>();
  @Output() public readonly planes = new EventEmitter<void>();
  @Output() public readonly config = new EventEmitter<void>();
  @Output() public readonly logout = new EventEmitter<void>();

  protected goAsistente(): void {
    this.shellNav.goAsistente();
  }
}
