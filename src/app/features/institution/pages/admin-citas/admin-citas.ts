import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { InstitutionAdminStoreService } from '../../../../core/services/institution-admin-store.service';

@Component({
  selector: 'app-admin-citas',
  imports: [TitleCasePipe],
  templateUrl: './admin-citas.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-citas.scss'],
})
export class AdminCitasComponent {
  protected readonly store = inject(InstitutionAdminStoreService);

  protected readonly viewDate = signal(new Date());

  protected readonly monthLabel = computed(() => {
    const date = this.viewDate();
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  });

  protected readonly calendarCells = computed(() => {
    const date = this.viewDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay = this.store.appointmentsForMonth(year, month);
    const cells: Array<{ day: number | null; count: number; isToday: boolean }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, count: 0, isToday: false });
    }
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        count: byDay.get(day)?.length ?? 0,
        isToday:
          today.getFullYear() === year &&
          today.getMonth() === month &&
          today.getDate() === day,
      });
    }
    return cells;
  });

  protected prevMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }
}
