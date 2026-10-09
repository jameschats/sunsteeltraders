import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Public pages render on the server per request, so crawlers get full HTML with the
 * admin's latest content and theme (and so the old Wix URLs keep their rankings).
 * The admin is client-only: its session lives in localStorage.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
