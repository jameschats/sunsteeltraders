import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/*
 * The session lives in localStorage, which doesn't exist during SSR. Admin routes are
 * client-rendered (app.routes.server.ts), but guards still defer on the server to be safe.
 * Guards are a convenience; the API authorises every admin call itself.
 */
const onServer = () => !isPlatformBrowser(inject(PLATFORM_ID));

/** Signed in, holding at least one permission, and not owing a password change. */
export const adminGuard: CanActivateFn = (_route, state) => {
  if (onServer()) return true;
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated() || auth.permissions().size === 0)
    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  if (auth.mustChangePassword()) return router.createUrlTree(['/admin/change-password']);
  return true;
};

/** One admin screen, one permission. Hidden links are also unreachable by URL. */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    if (onServer()) return true;
    const auth = inject(AuthService);
    return auth.can(permission) ? true : inject(Router).createUrlTree(['/admin']);
  };
}

/** Change-password screen needs a session, but not the "already changed" state. */
export const signedInGuard: CanActivateFn = () => {
  if (onServer()) return true;
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/admin/login']);
};

/** Login page: skip it when already signed in. */
export const guestGuard: CanActivateFn = () => {
  if (onServer()) return true;
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/admin']) : true;
};
