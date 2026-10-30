import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { MediaItem } from '../../../core/models/media.model';
import { IconComponent } from '../../../shared/icon.component';
import { MediaBrowserComponent } from './media-browser.component';

/** A modal "choose a photo / video" window, opened by the page editor. Escape or the backdrop closes it. */
@Component({
  selector: 'ss-media-picker',
  imports: [MediaBrowserComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" role="dialog" aria-modal="true" [attr.aria-label]="title()" (click)="closed.emit()">
      <div class="adm w-full max-w-[960px] rounded-xl p-5 shadow-2xl sm:p-6" style="min-height: 0" (click)="$event.stopPropagation()">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-[18px] font-medium">{{ title() }}</h2>
          <button type="button" class="abtn abtn-sm" (click)="closed.emit()" aria-label="Close"><ss-icon name="x" [size]="14" /></button>
        </div>
        <ss-media-browser mode="pick" [kind]="kind()" [multi]="multi()" (picked)="picked.emit($event)" (pickedMany)="pickedMany.emit($event)" />
      </div>
    </div>`,
})
export class MediaPickerComponent {
  readonly kind = input<'image' | 'video' | 'any'>('image');
  readonly title = input('Choose a photo');
  /** Let several photos be ticked and added together. */
  readonly multi = input(false);
  readonly picked = output<MediaItem>();
  readonly pickedMany = output<MediaItem[]>();
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }
}
