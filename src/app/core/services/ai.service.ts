import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdherenceReportResponse,
  ChatRequest,
  ChatResponse,
  IngestResult,
  ReportResponse,
  SupportAnswer,
  WellnessReportResponse,
} from '../../shared/models/ai.model';

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private base = environment.aiUrl;

  appointmentChat(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/appointment`, { message } satisfies ChatRequest);
  }

  medicationChat(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/medication`, { message } satisfies ChatRequest);
  }

  scheduleChat(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.base}/schedule`, { message } satisfies ChatRequest);
  }

  institutionReport(from: string, to: string): Observable<ReportResponse> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ReportResponse>(`${this.base}/report`, { params });
  }

  adherenceReport(patientId: number): Observable<AdherenceReportResponse> {
    const params = new HttpParams().set('patientId', String(patientId));
    return this.http.get<AdherenceReportResponse>(`${this.base}/adherence/report`, { params });
  }

  wellnessInsight(): Observable<WellnessReportResponse> {
    return this.http.get<WellnessReportResponse>(`${this.base}/wellness/insight`);
  }

  supportAsk(message: string): Observable<SupportAnswer> {
    return this.http.post<SupportAnswer>(`${this.base}/support/ask`, { message } satisfies ChatRequest);
  }

  ingest(): Observable<IngestResult> {
    return this.http.post<IngestResult>(`${this.base}/support/ingest`, {});
  }
}
