import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { ApiResponse } from '../models/api.model';
import { AuthConfig, AuthResponse, AuthUser } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

/**
 * Staff session. Ported from DailyCalendarShop's AuthService; customer flows (register,
 * OTP, email verification) removed. Permissions come from the login response, which the
 * API builds from the same rows it puts in the token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly base = `${API_BASE_URL}/auth`;

  readonly currentUser = signal<AuthUser | null>(this.storage.getUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly permissions = computed<ReadonlySet<string>>(() => new Set(this.currentUser()?.permissions ?? []));
  readonly mustChangePassword = computed(() => this.currentUser()?.mustChangePassword === true);
  readonly displayName = computed(() => {
    const u = this.currentUser();
    return u?.fullName || u?.email || '';
  });

  can(permission: string): boolean {
    return this.permissions().has(permission);
  }

  getConfig(): Observable<AuthConfig> {
    return this.http.get<ApiResponse<AuthConfig>>(`${this.base}/config`).pipe(map((r) => r.data ?? {}));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.post('login', { email, password });
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.post('google', { idToken });
  }

  refresh(): Observable<AuthResponse> {
    return this.post('refresh', { refreshToken: this.storage.getRefreshToken() });
  }

  /** Re-reads roles/permissions from the API (e.g. after an admin changed them). */
  me(): Observable<AuthUser> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.base}/me`).pipe(
      map((r) => r.data!),
      tap((u) => {
        this.storage.setUser(u);
        this.currentUser.set(u);
      }),
    );
  }

  changePassword(currentPassword: string | null, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/password/change`, { currentPassword, newPassword })
      .pipe(map(() => void 0));
  }

  /** Revokes the refresh token server-side (best effort), then clears the local session. */
  logout(): void {
    const refreshToken = this.storage.getRefreshToken();
    if (refreshToken) this.http.post(`${this.base}/logout`, { refreshToken }).subscribe({ error: () => {} });
    this.clearSession();
  }

  clearSession(): void {
    this.storage.clear();
    this.currentUser.set(null);
  }

  private post(path: string, body: unknown): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/${path}`, body).pipe(
      map((r) => r.data!),
      tap((res) => {
        this.storage.setSession(res.accessToken, res.refreshToken, res.user);
        this.currentUser.set(res.user);
      }),
    );
  }
}
