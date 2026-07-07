import { Component, inject, afterNextRender, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';
import { ContactMessageRequest } from '../../shared/models/contact.model';

type LandingFeature = 'citas' | 'medicacion' | 'historial' | 'mental' | 'planes';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, FormsModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly contactService = inject(ContactService);

  protected readonly contactSubmitting = signal(false);
  protected readonly contactSuccess = signal(false);
  protected readonly contactError = signal('');

  protected contactForm: ContactMessageRequest = {
    fullName: '',
    email: '',
    phone: '',
    role: 'Paciente',
    topic: '',
    message: '',
  };

  protected readonly roleOptions = ['Paciente', 'Medico', 'Clinica', 'Otro'];

  constructor() {
    this.route.fragment.pipe(takeUntilDestroyed()).subscribe((fragment) => {
      if (fragment) {
        queueMicrotask(() => this.scrollToId(fragment));
      }
    });

    afterNextRender(() => {
      const fragment = this.route.snapshot.fragment;
      if (fragment) {
        this.scrollToId(fragment);
        return;
      }

      const path = this.router.url.split('#')[0];
      if (path.endsWith('/contact')) {
        this.scrollToId('contacto');
      }
    });
  }

  protected goTo(sectionId: string, event?: Event): void {
    event?.preventDefault();
    this.updateFragment(sectionId);
    this.scrollToId(sectionId);
  }

  protected goRegister(): void {
    void this.router.navigateByUrl('/bienvenidacuenta');
  }

  protected goHeroTab(tab: 'citas' | 'medicacion' | 'historial'): void {
    const routes: Record<'citas' | 'medicacion' | 'historial', string> = {
      citas: '/paciente/citas',
      medicacion: '/paciente/recordatorios',
      historial: '/paciente/historial',
    };
    this.navigatePatientOrAuth(routes[tab]);
  }

  protected goFeature(feature: LandingFeature): void {
    const routes: Record<LandingFeature, string> = {
      citas: '/paciente/citas',
      medicacion: '/paciente/recordatorios',
      historial: '/paciente/historial',
      mental: '/paciente/salud-mental',
      planes: '/paciente/planes',
    };
    this.navigatePatientOrAuth(routes[feature]);
  }

  protected goToContact(topic: string, event?: Event): void {
    event?.preventDefault();
    this.contactForm.topic = topic;
    if (!this.contactForm.message.trim()) {
      this.contactForm.message = this.defaultMessageForTopic(topic);
    }
    this.contactSuccess.set(false);
    this.contactError.set('');
    this.goTo('contacto');
  }

  protected submitContact(event: Event): void {
    event.preventDefault();
    this.contactError.set('');

    const fullName = this.contactForm.fullName.trim();
    const email = this.contactForm.email.trim();
    const message = this.contactForm.message.trim();

    if (!fullName || !email || !message) {
      this.contactError.set('Completa nombre, correo y mensaje.');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.contactError.set('Ingresa un correo electronico valido.');
      return;
    }

    this.contactSubmitting.set(true);
    this.contactService
      .submit({
        fullName,
        email,
        phone: this.contactForm.phone?.trim() || undefined,
        role: this.contactForm.role,
        topic: this.contactForm.topic?.trim() || undefined,
        message,
      })
      .subscribe({
        next: () => {
          this.contactSubmitting.set(false);
          this.contactSuccess.set(true);
          this.contactForm = {
            fullName: '',
            email: '',
            phone: '',
            role: 'Paciente',
            topic: '',
            message: '',
          };
        },
        error: () => {
          this.contactSubmitting.set(false);
          this.contactError.set('No se pudo enviar el mensaje. Intenta de nuevo.');
        },
      });
  }

  protected resetContactForm(): void {
    this.contactSuccess.set(false);
    this.contactError.set('');
  }

  private navigatePatientOrAuth(path: string): void {
    if (this.auth.isAuthenticated()) {
      const role = this.auth.getCurrentUser()?.role;
      if (role === 'PATIENT') {
        void this.router.navigateByUrl(path);
        return;
      }
      void this.router.navigateByUrl(this.auth.getDefaultRouteByRole());
      return;
    }
    void this.router.navigateByUrl('/bienvenidacuenta');
  }

  private defaultMessageForTopic(topic: string): string {
    const labels: Record<string, string> = {
      seguridad: 'Me gustaria conocer mas sobre las medidas de seguridad y privacidad de SaludLink.',
      terminos: 'Solicito informacion sobre los terminos y condiciones de uso.',
      privacidad: 'Solicito informacion sobre la politica de privacidad y tratamiento de datos.',
    };
    return labels[topic] ?? '';
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private scrollToId(id: string): void {
    const section = document.getElementById(id);
    if (!section) {
      return;
    }

    const topbar = document.querySelector('.topbar') as HTMLElement | null;
    const offset = (topbar?.offsetHeight ?? 0) + 20;
    const targetPosition = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(targetPosition, 0), behavior: 'smooth' });
  }

  private updateFragment(sectionId: string): void {
    const currentPath = this.router.url.split('#')[0];
    window.history.replaceState({}, '', `${currentPath}#${sectionId}`);
  }
}
