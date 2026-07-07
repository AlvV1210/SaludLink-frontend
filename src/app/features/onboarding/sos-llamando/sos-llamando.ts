import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-sos-llamando',
  templateUrl: './sos-llamando.html',
  styleUrl: './sos-llamando.scss',
})
export class SosLlamandoComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly serviceName = signal('SAMU');
  protected readonly phone = signal('106');
  protected readonly elapsed = signal(0);

  ngOnInit(): void {
    const service = this.route.snapshot.queryParamMap.get('servicio');
    const numero = this.route.snapshot.queryParamMap.get('numero');
    if (service) {
      this.serviceName.set(service);
    }
    if (numero) {
      this.phone.set(numero);
    }
    this.timerId = setInterval(() => this.elapsed.update((value) => value + 1), 1000);
    window.open(`tel:${this.phone()}`, '_self');
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  protected elapsedLabel(): string {
    const total = this.elapsed();
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (total % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  protected cancel(): void {
    void this.router.navigate(['/paciente/sos']);
  }
}
