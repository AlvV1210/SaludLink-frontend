import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-dashboard.scss'],
})
export class AdminDashboardComponent {
  private readonly auth = inject(AuthService);
  protected readonly store = inject(InstitutionAdminStoreService);

  protected readonly dashboard = this.store.dashboard;
  protected readonly doctors = this.store.doctors;
  protected readonly patients = this.store.uniquePatients;
  protected readonly loading = this.store.loading;

  protected readonly adminName = computed(() => {
    const user = this.auth.getCurrentUser();
    return user?.firstName ?? 'Administrador';
  });

  protected readonly todayAppointments = computed(
    () => this.dashboard()?.todayAppointments ?? 0,
  );

  protected readonly noShowAlerts = computed(() => this.dashboard()?.noShowAlerts ?? 0);

  protected readonly pendingItems = computed(() => {
    const items: string[] = [];
    const pending = this.store.pendingDoctors();
    if (pending > 0) {
      items.push(`${pending} médico${pending === 1 ? '' : 's'} por validar`);
    }
    const noShows = this.noShowAlerts();
    if (noShows > 0) {
      items.push(`${noShows} no-show${noShows === 1 ? '' : 's'} hoy`);
    }
    return items;
  });

  protected readonly showPendingBanner = computed(() => this.pendingItems().length > 0);
}
