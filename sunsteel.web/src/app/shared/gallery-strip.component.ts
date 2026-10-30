import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GalleryCard } from '../core/models/media.model';
import { ImageComponent } from './image.component';
import { parseLink } from './link';

const CARD_PX = 300;           // card width, including the 24px of space after it
const LOOP_FILL_PX = 1800;     // each half of the loop is at least this wide, so a short list never shows a gap
const MOBILE_LIMIT = 6;

/**
 * A sliding strip of photo cards. On computers the row drifts right-to-left in a seamless loop and pauses
 * while the mouse is over it or a card has focus. On phones the same cards are listed one under another
 * (the first few, then a "show all" button). For visitors who prefer reduced motion the row stops moving and
 * can be scrolled sideways instead.
 *
 * The loop is two identical halves slid by exactly -50%, with the spacing built into each card (not a flex gap)
 * so the half-way point lines up to the pixel and there is no jump when it restarts.
 */
@Component({
  selector: 'ss-gallery-strip',
  imports: [ImageComponent, RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- computers and tablets: sliding row -->
    <div class="strip-viewport hidden overflow-hidden md:block" role="region" aria-label="Photo gallery">
      <ul class="strip-track m-0 flex w-max list-none p-0" [style.animation-duration]="duration() + 's'">
        @for (c of loop(); track $index) {
          <li class="flex-none pr-6" [style.width.px]="cardPx" [attr.aria-hidden]="c.copy === 1 ? 'true' : null">
            <ng-container *ngTemplateOutlet="card; context: { $implicit: c.item, sizes: '300px', ratio: 'aspect-[3/4]', hidden: c.copy === 1 }" />
          </li>
        }
      </ul>
    </div>

    <!-- phones: one card per row -->
    <ul class="m-0 grid list-none gap-9 p-0 md:hidden">
      @for (it of mobileItems(); track it.id) {
        <li><ng-container *ngTemplateOutlet="card; context: { $implicit: it, sizes: '100vw', ratio: 'aspect-[4/5]', hidden: false }" /></li>
      }
    </ul>
    @if (!showAll() && items().length > mobileLimit) {
      <div class="mt-8 text-center md:hidden">
        <button type="button" class="btn btn-ghost" (click)="showAll.set(true)">Show all photos ({{ items().length }})</button>
      </div>
    }

    <ng-template #card let-it let-sizes="sizes" let-ratio="ratio" let-hidden="hidden">
      @let l = it.linkUrl ? parse(it.linkUrl) : null;
      @if (l && l.external) {
        <a [href]="l.path" target="_blank" rel="noopener" class="group block" [attr.tabindex]="hidden ? -1 : null">
          <ng-container *ngTemplateOutlet="inner; context: { $implicit: it, sizes: sizes, ratio: ratio }" />
        </a>
      } @else if (l) {
        <a [routerLink]="l.path" [fragment]="l.fragment" class="group block" [attr.tabindex]="hidden ? -1 : null">
          <ng-container *ngTemplateOutlet="inner; context: { $implicit: it, sizes: sizes, ratio: ratio }" />
        </a>
      } @else {
        <div class="group block"><ng-container *ngTemplateOutlet="inner; context: { $implicit: it, sizes: sizes, ratio: ratio }" /></div>
      }
    </ng-template>

    <ng-template #inner let-it let-sizes="sizes" let-ratio="ratio">
      <ss-image class="w-full overflow-hidden" [class]="ratio" [media]="it.media" [alt]="it.title || ''" [sizes]="sizes" />
      @if (it.title || it.caption) {
        <span class="mt-4 block">
          @if (it.title) { <span class="block font-serif text-[clamp(20px,1.8vw,24px)] leading-tight">{{ it.title }}</span> }
          @if (it.caption) { <span class="mt-1 block text-[14px] leading-snug text-muted">{{ it.caption }}</span> }
        </span>
      }
    </ng-template>`,
  styles: `
    @keyframes ss-strip { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .strip-track { animation: ss-strip linear infinite; will-change: transform; }
    .strip-viewport:hover .strip-track, .strip-viewport:focus-within .strip-track { animation-play-state: paused; }
    @media (prefers-reduced-motion: reduce) {
      .strip-viewport { overflow-x: auto; scroll-snap-type: x proximity; }
      .strip-track { animation: none; }
      .strip-track li { scroll-snap-align: start; }
      .strip-track li[aria-hidden='true'] { display: none; }
    }`,
})
export class GalleryStripComponent {
  readonly items = input.required<GalleryCard[]>();
  /** Pixels per second on computers. */
  readonly speed = input(50);

  protected readonly cardPx = CARD_PX;
  protected readonly mobileLimit = MOBILE_LIMIT;
  protected readonly showAll = signal(false);
  protected readonly parse = parseLink;

  /** One "half" of the loop: the items repeated until it is wide enough to fill any screen. */
  private readonly half = computed(() => {
    const list = this.items();
    if (!list.length) return [];
    const repeats = Math.max(1, Math.ceil(LOOP_FILL_PX / (list.length * CARD_PX)));
    return Array.from({ length: list.length * repeats }, (_, i) => list[i % list.length]);
  });

  /** The two identical halves; the second is hidden from screen readers and the tab order. */
  protected readonly loop = computed(() => {
    const h = this.half();
    return [...h.map((item) => ({ item, copy: 0 })), ...h.map((item) => ({ item, copy: 1 }))];
  });

  protected readonly duration = computed(() => Math.max(10, Math.round((this.half().length * CARD_PX) / Math.max(10, this.speed()))));
  protected readonly mobileItems = computed(() => (this.showAll() ? this.items() : this.items().slice(0, MOBILE_LIMIT)));
}
