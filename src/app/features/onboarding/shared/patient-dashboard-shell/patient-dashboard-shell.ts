import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-patient-dashboard-shell',
  imports: [NgClass],
  templateUrl: './patient-dashboard-shell.html',
  styleUrl: './patient-dashboard-shell.scss',
})
export class PatientDashboardShellComponent {
  @Input() public activeItem:
    | 'dashboard'
    | 'citas'
    | 'recordatorios'
    | 'historial'
    | 'mental'
    | 'perfil'
    | 'planes'
    | 'config' = 'dashboard';

  @Output() public readonly dashboard = new EventEmitter<void>();
  @Output() public readonly citas = new EventEmitter<void>();
  @Output() public readonly recordatorios = new EventEmitter<void>();
  @Output() public readonly historial = new EventEmitter<void>();
  @Output() public readonly mental = new EventEmitter<void>();
  @Output() public readonly perfil = new EventEmitter<void>();
  @Output() public readonly planes = new EventEmitter<void>();
  @Output() public readonly config = new EventEmitter<void>();
  @Output() public readonly logout = new EventEmitter<void>();
}
