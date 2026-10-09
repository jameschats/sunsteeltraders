import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Faq } from '../core/models/catalog.model';

/** Questions as native disclosure widgets: accessible, no script, crawlable when closed. */
@Component({
  selector: 'ss-faq-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-t border-ink">
      @for (f of faqs(); track f.question) {
        <details class="group border-b border-line">
          <summary class="flex list-none items-start justify-between gap-6 py-5 font-serif text-[21px] font-medium leading-snug [&::-webkit-details-marker]:hidden">
            {{ f.question }}
            <span class="mt-1 text-accent transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p class="max-w-[68ch] pb-6 text-muted">{{ f.answer }}</p>
        </details>
      }
    </div>`,
})
export class FaqListComponent {
  readonly faqs = input<Faq[]>([]);
}
