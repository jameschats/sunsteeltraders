import { DefaultUrlSerializer, UrlTree } from '@angular/router';

/**
 * Every public URL in the specification ends with "/" (e.g. /products/stainless-steel/).
 * Angular's router drops trailing slashes, so this serializer adds one back to every path
 * it writes. Links, the address bar and canonical tags then all match the sitemap exactly.
 * The SSR server 301-redirects slash-less requests (src/server.ts), so there is one URL per page.
 */
export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    // "/products/en8/" and "/products/en8" are the same route.
    return super.parse(url.replace(/(.)\/+(?=$|[?#])/, '$1'));
  }

  override serialize(tree: UrlTree): string {
    return withSlash(super.serialize(tree));
  }
}

export function withSlash(url: string): string {
  const cut = url.search(/[?#]/);
  const path = cut === -1 ? url : url.slice(0, cut);
  const rest = cut === -1 ? '' : url.slice(cut);
  if (path === '' || path.endsWith('/') || /\.[a-z0-9]{2,5}$/i.test(path) || path.startsWith('/admin')) return url;
  return `${path}/${rest}`;
}
