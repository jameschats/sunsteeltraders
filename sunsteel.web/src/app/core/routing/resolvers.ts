import { inject } from '@angular/core';
import { ResolveFn, UrlMatchResult, UrlSegment } from '@angular/router';
import { catchError, of } from 'rxjs';
import { City, Policy, Product, Silo } from '../models/catalog.model';
import { CatalogService } from '../services/catalog.service';

/**
 * Data is fetched before the page renders, so SSR output always contains it. A missing
 * slug resolves to null and the page renders the 404 view with a real 404 status.
 */
export const siloResolver: ResolveFn<Silo | null> = (route) =>
  inject(CatalogService).silo(route.paramMap.get('silo')!).pipe(catchError(() => of(null)));

export const productResolver: ResolveFn<Product | null> = (route) =>
  inject(CatalogService).product(route.paramMap.get('silo')!, route.paramMap.get('slug')!).pipe(catchError(() => of(null)));

export const cityResolver: ResolveFn<City | null> = (route) =>
  inject(CatalogService).city(route.paramMap.get('city')!).pipe(catchError(() => of(null)));

export const policyResolver: ResolveFn<Policy | null> = (route) =>
  inject(CatalogService).policy(route.data['policy']).pipe(catchError(() => of(null)));

/** Matches /steel-suppliers-{city}/ (spec §5.2). Slugs are lowercase; see design doc §4. */
export function cityMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 1) return null;
  const m = segments[0].path.match(/^steel-suppliers-([a-z0-9-]+)$/i);
  return m ? { consumed: segments, posParams: { city: new UrlSegment(m[1].toLowerCase(), {}) } } : null;
}
