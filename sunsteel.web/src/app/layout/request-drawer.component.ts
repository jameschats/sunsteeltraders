import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestService } from '../core/services/request.service';
import { formatKg } from '../core/weight/weight';
import { IconComponent } from '../shared/icon.component';

/** Slide-in "Your request" basket, opened from the header or after "Add to my request". */
@Component({
  selector: 'ss-request-drawer',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'req.open.set(false)' },
  template: `
    <div class="fixed inset-0 z-[70] bg-primary/40 backdrop-blur-[2px] transition-opacity duration-500"
         [class]="req.open() ? 'opacity-100' : 'pointer-events-none opacity-0'" (click)="req.open.set(false)" aria-hidden="true"></div>
    <aside class="fixed inset-y-0 right-0 z-[71] flex w-[min(440px,100vw)] flex-col bg-surface pb-[env(safe-area-inset-bottom)] shadow-[-30px_0_60px_-30px_rgba(30,36,48,.4)] transition-transform duration-500 ease-lux"
           [class]="req.open() ? 'translate-x-0' : 'invisible translate-x-full !shadow-none'" role="dialog" aria-modal="true" aria-label="Your request" [attr.aria-hidden]="!req.open()">
      <div class="flex items-center justify-between border-b border-line px-6 py-5">
        <div><span class="label">Your request</span><b class="font-serif text-[26px] font-medium">{{ req.count() }} {{ req.count() === 1 ? 'item' : 'items' }}</b></div>
        <button type="button" class="p-2" aria-label="Close" (click)="req.open.set(false)"><ss-icon name="x" [size]="22" /></button>
      </div>
      <div class="flex-1 overflow-y-auto px-6">
        @for (l of req.lines(); track l.id) {
          <div class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-line py-4">
            <b class="font-serif text-[18px] font-medium leading-snug">{{ l.gradeText }}</b>
            <button type="button" class="self-start p-1 text-faint hover:text-ink" (click)="req.remove(l.id)" [attr.aria-label]="'Remove ' + l.gradeText"><ss-icon name="trash" [size]="16" /></button>
            <span class="text-[13px] text-muted"><span class="capitalize">{{ l.form }}</span> {{ l.dimText }} × {{ l.lengthMm }} mm</span>
            <span class="text-right text-[13px] tabular-nums">{{ kg(l.kg) }} kg</span>
            <div class="col-span-2 mt-1 flex items-center gap-3">
              <button type="button" class="chip !h-8 !w-8 !justify-center !p-0" aria-label="One fewer" (click)="step(l.id, l.quantity, l.kg, -1)"><ss-icon name="minus" [size]="14" /></button>
              <span class="w-14 text-center text-[14px] tabular-nums">{{ l.quantity }} pcs</span>
              <button type="button" class="chip !h-8 !w-8 !justify-center !p-0" aria-label="One more" (click)="step(l.id, l.quantity, l.kg, 1)"><ss-icon name="plus" [size]="14" /></button>
            </div>
          </div>
        } @empty {
          <div class="py-16 text-center">
            <p class="font-serif text-[24px]">Nothing here yet.</p>
            <p class="mt-2 text-[14px] text-muted">Weigh a piece on any product page, or simply tell the concierge what you need.</p>
          </div>
        }
      </div>
      <div class="grid gap-3 border-t border-line px-6 py-5">
        @if (req.count()) {
          <div class="flex items-baseline justify-between"><span class="label">Estimated total</span><b class="font-serif text-[30px] font-medium tabular-nums">{{ kg(req.totalKg()) }} <small class="text-[14px] text-muted">kg</small></b></div>
        }
        <a routerLink="/contact-us/" class="btn w-full" (click)="req.open.set(false)">{{ req.count() ? 'Send to the concierge' : 'Speak to the concierge' }} <ss-icon name="arrow" [size]="16" /></a>
      </div>
    </aside>`,
})
export class RequestDrawerComponent {
  protected readonly req = inject(RequestService);

  protected kg(n: number): string { return formatKg(n); }

  protected step(id: string, qty: number, kg: number, delta: number): void {
    const next = Math.max(1, qty + delta);
    this.req.update(id, { quantity: next, kg: qty > 0 ? (kg / qty) * next : kg });
  }
}
