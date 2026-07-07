import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { apiErrorMessage } from '../../../../core/services/api-error';
import { InstitutionService } from '../../../../core/services/institution.service';
import { InstitutionBillingResponse } from '../../../../shared/models/institution.model';

@Component({
  selector: 'app-admin-facturacion',
  templateUrl: './admin-facturacion.html',
  styleUrls: ['../../institution-admin.shared.scss', './admin-facturacion.scss'],
})
export class AdminFacturacionComponent implements OnInit {
  private readonly institutionService = inject(InstitutionService);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly billing = signal<InstitutionBillingResponse | null>(null);

  protected readonly monthLabel = computed(() => {
    const label = new Date().toLocaleDateString('es-PE', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  protected readonly totalIncome = computed(() => this.billing()?.totalIncome ?? 0);
  protected readonly commission = computed(() => this.billing()?.commission ?? 0);
  protected readonly pendingAmount = computed(() => this.billing()?.pendingAmount ?? 0);
  protected readonly pendingCount = computed(() => this.billing()?.pendingInvoiceCount ?? 0);
  protected readonly invoices = computed(() => this.billing()?.invoices ?? []);

  protected readonly hasData = computed(
    () => this.totalIncome() > 0 || this.pendingAmount() > 0 || this.invoices().length > 0,
  );

  ngOnInit(): void {
    this.loadBilling();
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0);
  }

  protected formatDate(raw: string): string {
    if (!raw) {
      return '—';
    }
    return new Date(raw).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    });
  }

  protected download(): void {
    if (!this.hasData()) {
      return;
    }
    window.alert('La descarga estará disponible cuando haya facturas registradas.');
  }

  private loadBilling(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.institutionService.getBilling().subscribe({
      next: (billing) => {
        this.loading.set(false);
        this.billing.set(billing);
      },
      error: (error) => {
        this.loading.set(false);
        this.billing.set({
          totalIncome: 0,
          commission: 0,
          pendingAmount: 0,
          pendingInvoiceCount: 0,
          invoices: [],
        });
        this.errorMessage.set(
          apiErrorMessage(error, 'No se pudo cargar la facturación. Mostrando valores en cero.'),
        );
      },
    });
  }
}
