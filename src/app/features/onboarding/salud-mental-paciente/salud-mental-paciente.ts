import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AiService } from '../../../core/services/ai.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { MentalHealthService } from '../../../core/services/mental-health.service';
import { PatientShellNav } from '../../../core/navigation/patient-shell-nav';
import { PatientDashboardShellComponent } from '../../../shared/components/patient-dashboard-shell/patient-dashboard-shell';
import { WellnessInsight } from '../../../shared/models/ai.model';

type MentalView = 'intro' | 'test' | 'resultado';

interface MentalTestResult {
  score: number;
  level: 'Sin sintomas relevantes' | 'Leve' | 'Moderado' | 'Alto riesgo emocional';
  dateLabel: string;
  highlights: string[];
}

const MENTAL_QUESTIONS = [
  'Poco interes o placer en hacer cosas',
  'Sentirse triste o sin esperanza',
  'Problemas para dormir o dormir demasiado',
  'Sentirse cansado/a o con poca energia',
  'Falta de apetito o comer en exceso',
  'Sentirse mal contigo mismo/a',
  'Problemas para concentrarte en actividades diarias',
  'Lentitud o inquietud notable',
  'Pensamientos negativos o de dano',
];

const ANSWER_OPTIONS = [
  { label: 'Nunca', value: 0 },
  { label: 'Varios dias', value: 1 },
  { label: 'Mas de la mitad de los dias', value: 2 },
  { label: 'Casi todos los dias', value: 3 },
];

@Component({
  selector: 'app-salud-mental-paciente',
  imports: [PatientDashboardShellComponent],
  templateUrl: './salud-mental-paciente.html',
  styleUrls: ['./salud-mental-paciente.scss', '../../patient/patient-dashboard.shared.scss'],
})
export class SaludMentalPacienteComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly mentalHealth = inject(MentalHealthService);
  private readonly aiService = inject(AiService);
  protected readonly shellNav = inject(PatientShellNav);
  private routeSub?: Subscription;

  protected readonly mentalQuestions = MENTAL_QUESTIONS;
  protected readonly mentalAnswerOptions = ANSWER_OPTIONS;

  protected readonly view = signal<MentalView>('intro');
  protected readonly questionIndex = signal(0);
  protected readonly answers = signal<number[]>(Array(MENTAL_QUESTIONS.length).fill(-1));
  protected readonly result = signal<MentalTestResult | null>(null);
  protected readonly showRecommendations = signal(false);
  protected readonly wellnessInsight = signal<WellnessInsight | null>(null);
  protected readonly wellnessLoading = signal(false);
  protected readonly wellnessError = signal('');

  protected readonly userFirstName = computed(
    () => this.auth.getCurrentUser()?.firstName?.trim() || 'Paciente',
  );

  protected readonly mentalProgress = computed(() =>
    Math.round(((this.questionIndex() + 1) / MENTAL_QUESTIONS.length) * 100),
  );

  protected readonly canContinue = computed(() => this.answers()[this.questionIndex()] >= 0);

  protected readonly currentQuestion = computed(() => MENTAL_QUESTIONS[this.questionIndex()]);

  ngOnInit(): void {
    this.syncViewFromUrl(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.syncViewFromUrl((event as NavigationEnd).urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  protected beginTest(): void {
    this.answers.set(Array(MENTAL_QUESTIONS.length).fill(-1));
    this.questionIndex.set(0);
    void this.router.navigate(['/paciente/salud-mental/test']);
  }

  protected backToIntro(): void {
    void this.router.navigate(['/paciente/salud-mental']);
  }

  protected selectAnswer(value: number): void {
    this.answers.update((items) => {
      const updated = [...items];
      updated[this.questionIndex()] = value;
      return updated;
    });
  }

  protected previousQuestion(): void {
    this.questionIndex.update((index) => Math.max(index - 1, 0));
  }

  protected nextQuestion(): void {
    if (!this.canContinue()) {
      return;
    }
    if (this.questionIndex() >= MENTAL_QUESTIONS.length - 1) {
      this.finishTest();
      return;
    }
    this.questionIndex.update((index) => index + 1);
  }

  protected openRecommendations(): void {
    this.showRecommendations.set(true);
  }

  protected schedulePsychology(): void {
    void this.router.navigate(['/paciente/citas/buscar-especialista'], {
      queryParams: { specialty: 'Psicologia' },
    });
  }

  private finishTest(): void {
    const normalized = this.answers().map((value) => (value < 0 ? 0 : value));
    const score = normalized.reduce((sum, value) => sum + value, 0);
    const level = this.getLevel(score);
    const highlights = normalized
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((item) => `${MENTAL_QUESTIONS[item.index]} (${item.value} pts)`);

    this.result.set({
      score,
      level,
      dateLabel: new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      highlights: highlights.length > 0 ? highlights : ['Sin sintomas destacados en esta evaluacion.'],
    });
    this.showRecommendations.set(false);
    this.wellnessInsight.set(null);
    this.wellnessError.set('');

    this.mentalHealth.submitScreening({ answers: normalized }).subscribe({
      next: () => {
        void this.router.navigate(['/paciente/salud-mental/resultado']);
        this.loadWellnessInsight();
      },
      error: (error) => {
        this.wellnessError.set(apiErrorMessage(error, 'No se pudo guardar el cribado.'));
        void this.router.navigate(['/paciente/salud-mental/resultado']);
      },
    });
  }

  private loadWellnessInsight(): void {
    this.wellnessLoading.set(true);
    this.wellnessError.set('');
    this.aiService.wellnessInsight().subscribe({
      next: (res) => {
        this.wellnessInsight.set(res.insight);
        this.wellnessLoading.set(false);
      },
      error: (error) => {
        this.wellnessError.set(apiErrorMessage(error, 'No se pudo generar el insight de bienestar.'));
        this.wellnessLoading.set(false);
      },
    });
  }

  private syncViewFromUrl(url: string): void {
    if (url.includes('/salud-mental/test')) {
      this.view.set('test');
      return;
    }
    if (url.includes('/salud-mental/resultado')) {
      this.view.set('resultado');
      if (!this.wellnessInsight() && !this.wellnessLoading() && !this.wellnessError()) {
        this.loadWellnessInsight();
      }
      return;
    }
    this.view.set('intro');
  }

  private getLevel(score: number): MentalTestResult['level'] {
    if (score <= 4) {
      return 'Sin sintomas relevantes';
    }
    if (score <= 9) {
      return 'Leve';
    }
    if (score <= 14) {
      return 'Moderado';
    }
    return 'Alto riesgo emocional';
  }
}
