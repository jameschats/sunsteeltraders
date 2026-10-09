import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Interior page opening: breadcrumb, small label, serif headline (HTML allowed for <em>), lede. */
@Component({
  selector: 'ss-page-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="wrap pb-[clamp(36px,5vw,64px)] pt-[clamp(120px,14vw,168px)]">
      @if (crumbs().length) {
        <nav aria-label="Breadcrumb" class="mb-8 flex flex-wrap items-center gap-2 text-[12px] text-faint">
          @for (c of crumbs(); track c[1]; let last = $last) {
            @if (!last) { <a [routerLink]="c[0]" class="hover:text-ink">{{ c[1] }}</a><span aria-hidden="true">/</span> }
            @else { <span aria-current="page" class="text-muted">{{ c[1] }}</span> }
          }
        </nav>
      }
      <span class="label label-accent mb-4">{{ label() }}</span>
      <h1 class="h-xxl max-w-[18ch]" [innerHTML]="title()"></h1>
      @if (lede()) { <p class="lede mt-6">{{ lede() }}</p> }
      <ng-content />
    </header>`,
})
export class PageHeaderComponent {
  readonly label = input('');
  readonly title = input.required<string>();
  readonly lede = input<string | null | undefined>('');
  readonly crumbs = input<[string, string][]>([]);
}
