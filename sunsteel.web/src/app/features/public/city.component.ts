import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { City, ProductCard, metalClass } from '../../core/models/catalog.model';
import { SeoService } from '../../core/services/seo.service';
import { SiteService } from '../../core/services/site.service';
import { breadcrumbLd, organizationLd } from '../../core/services/structured-data';
import { MetalComponent } from '../../shared/metal.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { NotFoundComponent } from './not-found.component';

/** /steel-suppliers-{city}/ — regional landing page (spec §5.2, meta formula §5.3). */
@Component({
  selector: 'ss-city',
  imports: [RouterLink, PageHeaderComponent, MetalComponent, NotFoundComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (c(); as c) {
      <ss-page-header [label]="'Steel suppliers · ' + c.name" [title]="'Steel &amp; metals for <em>' + c.name + '.</em>'" [lede]="c.intro"
        [crumbs]="[['/', 'Home'], ['', 'Steel suppliers in ' + c.name]]">
        <div class="mt-10 grid gap-6 sm:grid-cols-3">
          <div class="card-rule"><span class="label">Dispatch</span><b class="mt-1 block font-serif text-[28px] font-medium">{{ c.leadTime }}</b></div>
          <div class="card-rule"><span class="label">From our godowns</span><b class="mt-1 block font-serif text-[28px] font-medium">{{ c.distanceKm ? c.distanceKm + ' km' : 'In the city' }}</b></div>
          <div class="card-rule"><span class="label">Industrial zones</span><b class="mt-1 block text-[14.5px] font-medium leading-snug">{{ c.zones }}</b></div>
        </div>
      </ss-page-header>

      <section class="wrap grid gap-12 pb-[var(--sec)] lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <div>
          <span class="label label-accent mb-4">Who we supply in {{ c.name }}</span>
          <ul class="border-t border-ink">@for (i of c.industries; track i) { <li class="border-b border-line py-3.5 font-serif text-[20px]">{{ i }}</li> }</ul>
          <div class="mt-8 flex flex-wrap gap-3">
            <a routerLink="/contact-us/" class="btn">Request a quote</a>
            <a [href]="site.whatsapp('Hello Sun Steel Traders, I need material delivered to ' + c.name + '.')" target="_blank" rel="noopener" class="btn btn-ghost">WhatsApp</a>
          </div>
        </div>
        <div>
          <span class="label label-accent mb-4">Most requested from {{ c.name }}</span>
          <div class="grid grid-cols-2 gap-5">
            @for (p of c.popular; track p.slug) {
              <a [routerLink]="p.path" class="group min-w-0">
                <ss-metal [kind]="metal(p)" [src]="p.heroUrl" [caption]="p.grade" class="aspect-[4/3]" />
                <b class="mt-3 block font-serif text-[18px] font-medium leading-snug">{{ p.name }}</b>
              </a>
            }
          </div>
        </div>
      </section>
    } @else {
      <ss-not-found />
    }`,
})
export class CityComponent {
  protected readonly site = inject(SiteService);
  private readonly seo = inject(SeoService);
  protected readonly c = toSignal(inject(ActivatedRoute).data.pipe(map((d) => d['city'] as City | null)), { initialValue: null });

  constructor() {
    effect(() => {
      const c = this.c();
      if (!c) return;
      const path = `/steel-suppliers-${c.slug}/`;
      this.seo.set({
        title: c.metaTitle, description: c.metaDescription, path,
        jsonLd: [{ ...organizationLd((k) => this.site.get(k)), areaServed: c.name }, breadcrumbLd([['/', 'Home'], [path, `Steel suppliers in ${c.name}`]])],
      });
    });
  }

  protected metal(p: ProductCard): string { return metalClass(p.materialKey, p.siloKey); }
}
