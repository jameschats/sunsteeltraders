import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { UrlSerializer, provideRouter, withInMemoryScrolling } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { TrailingSlashUrlSerializer } from './core/routing/trailing-slash.serializer';
import { SiteService } from './core/services/site.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    // Spec URLs all end in "/": the serializer writes them that way everywhere.
    { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),
    // Settings + theme before first render, so SSR output already carries the admin's colours.
    provideAppInitializer(() => firstValueFrom(inject(SiteService).load())),
    // All admin timestamps in India time, whatever the viewer's or server's zone.
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: 'Asia/Kolkata' } },
  ],
};
