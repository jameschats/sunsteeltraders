import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiError } from '../../../core/models/api.model';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { SiteService } from '../../../core/services/site.service';

interface Field {
  key: string;
  label: string;
  hint?: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea';
  wide?: boolean;
}

interface Group {
  title: string;
  fields: Field[];
}

@Component({
  selector: 'ss-settings',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6">
      <h1 class="text-[22px] font-medium">Site settings</h1>
      <p class="mt-0.5 text-[13.5px] text-[#6B7485]">Shown in the header, footer, enquiry forms and WhatsApp buttons.</p>
    </header>

    @if (loading()) {
      <div class="card text-[#6B7485]">Loading settings…</div>
    } @else {
      <form class="grid gap-5" (ngSubmit)="save()">
        @for (g of groups; track g.title) {
          <fieldset class="card">
            <legend class="sr-only">{{ g.title }}</legend>
            <b class="mb-4 block font-medium">{{ g.title }}</b>
            <div class="grid gap-4 md:grid-cols-2">
              @for (f of g.fields; track f.key) {
                <label class="alabel" [class.md:col-span-2]="f.wide || f.type === 'textarea'">{{ f.label }}
                  @if (f.type === 'textarea') {
                    <textarea class="ainput" [name]="f.key" [(ngModel)]="values[f.key]"></textarea>
                  } @else {
                    <input class="ainput" [type]="f.type ?? 'text'" [name]="f.key" [(ngModel)]="values[f.key]" />
                  }
                  @if (f.hint) { <span class="ahint">{{ f.hint }}</span> }
                </label>
              }
            </div>
          </fieldset>
        }
        @if (message(); as m) { <p class="alert" [class.alert-ok]="m.ok" role="status">{{ m.text }}</p> }
        <div class="flex justify-end"><button class="abtn abtn-pri" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save settings' }}</button></div>
      </form>
    }`,
})
export class SettingsComponent {
  private readonly api = inject(AdminApiService);
  private readonly site = inject(SiteService);

  protected values: Record<string, string | null> = {};
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal<{ ok: boolean; text: string } | null>(null);

  protected readonly groups: Group[] = [
    {
      title: 'Identity',
      fields: [
        { key: 'BusinessName', label: 'Business name', hint: 'Shown in the logo lockup.' },
        { key: 'Tagline', label: 'Tagline', hint: 'e.g. Multi-metal stockist.' },
        { key: 'LocationLine', label: 'Location line', hint: 'Small line under the name.' },
      ],
    },
    {
      title: 'Favicon (browser tab icon)',
      fields: [
        { key: 'FaviconBackground', label: 'Background colour', hint: 'Hex, e.g. #FFFFFF (white) or #1E2430 (dark navy). The sun logo is drawn on it.' },
        { key: 'FaviconUrl', label: 'Custom favicon image URL (optional)', type: 'url', hint: 'PNG/SVG/ICO link. Leave empty to use the logo on the background colour.' },
      ],
    },
    {
      title: 'Contact',
      fields: [
        { key: 'Phone1', label: 'Primary phone', type: 'tel' },
        { key: 'Phone2', label: 'Second phone', type: 'tel' },
        { key: 'Landline', label: 'Landline', type: 'tel' },
        { key: 'WhatsAppNumber', label: 'WhatsApp number', hint: 'Digits only, with country code, e.g. 919842150479. RFQs open WhatsApp to this number.' },
        { key: 'WhatsAppMessage', label: 'Default WhatsApp message' },
        { key: 'SalesEmail', label: 'Sales email', type: 'email' },
        { key: 'OpeningHours', label: 'Opening hours', hint: 'e.g. Mon–Sat · 09:00–19:30' },
        { key: 'Address', label: 'Address', type: 'textarea' },
        { key: 'MapUrl', label: 'Google Maps link', type: 'url', wide: true },
      ],
    },
    {
      title: 'Business registration',
      fields: [
        { key: 'Gstin', label: 'GSTIN', hint: 'Shown in the footer and structured data once set.' },
        { key: 'Udyam', label: 'Udyam registration' },
        { key: 'IsoCertificate', label: 'ISO certificate' },
        { key: 'FoundedYear', label: 'Year founded' },
      ],
    },
    {
      title: 'Social',
      fields: [
        { key: 'FacebookUrl', label: 'Facebook', type: 'url' },
        { key: 'InstagramUrl', label: 'Instagram', type: 'url' },
        { key: 'YouTubeUrl', label: 'YouTube', type: 'url' },
        { key: 'LinkedInUrl', label: 'LinkedIn', type: 'url' },
        { key: 'CatalogueUrl', label: 'Catalogue PDF link', type: 'url', hint: 'Shown after the catalogue download form.' },
      ],
    },
  ];

  constructor() {
    this.api.getSettings().subscribe({
      next: (s) => {
        this.values = { ...s };
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.message.set({ ok: false, text: apiError(e) });
      },
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.message.set(null);
    const keys = this.groups.flatMap((g) => g.fields.map((f) => f.key));
    const body = Object.fromEntries(keys.map((k) => [k, this.values[k] ?? null]));
    this.api.saveSettings(body).subscribe({
      next: (s) => {
        this.values = { ...s };
        this.site.patchSettings(s);
        this.saving.set(false);
        this.message.set({ ok: true, text: 'Settings saved. The website shows them now.' });
      },
      error: (e) => {
        this.saving.set(false);
        this.message.set({ ok: false, text: apiError(e) });
      },
    });
  }
}
