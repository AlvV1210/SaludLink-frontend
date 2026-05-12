import { Component, inject, afterNextRender } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
    this.updateFragment(sectionId);
    this.scrollToId(sectionId);
  }

  protected goAppointments(event?: Event): void {
    event?.preventDefault();
    void this.router.navigate(['/registro']);
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
