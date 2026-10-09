import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { AuthResponse } from '../models/auth.model';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Attaches the access token to API calls; on a 401 performs ONE silent refresh and retries.
 *
 * Refresh tokens rotate (each use revokes the old one), so concurrent 401s must share a
 * single refresh. DailyCalendarShop's version refreshed per request, which made the second
 * of two parallel calls fail and sign the user out.
 */
let refreshInFlight: Observable<AuthResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const isApi = req.url.startsWith(API_BASE_URL);
  const isAuthCall = req.url.startsWith(`${API_BASE_URL}/auth/`) && !req.url.endsWith('/auth/me') && !req.url.endsWith('/password/change');
  const token = storage.getAccessToken();
  const withToken = (t: string | null) => (t && isApi && !isAuthCall ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req);

  return next(withToken(token)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || !isApi || isAuthCall || !storage.getRefreshToken()) return throwError(() => err);

      refreshInFlight ??= auth.refresh().pipe(
        shareReplay(1),
        finalize(() => (refreshInFlight = null)),
      );

      return refreshInFlight.pipe(
        switchMap((res) => next(withToken(res.accessToken))),
        catchError((refreshErr) => {
          auth.clearSession();
          router.navigate(['/admin/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
