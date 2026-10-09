import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { AuthUser } from '../models/auth.model';

/** Persists the staff session in localStorage. SSR-safe: a no-op on the server. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly accessKey = 'qi.access';
  private readonly refreshKey = 'qi.refresh';
  private readonly userKey = 'qi.user';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getAccessToken(): string | null {
    return this.read(this.accessKey);
  }

  getRefreshToken(): string | null {
    return this.read(this.refreshKey);
  }

  getUser(): AuthUser | null {
    const raw = this.read(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  setSession(accessToken: string, refreshToken: string, user: AuthUser): void {
    this.write(this.accessKey, accessToken);
    this.write(this.refreshKey, refreshToken);
    this.setUser(user);
  }

  setUser(user: AuthUser): void {
    this.write(this.userKey, JSON.stringify(user));
  }

  clear(): void {
    if (!this.isBrowser) return;
    try {
      [this.accessKey, this.refreshKey, this.userKey].forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage blocked: nothing to clear */
    }
  }

  private read(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode / storage full: session lasts until reload */
    }
  }
}
