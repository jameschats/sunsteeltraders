import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { SearchBoxComponent } from '../../shared/search-box.component';

/**
 * Real 404 status during SSR, so search engines drop dead URLs instead of indexing this page.
 * Also embedded by the product, silo and city pages when their slug doesn't exist.
 */
@Component({
  selector: 'ss-not-found',
  imports: [RouterLink, SearchBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap pb-[var(--sec)] pt-[clamp(140px,16vw,200px)]">
      <span class="label label-accent mb-4">Page not found</span>
      <h1 class="h-xxl max-w-[15ch]">This piece isn't in <em>our racks.</em></h1>
      <p class="lede mt-6">The page may have moved. Search for the grade you need, or ask the concierge: we may stock it under another name.</p>
      <div class="mt-8 max-w-[520px]"><ss-search-box /></div>
      <div class="mt-9 flex flex-wrap gap-3.5">
        <a routerLink="/products/" class="btn">Explore the library</a>
        <a routerLink="/contact-us/" class="btn btn-ghost">Speak to the concierge</a>
      </div>
    </section>`,
})
export class NotFoundComponent {
  constructor() {
    const init = inject(RESPONSE_INIT, { optional: true });
    if (init) init.status = 404;
    inject(SeoService).set({ title: 'Page not found | Sun Steel Traders', path: '/404/', noindex: true });
  }
}
