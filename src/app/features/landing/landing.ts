import { Component, inject, afterNextRender } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface LandingFuncCard {
  icon: string;
  title: string;
  desc: string;
  tag: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly funcCards: LandingFuncCard[] = [
    { icon: '🔍', title: 'Búsqueda de especialistas', desc: 'Encuentra médicos por especialidad, ubicación y disponibilidad', tag: 'HU03' },
    { icon: '📅', title: 'Reserva de citas', desc: 'Agenda en minutos sin llamadas ni filas', tag: 'HU04' },
    { icon: '📹', title: 'Telemedicina', desc: 'Videoconsultas con cifrado E2E', tag: 'HU05' },
    { icon: '⏰', title: 'Recordatorios', desc: 'Alertas inteligentes y personalizables', tag: 'HU06 · HU07' },
    { icon: '📂', title: 'Historial clínico', desc: 'Sube exámenes, recetas e informes', tag: 'HU08' },
    { icon: '🧘', title: 'Salud mental', desc: 'Tests PHQ-9 y derivación profesional', tag: 'HU09' },
    { icon: '📤', title: 'Exportar historial', desc: 'PDF protegido con código temporal', tag: 'HU13' },
    { icon: '🔄', title: 'Reprogramar citas', desc: 'Cambia tu cita en pocos toques', tag: 'HU14' },
    { icon: '👨‍👩‍👧', title: 'Dependientes', desc: 'Gestiona la salud de tus hijos', tag: 'HU15' },
    { icon: '💳', title: 'Pago en línea', desc: 'Visa, Yape, Plin · Seguro y rápido', tag: 'HU16' },
    { icon: '⭐', title: 'Calificar consulta', desc: 'Tu opinión mejora la calidad', tag: 'HU17' },
    { icon: '🚨', title: 'SOS médico', desc: 'SAMU 106, Bomberos 116, PNP 105', tag: 'HU18' },
    { icon: '🔔', title: 'Personalizar alertas', desc: 'Sonido, volumen y modo no molestar', tag: 'HU19' },
    { icon: '💬', title: 'Chat post-consulta', desc: 'Comunicación segura con tu médico', tag: 'HU20' },
    { icon: '📊', title: 'Adherencia médica', desc: 'Tablero con semáforo de riesgo', tag: 'HU12' },
    { icon: '🏥', title: 'Multi-sede', desc: 'Para clínicas con varias ubicaciones', tag: 'HU21' },
  ];

  protected readonly howSteps = [
    { n: '1', title: 'Regístrate', text: 'Crea tu cuenta gratis con tu correo y DNI. Sin papeleos.' },
    { n: '2', title: 'Configura tu perfil', text: 'Añade tus datos de salud, alergias, contactos de emergencia y dependientes.' },
    { n: '3', title: 'Encuentra tu especialista', text: 'Busca por especialidad, calificación o ubicación. Reserva al instante.' },
    { n: '4', title: 'Gestiona tu salud', text: 'Recibe recordatorios, accede a tu historial y consulta sin salir de casa.' },
  ];

  protected readonly testimonials = [
    {
      text: '"Antes perdía horas en filas de la clínica. Ahora reservo desde el celular y los recordatorios me ayudan a no olvidar ninguna pastilla. ¡Es como tener un asistente médico personal!"',
      initials: 'LC',
      name: 'Lupe Cunyas',
      role: 'Paciente · Lima',
    },
    {
      text: '"El tablero de adherencia me cambió la práctica. Veo de un vistazo qué pacientes necesitan más atención. Mis no-shows bajaron del 12% al 4% en tres meses."',
      initials: 'JP',
      name: 'Dr. Juan Pérez',
      role: 'Cardiólogo · CMP 045678',
    },
    {
      text: '"Coordinar 28 médicos en 3 sedes era un caos. Con SaludLink tenemos toda la información en un solo panel. La auditoría automática nos ahorra horas cada semana."',
      initials: 'CM',
      name: 'Carlos Mendoza',
      role: 'Director · Clínica San Pablo',
    },
  ];

  constructor() {
    this.route.fragment.pipe(takeUntilDestroyed()).subscribe((fragment) => {
      if (fragment) {
        queueMicrotask(() => this.scrollToId(fragment));
      }
    });

    afterNextRender(() => {
      const path = this.router.url.split('#')[0];
      if (path.endsWith('/contact')) {
        queueMicrotask(() => this.scrollToId('contacto'));
      }
    });
  }

  protected goTo(sectionId: string, event?: Event): void {
    event?.preventDefault();
    this.scrollToId(sectionId);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/bienvenidacuenta']);
  }

  private scrollToId(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
