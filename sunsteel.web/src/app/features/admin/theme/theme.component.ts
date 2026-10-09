import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiError } from '../../../core/models/api.model';
import { DEFAULT_THEME, THEME_PRESETS, Theme, contrast, isHex } from '../../../core/models/site.model';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { SiteService } from '../../../core/services/site.service';
import { BrandComponent } from '../../../shared/brand.component';

type Key = keyof Theme;

/**
 * Edits the three theme colours with a live preview. Changes apply to this browser
 * immediately (so the preview and the admin chrome update); Save publishes them for every
 * visitor. Leaving without saving restores the published colours.
 */
@Component({
  selector: 'ss-theme',
  imports: [FormsModule, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme.component.html',
})
export class ThemeComponent {
  private readonly api = inject(AdminApiService);
  private readonly site = inject(SiteService);

  protected readonly presets = THEME_PRESETS;
  protected readonly fields: { key: Key; label: string; hint: string }[] = [
    { key: 'primary', label: 'Primary', hint: 'Header over images, dark sections, text' },
    { key: 'accent', label: 'Accent', hint: 'Fine lines, highlights and call-to-action details' },
    { key: 'surface', label: 'Surface', hint: 'Page background' },
  ];

  private readonly published = signal<Theme>(this.site.theme());
  protected readonly draft = signal<Theme>({ ...this.site.theme() });
  protected readonly saving = signal(false);
  protected readonly message = signal<{ ok: boolean; text: string } | null>(null);

  protected readonly dirty = computed(() => {
    const a = this.draft(), b = this.published();
    return a.primary !== b.primary || a.accent !== b.accent || a.surface !== b.surface;
  });
  protected readonly textContrast = computed(() => contrast(this.draft().primary, this.draft().surface));
  protected readonly accentContrast = computed(() => contrast(this.draft().accent, this.draft().primary));

  constructor() {
    // Unsaved changes must not leak onto the public site in this tab.
    inject(DestroyRef).onDestroy(() => this.site.applyTheme(this.published()));
  }

  protected set(key: Key, value: string): void {
    if (!isHex(value)) return;
    this.draft.update((t) => ({ ...t, [key]: value.toUpperCase() }));
    this.site.applyTheme(this.draft());
    this.message.set(null);
  }

  protected usePreset(p: Theme): void {
    this.draft.set({ primary: p.primary, accent: p.accent, surface: p.surface });
    this.site.applyTheme(this.draft());
    this.message.set(null);
  }

  protected isPreset(p: Theme): boolean {
    const d = this.draft();
    return p.primary === d.primary && p.accent === d.accent && p.surface === d.surface;
  }

  protected resetDefault(): void {
    this.usePreset(DEFAULT_THEME);
  }

  protected discard(): void {
    this.draft.set({ ...this.published() });
    this.site.applyTheme(this.published());
  }

  protected save(): void {
    this.saving.set(true);
    this.api.saveTheme(this.draft()).subscribe({
      next: (t) => {
        this.published.set(t);
        this.draft.set({ ...t });
        this.site.applyTheme(t);
        this.saving.set(false);
        this.message.set({ ok: true, text: 'Saved. The website now uses these colours.' });
      },
      error: (e) => {
        this.saving.set(false);
        this.message.set({ ok: false, text: apiError(e) });
      },
    });
  }
}

