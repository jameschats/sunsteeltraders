import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from '../models/api.model';
import { Dims, Form } from '../weight/weight';

/** One line of the customer's request ("cut list"), kept in this browser until sent. */
export interface RequestLine {
  id: string;
  productSlug?: string;
  gradeText: string;
  form: Form;
  dims: Dims;
  section?: string;
  dimText: string;
  lengthMm: number;
  quantity: number;
  cutToSize: boolean;
  kg: number;
}

export interface LeadPayload {
  type: 'RFQ' | 'Catalogue' | 'Contact' | 'Callback';
  name: string;
  phone: string;
  company?: string;
  gstin?: string;
  email?: string;
  city?: string;
  industry?: string;
  message?: string;
  callbackAt?: string;
  channel?: string;
  sourcePage?: string;
  website?: string;
  items?: { productSlug?: string; gradeText?: string; form: Form; dims: Dims; section?: string; lengthMm: number; quantity: number; cutToSize: boolean }[];
}

export interface LeadCreated { reference: string; totalKg?: number | null; whatsAppUrl: string }

const KEY = 'sst-request-v1';

/**
 * The request basket ("Your request" in the concierge). Lines persist in localStorage so a
 * customer can build a list across product pages. Submitting saves the lead on the server
 * first; only then does the page open WhatsApp with the server-built message.
 */
@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly lines = signal<RequestLine[]>(this.read());
  readonly count = computed(() => this.lines().length);
  readonly totalKg = computed(() => this.lines().reduce((s, l) => s + (l.kg || 0), 0));
  /** Drawer open state, shared by the header button and "Add to request" buttons. */
  readonly open = signal(false);

  add(line: Omit<RequestLine, 'id'>): void {
    this.set([...this.lines(), { ...line, id: Math.random().toString(36).slice(2, 10) }]);
  }

  update(id: string, patch: Partial<RequestLine>): void {
    this.set(this.lines().map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  remove(id: string): void {
    this.set(this.lines().filter((l) => l.id !== id));
  }

  clear(): void {
    this.set([]);
  }

  submit(body: LeadPayload): Observable<LeadCreated> {
    return this.http.post<ApiResponse<LeadCreated>>(`${API_BASE_URL}/leads`, body).pipe(map((r) => r.data!));
  }

  uploadFiles(reference: string, phone: string, files: File[]): Observable<void> {
    const form = new FormData();
    form.append('phone', phone);
    for (const f of files) form.append('files', f, f.name);
    return this.http.post(`${API_BASE_URL}/leads/${encodeURIComponent(reference)}/files`, form).pipe(map(() => void 0));
  }

  /** Fire-and-forget click counter for the dashboard. */
  click(kind: 'wa' | 'call' | 'email' | 'map', page: string): void {
    if (!this.isBrowser) return;
    this.http.post(`${API_BASE_URL}/events/click`, { kind, page }).subscribe({ error: () => {} });
  }

  toPayloadItems(): LeadPayload['items'] {
    return this.lines().map((l) => ({
      productSlug: l.productSlug, gradeText: l.gradeText, form: l.form, dims: l.dims, section: l.section,
      lengthMm: l.lengthMm, quantity: l.quantity, cutToSize: l.cutToSize,
    }));
  }

  private set(lines: RequestLine[]): void {
    this.lines.set(lines);
    if (!this.isBrowser) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage full or blocked: keep in memory */ }
  }

  private read(): RequestLine[] {
    if (!this.isBrowser) return [];
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
}
