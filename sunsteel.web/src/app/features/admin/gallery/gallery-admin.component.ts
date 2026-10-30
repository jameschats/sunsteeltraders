import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { thumbUrl } from '../../../core/media-url';
import { apiError } from '../../../core/models/api.model';
import { MediaItem } from '../../../core/models/media.model';
import { AdminApiService, GallerySettings } from '../../../core/services/admin-api.service';
import { IconComponent } from '../../../shared/icon.component';
import { MediaPickerComponent } from '../media/media-picker.component';

interface Row {
  id?: number;
  media: MediaItem;
  title: string;
  caption: string;
  linkUrl: string;
  visible: boolean;
}

/**
 * The sliding photo gallery on the home page (above the questions). Photos are chosen from the media library
 * (several at once), reordered, shown or hidden; each card can carry a title, a short description and a link.
 * The section's heading, on/off switch and scroll speed are edited here too.
 */
@Component({
  selector: 'ss-gallery-admin',
  imports: [FormsModule, IconComponent, MediaPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-[22px] font-medium">Gallery</h1>
        <p class="mt-0.5 text-[13.5px] text-[#6B7485]">The sliding photo strip on the home page. Add photos from the photograph library, put them in order with the arrows, and save.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        @if (dirty()) { <span class="pill pill-warn">Unsaved changes</span> }
        <a href="/" class="abtn"><ss-icon name="ext" [size]="15" />View site</a>
        <button type="button" class="abtn abtn-pri" [disabled]="saving() || loading() || !dirty()" (click)="save()">{{ saving() ? 'Saving…' : 'Save gallery' }}</button>
      </div>
    </header>

    @if (message(); as m) { <p class="alert mb-4" [class.alert-ok]="m.ok" role="status">{{ m.text }}</p> }

    @if (loading()) {
      <div class="card text-[#6B7485]">Loading…</div>
    } @else {
      <fieldset class="card mb-5">
        <legend class="sr-only">Gallery options</legend>
        <b class="mb-4 block font-medium">Section options</b>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="alabel md:col-span-2 !grid-flow-col !items-center !justify-start gap-3">
            <input type="checkbox" [checked]="settings().show" (change)="setShow($any($event.target).checked)" />
            <span>Show the gallery on the home page</span>
          </label>
          <label class="alabel">Small heading above<input class="ainput" maxlength="80" [ngModel]="settings().kicker" (ngModelChange)="setText('kicker', $event)" name="kicker" /></label>
          <label class="alabel">Heading<input class="ainput" maxlength="120" [ngModel]="settings().heading" (ngModelChange)="setText('heading', $event)" name="heading" /></label>
          <label class="alabel">Scroll speed ({{ settings().speed }})
            <input type="range" min="10" max="150" step="5" [ngModel]="settings().speed" (ngModelChange)="setSpeed($event)" name="speed" />
            <span class="ahint">Lower is slower. 50 is a calm default. On phones the photos are listed one under another.</span>
          </label>
        </div>
      </fieldset>

      <div class="mb-4"><button type="button" class="abtn abtn-pri" (click)="adding.set(true)"><ss-icon name="plus" [size]="15" />Add photos</button>
        <span class="ml-3 text-[13px] text-[#6B7485]">{{ rows().length }} photo{{ rows().length === 1 ? '' : 's' }} · {{ visibleCount() }} shown on the site</span></div>

      @if (!rows().length) {
        <div class="card text-center text-[#6B7485]">The gallery is empty, so it is hidden on the website. Add some photos to show it.</div>
      } @else {
        <ul class="m-0 grid list-none gap-3 p-0">
          @for (r of rows(); track $index; let i = $index) {
            <li class="card grid gap-4 !p-3 sm:grid-cols-[132px_1fr_auto]" [class.opacity-60]="!r.visible">
              <img class="aspect-[3/4] w-[132px] rounded-md object-cover" [src]="thumb(r.media)" [alt]="r.media.altText || r.media.fileName" />
              <div class="grid content-start gap-2.5">
                <label class="alabel">Title<input class="ainput" maxlength="120" [(ngModel)]="r.title" (ngModelChange)="touch()" [name]="'t' + i" placeholder="e.g. Band-saw cutting" /></label>
                <label class="alabel">Short description<input class="ainput" maxlength="300" [(ngModel)]="r.caption" (ngModelChange)="touch()" [name]="'c' + i" placeholder="One line under the title" /></label>
                <label class="alabel">Link (optional)<input class="ainput" maxlength="300" [(ngModel)]="r.linkUrl" (ngModelChange)="touch()" [name]="'l' + i" placeholder="/products/, /contact-us/ or https://…" /></label>
              </div>
              <div class="flex flex-row items-start gap-1.5 sm:flex-col">
                <button type="button" class="abtn abtn-sm" [disabled]="i === 0" (click)="move(i, -1)" aria-label="Move earlier"><ss-icon name="up" [size]="13" /></button>
                <button type="button" class="abtn abtn-sm" [disabled]="i === rows().length - 1" (click)="move(i, 1)" aria-label="Move later"><ss-icon name="down" [size]="13" /></button>
                <button type="button" class="abtn abtn-sm" (click)="toggle(i)" [attr.aria-pressed]="r.visible" [title]="r.visible ? 'Shown on the website' : 'Hidden'">{{ r.visible ? 'Shown' : 'Hidden' }}</button>
                <button type="button" class="abtn abtn-sm abtn-danger" (click)="remove(i)" aria-label="Remove"><ss-icon name="trash" [size]="13" /></button>
              </div>
            </li>
          }
        </ul>
      }

      <div class="mt-6 flex justify-end">
        <button type="button" class="abtn abtn-pri" [disabled]="saving() || !dirty()" (click)="save()">{{ saving() ? 'Saving…' : 'Save gallery' }}</button>
      </div>
    }

    @if (adding()) {
      <ss-media-picker kind="image" title="Add photos: tick as many as you like" [multi]="true" (pickedMany)="addMany($event)" (closed)="adding.set(false)" />
    }`,
})
export class GalleryAdminComponent {
  private readonly api = inject(AdminApiService);

  protected readonly rows = signal<Row[]>([]);
  protected readonly settings = signal<GallerySettings>({ show: true, kicker: '', heading: '', speed: 50 });
  protected readonly dirty = signal(false);
  protected readonly visibleCount = computed(() => this.rows().filter((r) => r.visible).length);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly adding = signal(false);
  protected readonly message = signal<{ ok: boolean; text: string } | null>(null);

  constructor() {
    this.api.gallery().subscribe({
      next: (g) => { this.apply(g.settings, g.items); this.loading.set(false); },
      error: (e) => { this.loading.set(false); this.message.set({ ok: false, text: apiError(e) }); },
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onUnload(e: BeforeUnloadEvent): void {
    if (this.dirty()) e.preventDefault();
  }

  private apply(s: GallerySettings, items: { id: number; media: MediaItem | null; title: string | null; caption: string | null; linkUrl: string | null; visible: boolean }[]): void {
    this.settings.set(s);
    this.rows.set(items.filter((i) => i.media).map((i) => ({
      id: i.id, media: i.media!, title: i.title ?? '', caption: i.caption ?? '', linkUrl: i.linkUrl ?? '', visible: i.visible,
    })));
    this.dirty.set(false);
  }

  protected touch(): void {
    this.dirty.set(true);
    this.message.set(null);
  }

  protected setShow(v: boolean): void { this.settings.update((s) => ({ ...s, show: v })); this.touch(); }
  protected setSpeed(v: number): void { this.settings.update((s) => ({ ...s, speed: Number(v) })); this.touch(); }
  protected setText(k: 'kicker' | 'heading', v: string): void { this.settings.update((s) => ({ ...s, [k]: v })); this.touch(); }

  private mutate(fn: (rows: Row[]) => Row[]): void {
    this.rows.update(fn);
    this.touch();
  }

  protected addMany(items: MediaItem[]): void {
    this.adding.set(false);
    this.mutate((rows) => [...rows, ...items.map((m): Row => ({ media: m, title: '', caption: '', linkUrl: '', visible: true }))]);
  }

  protected move(i: number, d: -1 | 1): void {
    this.mutate((rows) => {
      const j = i + d;
      if (j < 0 || j >= rows.length) return rows;
      const c = [...rows];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  }

  protected toggle(i: number): void {
    this.mutate((rows) => rows.map((r, k) => (k === i ? { ...r, visible: !r.visible } : r)));
  }

  protected remove(i: number): void {
    this.mutate((rows) => rows.filter((_, k) => k !== i));
  }

  protected save(): void {
    this.saving.set(true);
    this.message.set(null);
    this.api.saveGallery(this.settings(), this.rows().map((r) => ({
      id: r.id, mediaId: r.media.id, title: r.title, caption: r.caption, linkUrl: r.linkUrl, visible: r.visible,
    }))).subscribe({
      next: (g) => {
        this.apply(g.settings, g.items);
        this.saving.set(false);
        this.message.set({ ok: true, text: 'Saved. The website shows the gallery now.' });
      },
      error: (e) => { this.saving.set(false); this.message.set({ ok: false, text: apiError(e) }); },
    });
  }

  protected thumb(m: MediaItem): string {
    return thumbUrl(m, 480);
  }
}
