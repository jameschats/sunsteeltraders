import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { absUrl } from '../core/api.config';
import { MediaItem } from '../core/models/media.model';

/**
 * A photograph that fills its container (give the host a size or aspect ratio): a responsive WebP
 * `srcset` over a blurred placeholder that shows instantly. Plain <img>, so it is visible without
 * JavaScript and while the page hydrates. `priority` is for the first image on a page (LCP).
 */
@Component({
  selector: 'ss-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden bg-primary' },
  styles: `@layer base { :host { position: relative; } }`,
  template: `
    @if (media(); as m) {
      @if (m.placeholder) {
        <span class="absolute inset-0 scale-110 bg-cover bg-center blur-xl" [style.background-image]="'url(' + m.placeholder + ')'" aria-hidden="true"></span>
      }
      <img class="absolute inset-0 h-full w-full" [class]="fit() === 'contain' ? 'object-contain' : 'object-cover'"
           [src]="src()" [attr.srcset]="srcset()" [attr.sizes]="srcset() ? sizes() : null"
           [attr.width]="m.width" [attr.height]="m.height" [alt]="alt() || m.altText || ''"
           [attr.loading]="priority() ? 'eager' : 'lazy'" [attr.fetchpriority]="priority() ? 'high' : null" decoding="async" />
    }`,
})
export class ImageComponent {
  readonly media = input<MediaItem | null | undefined>(null);
  readonly alt = input('');
  /** The CSS `sizes` hint: how wide the image renders, so the browser picks the right file. */
  readonly sizes = input('100vw');
  readonly priority = input(false);
  readonly fit = input<'cover' | 'contain'>('cover');

  protected readonly srcset = computed(() => {
    const v = this.media()?.variants ?? {};
    const entries = Object.entries(v).sort((a, b) => +a[0] - +b[0]);
    return entries.length > 1 ? entries.map(([w, u]) => `${absUrl(u)} ${w}w`).join(', ') : null;
  });

  /** A mid-size file as the fallback `src`, for browsers that ignore srcset. */
  protected readonly src = computed(() => {
    const m = this.media();
    if (!m) return '';
    const widths = Object.keys(m.variants).map(Number).sort((a, b) => a - b);
    const pick = widths.find((w) => w >= 960) ?? widths[widths.length - 1];
    return absUrl(pick ? m.variants[pick] : m.url);
  });
}
