import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteService } from '../core/services/site.service';
import { MarkComponent } from './icon.component';

/** Logo lockup: sun mark + serif name + small-caps place line. Text comes from site settings. */
@Component({
  selector: 'ss-brand',
  imports: [RouterLink, MarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [routerLink]="link()" class="flex items-center gap-3 leading-none" [attr.aria-label]="site.businessName() + ' home'">
      <ss-mark [size]="32" />
      <span>
        <span class="block font-serif text-[23px] font-semibold tracking-[.02em]">{{ site.businessName() }}</span>
        @if (showPlace()) {
          <small class="mt-[5px] block text-[8.5px] font-semibold uppercase tracking-[.32em] opacity-60">{{ site.get('LocationLine') }}<span class="hidden sm:inline"> · {{ site.get('Tagline') }}</span></small>
        }
      </span>
    </a>`,
})
export class BrandComponent {
  protected readonly site = inject(SiteService);
  readonly link = input('/');
  readonly showPlace = input(true);
}
