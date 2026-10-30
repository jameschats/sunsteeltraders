import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { SearchHit, stockClass } from '../core/models/catalog.model';
import { CatalogService } from '../core/services/catalog.service';
import { IconComponent } from './icon.component';

/** Grade search with live suggestions (names, grades and equivalents such as "4340" → EN24). */
@Component({
  selector: 'ss-search-box',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'outside($event)' },
  template: `
    <div class="relative" role="combobox" [attr.aria-expanded]="open()" aria-haspopup="listbox">
      <label class="flex items-center gap-3 border-b py-2.5" [class]="dark() ? 'border-white/40' : 'border-ink'">
        <ss-icon name="search" [size]="18" class="opacity-70" />
        <span class="sr-only">Search grades</span>
        <input type="search" [placeholder]="placeholder()" autocomplete="off" (input)="onInput($any($event.target).value)" (keydown)="key($event)"
               class="w-full min-w-0 bg-transparent text-[16px] outline-none placeholder:opacity-60" />
      </label>
      @if (open() && q().length >= 2) {
        <ul class="absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-auto rounded-sm border border-line bg-surface text-ink shadow-[0_24px_60px_-24px_rgba(30,36,48,.45)]" role="listbox">
          @for (h of hits(); track h.slug; let i = $index) {
            <li role="option" [attr.aria-selected]="i === active()">
              <a [routerLink]="h.path" (click)="close()" class="flex items-center gap-4 px-4 py-3 hover:bg-tint" [class.bg-tint]="i === active()">
                <span class="min-w-0 flex-1"><b class="font-serif text-[18px] font-medium">{{ h.name }}</b>
                  <small class="block text-[11.5px] text-muted">{{ h.siloName }}@if (h.match) { · matches {{ h.match }} }</small></span>
                <span [class]="cls(h)">{{ h.stockStatus }}</span>
              </a>
            </li>
          } @empty {
            <li class="px-4 py-4 text-[14px] text-muted">No grade found for "{{ q() }}". Contact us: we may stock it under another name.</li>
          }
        </ul>
      }
    </div>`,
})
export class SearchBoxComponent {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly placeholder = input('Search 93 grades: EN24, SS 316, 4340, brass hex…');
  readonly dark = input(false);

  protected readonly q = signal('');
  protected readonly hits = signal<SearchHit[]>([]);
  protected readonly open = signal(false);
  protected readonly active = signal(0);
  private readonly input$ = new Subject<string>();

  constructor() {
    const sub = this.input$.pipe(debounceTime(160), distinctUntilChanged(), switchMap((q) => this.catalog.search(q, 8)))
      .subscribe((h) => { this.hits.set(h); this.active.set(0); });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  protected cls(h: SearchHit): string { return stockClass(h.stockStatus); }

  protected onInput(v: string): void {
    this.q.set(v.trim());
    this.open.set(true);
    if (v.trim().length >= 2) this.input$.next(v.trim());
    else this.hits.set([]);
  }

  protected key(e: KeyboardEvent): void {
    const n = this.hits().length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); this.active.set((this.active() + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); this.active.set((this.active() - 1 + n) % n); }
    else if (e.key === 'Enter' && n) { e.preventDefault(); this.router.navigateByUrl(this.hits()[this.active()].path); this.close(); }
    else if (e.key === 'Escape') this.close();
  }

  protected close(): void { this.open.set(false); }

  protected outside(e: Event): void {
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
