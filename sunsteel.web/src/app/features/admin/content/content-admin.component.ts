import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { absUrl } from '../../../core/api.config';
import { apiError } from '../../../core/models/api.model';
import { MediaItem } from '../../../core/models/media.model';
import { AdminApiService, AdminCity, AdminFaq, AdminPage, AdminPolicy, AdminSilo, ProductRow } from '../../../core/services/admin-api.service';
import { IconComponent } from '../../../shared/icon.component';
import { MediaPickerComponent } from '../media/media-picker.component';

type Tab = 'pages' | 'faqs' | 'policies' | 'silos' | 'cities';
type Msg = { ok: boolean; text: string } | null;

/**
 * Everything written on the public site that is not a product: search text for each page, the questions
 * under pages / families / products, the terms and privacy pages, family intros with their photos, and the city pages.
 */
@Component({
  selector: 'ss-content-admin',
  imports: [FormsModule, IconComponent, MediaPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-5">
      <h1 class="text-[22px] font-medium">Pages &amp; content</h1>
      <p class="mt-0.5 text-[13.5px] text-[#6B7485]">The words on the website. Each section saves on its own and shows on the site straight away.</p>
    </header>

    <nav class="mb-5 flex flex-wrap gap-1 border-b border-[#E3E6EB]" role="tablist">
      @for (t of tabs; track t.id) {
        <button type="button" role="tab" [attr.aria-selected]="tab() === t.id" (click)="show(t.id)"
                class="-mb-px border-0 border-b-2 bg-transparent px-4 py-2.5 text-[14px]"
                [class]="tab() === t.id ? 'border-b-[var(--color-accent)] font-medium text-[#1D2430]' : 'border-b-transparent text-[#6B7485] hover:text-[#1D2430]'">{{ t.label }}</button>
      }
    </nav>

    @if (message(); as m) { <p class="alert mb-4" [class.alert-ok]="m.ok" role="status">{{ m.text }}</p> }

    <!-- ===== page search text ===== -->
    @if (tab() === 'pages') {
      <p class="ahint mb-3">The title and description Google shows for each page. Empty means the website's own default.</p>
      <div class="grid gap-4">
        @for (p of pages(); track p.id) {
          <fieldset class="card grid gap-3">
            <legend class="sr-only">{{ p.title }}</legend>
            <div class="flex items-center justify-between gap-3"><b class="font-medium">{{ p.title }}</b><span class="text-[12px] text-[#8A93A3]">/{{ p.slug }}</span></div>
            <label class="alabel">Page title<input class="ainput" maxlength="160" [name]="'pt' + p.id" [(ngModel)]="p.metaTitle" /><span class="ahint">{{ (p.metaTitle || '').length }}/160</span></label>
            <label class="alabel">Description<textarea class="ainput" maxlength="320" [name]="'pd' + p.id" [(ngModel)]="p.metaDescription"></textarea><span class="ahint">{{ (p.metaDescription || '').length }}/320</span></label>
            <div><button type="button" class="abtn abtn-pri abtn-sm" [disabled]="busy()" (click)="savePage(p)">Save</button></div>
          </fieldset>
        }
      </div>
    }

    <!-- ===== questions ===== -->
    @if (tab() === 'faqs') {
      <div class="card mb-4 grid gap-3 sm:grid-cols-2">
        <label class="alabel">Where do the questions appear?
          <select class="ainput" [ngModel]="faqScope()" (ngModelChange)="setScope($event)" name="scope">
            <option value="page">A page</option><option value="silo">A material family</option><option value="product">A product</option>
          </select></label>
        <label class="alabel">Which one?
          <select class="ainput" [ngModel]="faqKey()" (ngModelChange)="setKey($event)" name="key">
            @for (o of faqOptions(); track o.key) { <option [value]="o.key">{{ o.label }}</option> }
          </select></label>
      </div>
      <p class="ahint mb-3">With no questions saved here the website shows its built-in answers for this page. Add your own to replace them.</p>
      <div class="grid gap-3">
        @for (q of faqs(); track $index; let i = $index) {
          <div class="card grid gap-2 !p-3" [class.opacity-60]="!q.visible">
            <label class="alabel">Question<input class="ainput" maxlength="300" [name]="'q' + i" [(ngModel)]="q.question" /></label>
            <label class="alabel">Answer<textarea class="ainput" maxlength="1500" [name]="'a' + i" [(ngModel)]="q.answer"></textarea></label>
            <div class="flex flex-wrap gap-1.5">
              <button type="button" class="abtn abtn-sm" [disabled]="i === 0" (click)="moveFaq(i, -1)" aria-label="Move up"><ss-icon name="up" [size]="13" /></button>
              <button type="button" class="abtn abtn-sm" [disabled]="i === faqs().length - 1" (click)="moveFaq(i, 1)" aria-label="Move down"><ss-icon name="down" [size]="13" /></button>
              <button type="button" class="abtn abtn-sm" (click)="q.visible = !q.visible">{{ q.visible ? 'Shown' : 'Hidden' }}</button>
              <button type="button" class="abtn abtn-sm abtn-danger" (click)="removeFaq(i)" aria-label="Remove"><ss-icon name="trash" [size]="13" /></button>
            </div>
          </div>
        }
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="abtn" (click)="addFaq()"><ss-icon name="plus" [size]="14" />Add question</button>
        <button type="button" class="abtn abtn-pri" [disabled]="busy()" (click)="saveFaqs()">Save questions</button>
      </div>
    }

    <!-- ===== policies ===== -->
    @if (tab() === 'policies') {
      <p class="ahint mb-3">Use simple tags: &lt;h2&gt; headings, &lt;p&gt; paragraphs, &lt;ul&gt;&lt;li&gt; lists, &lt;strong&gt;, &lt;a href&gt;. Anything else is removed when you save.</p>
      <div class="grid gap-4">
        @for (p of policies(); track p.slug) {
          <fieldset class="card grid gap-3">
            <legend class="sr-only">{{ p.title }}</legend>
            <label class="alabel">Title<input class="ainput" maxlength="150" [name]="'ptitle' + p.slug" [(ngModel)]="p.title" /></label>
            <label class="alabel">Text<textarea class="ainput !min-h-[260px] font-mono text-[13px]" [name]="'pbody' + p.slug" [(ngModel)]="p.bodyHtml"></textarea></label>
            <div class="flex items-center gap-3"><button type="button" class="abtn abtn-pri abtn-sm" [disabled]="busy()" (click)="savePolicy(p)">Save</button>
              <a [href]="'/' + p.slug + '/'" class="text-[13px] underline">View page</a></div>
          </fieldset>
        }
      </div>
    }

    <!-- ===== families ===== -->
    @if (tab() === 'silos') {
      <p class="ahint mb-3">The intro line and photo of each material family, shown on the home page and the family page.</p>
      <div class="grid gap-4">
        @for (s of silos(); track s.id) {
          <fieldset class="card grid gap-3 sm:grid-cols-[180px_1fr]">
            <legend class="sr-only">{{ s.name }}</legend>
            <div class="grid content-start gap-2">
              @if (s.heroUrl) { <img class="aspect-[4/5] w-full rounded-md object-cover" [src]="url(s.heroUrl)" alt="" /> }
              @else { <div class="grid aspect-[4/5] place-items-center rounded-md border border-dashed border-[#B8BFCC] px-2 text-center text-[12px] text-[#8A93A3]">No photo</div> }
              <button type="button" class="abtn abtn-sm" (click)="chooseFor.set(s.id)">{{ s.heroUrl ? 'Change' : 'Choose photo' }}</button>
              @if (s.heroUrl) { <button type="button" class="abtn abtn-sm abtn-danger" (click)="clearSiloPhoto(s)">Remove</button> }
            </div>
            <div class="grid content-start gap-3">
              <b class="font-medium">{{ s.name }}</b>
              <label class="alabel">Intro<textarea class="ainput" maxlength="800" [name]="'si' + s.id" [(ngModel)]="s.intro"></textarea></label>
              <label class="alabel">Top grades<input class="ainput" maxlength="300" [name]="'st' + s.id" [(ngModel)]="s.topGrades" /><span class="ahint">Used in the automatic search description, e.g. EN8, EN24, EN31</span></label>
              <label class="alabel">Page title (search)<input class="ainput" maxlength="160" [name]="'smt' + s.id" [(ngModel)]="s.metaTitle" placeholder="Automatic" /></label>
              <label class="alabel">Description (search)<textarea class="ainput" maxlength="320" [name]="'smd' + s.id" [(ngModel)]="s.metaDescription" placeholder="Automatic"></textarea></label>
              <div><button type="button" class="abtn abtn-pri abtn-sm" [disabled]="busy()" (click)="saveSilo(s)">Save</button></div>
            </div>
          </fieldset>
        }
      </div>
    }

    <!-- ===== cities ===== -->
    @if (tab() === 'cities') {
      <p class="ahint mb-3">The "steel suppliers in …" landing pages. Hide a city to remove its page.</p>
      <div class="grid gap-4">
        @for (c of cities(); track c.id) {
          <fieldset class="card grid gap-3">
            <legend class="sr-only">{{ c.name }}</legend>
            <div class="flex items-center justify-between"><b class="font-medium">{{ c.name }}</b>
              <label class="flex items-center gap-2 text-[13px]"><input type="checkbox" [name]="'cp' + c.id" [(ngModel)]="c.isPublished" /> Published</label></div>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="alabel">Delivery time<input class="ainput" maxlength="60" [name]="'cl' + c.id" [(ngModel)]="c.leadTime" placeholder="e.g. Same day" /></label>
              <label class="alabel">Industrial areas<input class="ainput" maxlength="300" [name]="'cz' + c.id" [(ngModel)]="c.zones" /></label>
            </div>
            <label class="alabel">Intro<textarea class="ainput" maxlength="800" [name]="'ci' + c.id" [(ngModel)]="c.intro"></textarea></label>
            <label class="alabel">Industries served (one per line)<textarea class="ainput" [name]="'cin' + c.id" [ngModel]="c.industries.join('\\n')" (ngModelChange)="c.industries = $event.split('\\n')"></textarea></label>
            <label class="alabel">Page title (search)<input class="ainput" maxlength="160" [name]="'cmt' + c.id" [(ngModel)]="c.metaTitle" placeholder="Automatic" /></label>
            <label class="alabel">Description (search)<textarea class="ainput" maxlength="320" [name]="'cmd' + c.id" [(ngModel)]="c.metaDescription" placeholder="Automatic"></textarea></label>
            <div><button type="button" class="abtn abtn-pri abtn-sm" [disabled]="busy()" (click)="saveCity(c)">Save</button></div>
          </fieldset>
        }
      </div>
    }

    @if (chooseFor() !== null) {
      <ss-media-picker kind="image" title="Choose a photo for this family" (picked)="pickSilo($event)" (closed)="chooseFor.set(null)" />
    }`,
})
export class ContentAdminComponent {
  private readonly api = inject(AdminApiService);

  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'pages', label: 'Page search text' }, { id: 'faqs', label: 'Questions (FAQs)' }, { id: 'policies', label: 'Terms & privacy' },
    { id: 'silos', label: 'Material families' }, { id: 'cities', label: 'City pages' },
  ];
  protected readonly tab = signal<Tab>('pages');
  protected readonly message = signal<Msg>(null);
  protected readonly busy = signal(false);

  protected readonly pages = signal<AdminPage[]>([]);
  protected readonly policies = signal<AdminPolicy[]>([]);
  protected readonly silos = signal<AdminSilo[]>([]);
  protected readonly cities = signal<AdminCity[]>([]);
  protected readonly products = signal<ProductRow[]>([]);
  protected readonly chooseFor = signal<number | null>(null);

  protected readonly faqScope = signal<'page' | 'silo' | 'product'>('page');
  protected readonly faqKey = signal('');
  protected readonly faqs = signal<AdminFaq[]>([]);
  protected readonly faqOptions = signal<{ key: string; label: string }[]>([]);

  private readonly loaded = new Set<Tab>();

  constructor() {
    this.show('pages');
  }

  protected url = absUrl;

  protected show(t: Tab): void {
    this.tab.set(t);
    this.message.set(null);
    if (this.loaded.has(t)) return;
    this.loaded.add(t);
    const fail = (e: unknown) => this.message.set({ ok: false, text: apiError(e) });
    if (t === 'pages') this.api.pages().subscribe({ next: (x) => this.pages.set(x), error: fail });
    if (t === 'policies') this.api.policies().subscribe({ next: (x) => this.policies.set(x), error: fail });
    if (t === 'silos') this.api.silos().subscribe({ next: (x) => this.silos.set(x), error: fail });
    if (t === 'cities') this.api.cities().subscribe({ next: (x) => this.cities.set(x), error: fail });
    if (t === 'faqs') {
      this.api.pages().subscribe({ next: (x) => { this.pages.set(x); this.setScope('page'); }, error: fail });
      this.api.silos().subscribe({ next: (x) => this.silos.set(x), error: fail });
      this.api.products().subscribe({ next: (x) => this.products.set(x.items), error: fail });
    }
  }

  private run(obs: import('rxjs').Observable<unknown>, ok: string): void {
    this.busy.set(true);
    this.message.set(null);
    obs.subscribe({
      next: () => { this.busy.set(false); this.message.set({ ok: true, text: ok }); },
      error: (e) => { this.busy.set(false); this.message.set({ ok: false, text: apiError(e) }); },
    });
  }

  // ---- pages / policies / cities / silos ----
  protected savePage(p: AdminPage): void { this.run(this.api.savePage(p.id, { metaTitle: p.metaTitle, metaDescription: p.metaDescription }), `Saved “${p.title}”.`); }
  protected savePolicy(p: AdminPolicy): void { this.run(this.api.savePolicy(p.slug, { title: p.title, bodyHtml: p.bodyHtml }), `Saved “${p.title}”.`); }
  protected saveCity(c: AdminCity): void {
    this.run(this.api.saveCity(c.id, { leadTime: c.leadTime, zones: c.zones, intro: c.intro, industries: c.industries.filter((i) => i.trim()), metaTitle: c.metaTitle, metaDescription: c.metaDescription, isPublished: c.isPublished }), `Saved ${c.name}.`);
  }
  protected saveSilo(s: AdminSilo): void {
    this.run(this.api.saveSilo(s.id, { intro: s.intro, topGrades: s.topGrades, metaTitle: s.metaTitle, metaDescription: s.metaDescription, heroMediaId: s.heroMediaId }), `Saved ${s.name}.`);
  }

  protected pickSilo(m: MediaItem): void {
    const id = this.chooseFor();
    this.chooseFor.set(null);
    const widths = Object.keys(m.variants).map(Number).sort((a, b) => a - b);
    const w = widths.find((x) => x >= 480) ?? widths[widths.length - 1];
    const u = w ? m.variants[w] : m.url;
    this.silos.update((all) => all.map((s) => (s.id === id ? { ...s, heroMediaId: m.id, heroUrl: u } : s)));
  }

  protected clearSiloPhoto(s: AdminSilo): void {
    this.silos.update((all) => all.map((x) => (x.id === s.id ? { ...x, heroMediaId: null, heroUrl: null } : x)));
  }

  // ---- FAQs ----
  protected setScope(scope: 'page' | 'silo' | 'product'): void {
    this.faqScope.set(scope);
    const opts = scope === 'page' ? this.pages().map((p) => ({ key: p.slug, label: p.title + (p.slug ? ' (/' + p.slug + ')' : ' (home)') }))
      : scope === 'silo' ? this.silos().map((s) => ({ key: s.key, label: s.name }))
      : this.products().map((p) => ({ key: p.slug, label: p.name + ' · ' + p.grade }));
    this.faqOptions.set(opts);
    this.setKey(opts[0]?.key ?? '');
  }

  protected setKey(key: string): void {
    this.faqKey.set(key);
    this.faqs.set([]);
    this.message.set(null);
    this.api.faqs(this.faqScope(), key).subscribe({ next: (x) => this.faqs.set(x), error: (e) => this.message.set({ ok: false, text: apiError(e) }) });
  }

  protected addFaq(): void { this.faqs.update((l) => [...l, { question: '', answer: '', visible: true }]); }
  protected removeFaq(i: number): void { this.faqs.update((l) => l.filter((_, k) => k !== i)); }
  protected moveFaq(i: number, d: -1 | 1): void {
    this.faqs.update((l) => { const c = [...l]; const j = i + d; if (j < 0 || j >= c.length) return l; [c[i], c[j]] = [c[j], c[i]]; return c; });
  }
  protected saveFaqs(): void { this.run(this.api.saveFaqs(this.faqScope(), this.faqKey(), this.faqs()), 'Questions saved.'); }
}
