import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from '../models/api.model';
import { DEFAULT_SETTINGS, DEFAULT_THEME, SiteData, Theme } from '../models/site.model';

/**
 * Site settings + theme, loaded once at app start (SSR and browser). The theme is written
 * as CSS variables on <html>, so the server-rendered page already has the admin's colours
 * and there is no flash of the defaults.
 */
@Injectable({ providedIn: 'root' })
export class SiteService {
  private readonly http = inject(HttpClient);
  private readonly doc = inject(DOCUMENT);

  readonly settings = signal<Record<string, string>>({ ...DEFAULT_SETTINGS });
  readonly theme = signal<Theme>(DEFAULT_THEME);

  readonly businessName = computed(() => this.get('BusinessName'));
  readonly whatsappUrl = computed(() => this.whatsapp());

  load(): Observable<void> {
    return this.http.get<ApiResponse<SiteData>>(`${API_BASE_URL}/site`).pipe(
      tap((r) => {
        if (!r.data) return;
        const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
        for (const [k, v] of Object.entries(r.data.settings)) if (v) merged[k] = v;
        this.settings.set(merged);
        this.applyTheme(r.data.theme);
      }),
      map(() => void 0),
      // The site must render even if the API is down; defaults cover everything.
      catchError(() => {
        this.applyTheme(DEFAULT_THEME);
        return of(void 0);
      }),
    );
  }

  get(key: string): string {
    return this.settings()[key] ?? '';
  }

  /** wa.me link with an optional pre-filled message. */
  whatsapp(message?: string): string {
    const text = message || this.get('WhatsAppMessage');
    return `https://wa.me/${this.get('WhatsAppNumber')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  }

  tel(key: 'Phone1' | 'Phone2' | 'Landline' = 'Phone1'): string {
    return 'tel:' + this.get(key).replace(/\s/g, '');
  }

  applyTheme(theme: Theme): void {
    this.theme.set(theme);
    const style = this.doc.documentElement.style;
    style.setProperty('--color-primary', theme.primary);
    style.setProperty('--color-accent', theme.accent);
    style.setProperty('--color-surface', theme.surface);
  }

  /** Called by the admin screens after a successful save. */
  patchSettings(settings: Record<string, string | null>): void {
    const merged: Record<string, string> = { ...this.settings() };
    for (const [k, v] of Object.entries(settings)) {
      if (v) merged[k] = v;
      else delete merged[k];
    }
    this.settings.set({ ...DEFAULT_SETTINGS, ...merged });
  }
}
