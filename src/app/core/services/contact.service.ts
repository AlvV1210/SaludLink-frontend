import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ContactMessageRequest,
  ContactMessageResponse,
} from '../../shared/models/contact.model';

const STORAGE_KEY = 'saludlink.contactMessages';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  submit(body: ContactMessageRequest): Observable<ContactMessageResponse> {
    return this.http
      .post<ContactMessageResponse>(`${environment.apiUrl}/contact`, body)
      .pipe(catchError(() => of(this.persistLocally(body))));
  }

  private persistLocally(body: ContactMessageRequest): ContactMessageResponse {
    const entry: ContactMessageResponse & ContactMessageRequest = {
      id: `local-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      ...body,
    };

    const existing = this.readStored();
    existing.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)));

    return { id: entry.id, receivedAt: entry.receivedAt };
  }

  private readStored(): Array<ContactMessageResponse & ContactMessageRequest> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as Array<ContactMessageResponse & ContactMessageRequest>;
    } catch {
      return [];
    }
  }
}
