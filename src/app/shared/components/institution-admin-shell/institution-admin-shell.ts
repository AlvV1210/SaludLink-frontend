import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { InstitutionAdminStoreService } from '../../../core/services/institution-admin-store.service';

@Component({
  selector: 'app-institution-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './institution-admin-shell.html',
  styleUrl: './institution-admin-shell.scss',
})
export class InstitutionAdminShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly store = inject(InstitutionAdminStoreService);

  protected readonly clinicName = computed(
    () => this.store.profile()?.name ?? 'Mi institución',
  );

  ngOnInit(): void {
    this.store.refreshCore();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/bienvenidacuenta');
  }
}
