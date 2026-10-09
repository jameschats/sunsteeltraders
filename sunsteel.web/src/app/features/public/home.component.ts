import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageInfo, SILO_METAL } from '../../core/models/catalog.model';
import { CatalogService } from '../../core/services/catalog.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteService } from '../../core/services/site.service';
import { compact, faqLd, organizationLd } from '../../core/services/structured-data';
import { FaqListComponent } from '../../shared/faq-list.component';
import { IconComponent } from '../../shared/icon.component';
import { MetalComponent } from '../../shared/metal.component';
import { RevealDirective } from '../../shared/reveal.directive';
import { SearchBoxComponent } from '../../shared/search-box.component';

/** v3 sheet 01: full-bleed macro hero, the library rail, proof band, the house, the scale, cities. */
@Component({
  selector: 'ss-home',
  imports: [RouterLink, MetalComponent, SearchBoxComponent, FaqListComponent, IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- hero -->
    <section class="relative flex min-h-[min(100svh,900px)] items-end overflow-hidden text-white">
      <ss-metal kind="metal-alloy" class="!absolute inset-0" />
      <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,32,.25)_0%,rgba(20,24,32,.15)_40%,rgba(20,24,32,.78)_100%)]"></div>
      <div class="wrap relative pb-[clamp(48px,7vw,96px)] pt-40">
        <span class="label !text-white/80 mb-5">{{ site.get('Tagline') }} · {{ site.get('LocationLine') }}</span>
        <h1 class="h-xxl max-w-[13ch] !text-[clamp(46px,7.4vw,108px)]">Ninety-three grades. <em class="!text-[#E2C49B]">One house.</em></h1>
        <p class="mt-6 max-w-[52ch] text-[clamp(15px,1.3vw,18px)] text-white/85">Mild, alloy and stainless steel, brass, copper, cast iron and engineering plastics. Cut to your size in our Simmakkal godowns and dispatched the same day.</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a routerLink="/contact-us/" class="btn">Speak to the concierge</a>
          <a routerLink="/products/" class="btn btn-ghost !border-white/70 !text-white hover:!bg-white hover:!text-ink">Explore the library</a>
        </div>
        <div class="mt-10 max-w-[560px]"><ss-search-box [dark]="true" /></div>
      </div>
    </section>

    <!-- 01 the library -->
    <section class="sec" ssReveal>
      <div class="wrap grid items-end gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <div>
          <span class="label label-accent mb-4">01 · The library</span>
          <h2 class="h-xl">Seven families, <em>curated.</em></h2>
          <p class="lede mt-5">Every grade a machine shop, fabricator or maintenance team in South India asks for, with chemistry, equivalents and live stock on its own page.</p>
          <a routerLink="/products/" class="lnk mt-7">View all {{ total() }} materials <ss-icon name="arrow" [size]="14" /></a>
        </div>
        <div class="-mx-[var(--pad)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--pad)] pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0">
          @for (s of catalog.index().silos; track s.key) {
            <a [routerLink]="'/products/' + s.key + '/'" class="group w-[210px] flex-none snap-start">
              <ss-metal [kind]="metal(s.key)" class="aspect-[4/5] transition-transform duration-700 ease-lux group-hover:scale-[1.02]" />
              <b class="mt-3 block font-serif text-[21px] font-medium leading-tight">{{ s.shortName }}</b>
              <span class="label mt-1">{{ s.productCount }} grades</span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- proof band -->
    <section class="on-dark bg-primary py-[clamp(48px,6vw,80px)] text-on-primary">
      <div class="wrap grid grid-cols-2 gap-8 md:grid-cols-4">
        @for (n of numbers; track n.label) {
          <div class="card-rule"><b class="chapter block !text-gold-light">{{ n.value }}</b><span class="label mt-3">{{ n.label }}</span></div>
        }
      </div>
    </section>

    <!-- 02 the house -->
    <section class="sec" ssReveal>
      <div class="wrap grid items-center gap-[clamp(32px,6vw,96px)] lg:grid-cols-2">
        <ss-metal kind="metal-brass" class="aspect-[5/4]" caption="Photograph to come: the godown, cut ends and crane" />
        <div>
          <span class="label label-accent mb-4">02 · The house</span>
          <h2 class="h-xl">We cut it the way <em>you drew it.</em></h2>
          <p class="lede mt-6">Three godowns in Simmakkal, a band saw that holds ±1 mm and an overhead crane that loads your truck in minutes. Bring a drawing, a sketch on paper or a voice note: we'll turn it into a cut list and a quote the same day.</p>
          <div class="mt-8 grid gap-6 sm:grid-cols-2">
            @for (s of steps; track s.n) {
              <div class="card-rule"><span class="font-serif text-[30px] leading-none text-accent">{{ s.n }}</span><b class="mt-2 block font-serif text-[20px] font-medium">{{ s.t }}</b><p class="mt-1 text-[14px] text-muted">{{ s.d }}</p></div>
            }
          </div>
          <a routerLink="/about-us/" class="lnk mt-8">Our atelier <ss-icon name="arrow" [size]="14" /></a>
        </div>
      </div>
    </section>

    <!-- 03 the scale teaser -->
    <section class="border-y border-line bg-paper py-[clamp(40px,5vw,72px)]" ssReveal>
      <div class="wrap flex flex-wrap items-center justify-between gap-6">
        <div>
          <span class="label label-accent mb-3">03 · The scale</span>
          <h2 class="h-l max-w-[24ch]">Weigh a piece in seconds, <em>then ask us.</em></h2>
        </div>
        <a routerLink="/metal-weight-calculator/" class="btn btn-ghost"><ss-icon name="scale" [size]="16" />Open the scale</a>
      </div>
    </section>

    <!-- 04 delivery -->
    <section class="sec" ssReveal>
      <div class="wrap grid gap-12 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <div>
          <span class="label label-accent mb-4">04 · Dispatch</span>
          <h2 class="h-xl">From Madurai, <em>across the south.</em></h2>
          <p class="lede mt-5">Same day across Madurai, Virudhunagar and Sivakasi. Next day to Tirunelveli, Tuticorin and Trichy.</p>
        </div>
        <div class="scroll-x">
          <table class="dtable">
            <thead><tr><th>City</th><th>Dispatch</th><th></th></tr></thead>
            <tbody>
              @for (l of catalog.index().leadTimes; track l.city) {
                <tr><td class="font-serif text-[19px]">{{ l.city }}</td><td>{{ l.leadTime }}</td>
                  <td class="text-right">@if (cityPath(l.city); as p) { <a [routerLink]="p" class="lnk">Suppliers in {{ l.city }}</a> }</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    @if (page()?.faqs?.length) {
      <section class="sec pt-0" ssReveal>
        <div class="wrap grid gap-10 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div><span class="label label-accent mb-4">Questions</span><h2 class="h-l">Before you <em>call.</em></h2></div>
          <ss-faq-list [faqs]="page()!.faqs" />
        </div>
      </section>
    }

    <section class="on-dark bg-primary py-[clamp(64px,8vw,112px)] text-on-primary">
      <div class="wrap flex flex-wrap items-end justify-between gap-8">
        <h2 class="h-xl max-w-[18ch]">Tell us what you're <em>making.</em></h2>
        <div class="flex flex-wrap gap-3">
          <a routerLink="/contact-us/" class="btn">Speak to the concierge</a>
          <a [href]="site.whatsappUrl()" target="_blank" rel="noopener" class="btn btn-ghost"><ss-icon name="wa" [size]="16" />WhatsApp</a>
        </div>
      </div>
    </section>`,
})
export class HomeComponent {
  protected readonly site = inject(SiteService);
  protected readonly catalog = inject(CatalogService);
  protected readonly page = signal<PageInfo | null>(null);
  protected readonly total = computed(() => this.catalog.index().silos.reduce((s, x) => s + x.productCount, 0) || 93);

  protected readonly numbers = [
    { value: '3', label: 'Godowns in Simmakkal' },
    { value: '93', label: 'Grades in stock' },
    { value: '±1', label: 'mm band-saw cut' },
    { value: 'MTC', label: 'With every mill lot' },
  ];

  protected readonly steps = [
    { n: 'I', t: 'Send your list', d: 'Sizes line by line, a drawing, or a photo of a sketch.' },
    { n: 'II', t: 'Quote the same day', d: 'Price per kg with GST, cutting and delivery shown.' },
    { n: 'III', t: 'Band-saw cut', d: 'Rounds, flats and blocks cut to ±1 mm.' },
    { n: 'IV', t: 'Crane loaded', d: 'Straight onto your truck, or our lorry to your door.' },
  ];

  constructor() {
    this.catalog.loadIndex().subscribe();
    const seo = inject(SeoService);
    seo.set({
      title: 'Steel, Stainless, Brass & Copper Stockist in Madurai | Sun Steel Traders',
      description: 'Multi-metal stockist in Simmakkal, Madurai: 93 grades of mild, alloy and stainless steel, non-ferrous metals, cast iron and plastics. Cut to size, MTC provided, same-day dispatch.',
      path: '/',
      jsonLd: compact([organizationLd((k) => this.site.get(k))]),
    });
    this.catalog.page('').subscribe((p) => {
      this.page.set(p);
      if (p) seo.set({
        title: p.metaTitle || 'Sun Steel Traders', description: p.metaDescription ?? undefined, path: '/',
        jsonLd: compact([organizationLd((k) => this.site.get(k)), faqLd(p.faqs)]),
      });
    });
  }

  protected metal(key: string): string { return SILO_METAL[key] ?? 'metal-steel'; }

  protected cityPath(city: string): string | null {
    return this.catalog.index().cities.find((c) => c.name === city)?.path ?? null;
  }
}
