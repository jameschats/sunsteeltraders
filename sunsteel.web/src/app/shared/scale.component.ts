import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../core/services/catalog.service';
import { RequestService } from '../core/services/request.service';
import { CALC_FORMS, DEFAULT_LENGTH, DIMS, Dims, FORMULA_TEXT, FORM_NAMES, Form, dimText, formatKg, pieceKg, validate } from '../core/weight/weight';
import { IconComponent } from './icon.component';
import { XsectionComponent } from './xsection.component';

/** What a product page passes in to lock the calculator to that grade. */
export interface ScaleProduct {
  slug: string;
  name: string;
  grade: string;
  materialKey?: string | null;
  forms: Form[];
}

/**
 * "The scale": the weight calculator as a calm navy instrument panel (v3 sheet 04).
 * Used on its own page and inside every product dossier. Results update as you type and
 * "Add to my request" drops the line into the concierge basket.
 */
@Component({
  selector: 'ss-scale',
  imports: [FormsModule, IconComponent, XsectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="on-dark grid gap-10 bg-primary p-[clamp(22px,4vw,48px)] text-on-primary lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] lg:items-center">
      <div class="grid content-start gap-6">
        <div>
          <span class="label mb-3">Shape</span>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Shape">
            @for (f of forms(); track f) {
              <button type="button" role="radio" [attr.aria-checked]="form() === f" (click)="setForm(f)"
                class="chip !text-on-primary" [class]="form() === f ? '!border-gold-light !bg-gold-light/15' : '!border-white/20'">{{ formName(f) }}</button>
            }
          </div>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          @if (!product()) {
            <label class="fld sm:col-span-2"><span>Material</span>
              <select [ngModel]="materialKey()" (ngModelChange)="materialKey.set($event)" name="mat">
                @for (m of catalog.index().materials; track m.key) { <option [value]="m.key">{{ m.name }} · {{ m.density }} g/cm³</option> }
              </select>
            </label>
          } @else {
            <div class="fld sm:col-span-2"><span>Material</span>
              <p class="border-b border-white/25 py-2 text-[16px]">{{ product()!.grade }} · {{ density() }} g/cm³</p>
            </div>
          }

          @if (form() === 'beam' || form() === 'channel') {
            <label class="fld"><span>Section (IS 808)</span>
              <select [ngModel]="section()" (ngModelChange)="section.set($event)" name="sec">
                @for (s of sections(); track s.designation) { <option [value]="s.designation">{{ s.designation }} · {{ s.kgPerMetre }} kg/m</option> }
              </select>
            </label>
          } @else {
            @for (f of fields(); track f[0]) {
              <label class="fld"><span>{{ f[1] }} (mm)</span>
                <input type="number" inputmode="decimal" min="0" step="any" [ngModel]="dims()[f[0]]" (ngModelChange)="setDim(f[0], $event)" [name]="'d' + f[0]" />
              </label>
            }
          }
          <label class="fld"><span>{{ form() === 'plate' ? 'Length (mm)' : 'Cut length (mm)' }}</span>
            <input type="number" inputmode="decimal" min="0" step="any" [ngModel]="length()" (ngModelChange)="length.set(+$event)" name="len" />
          </label>
          <label class="fld"><span>Pieces</span>
            <input type="number" inputmode="numeric" min="1" step="1" [ngModel]="qty()" (ngModelChange)="qty.set(+$event)" name="qty" />
          </label>
        </div>
        @if (problem()) { <p class="text-[13px] text-[#F2B8A8]" role="alert">{{ problem() }}</p> }
      </div>

      <div class="grid justify-items-center gap-2 text-center">
        <ss-xsection class="aspect-[200/125] w-full max-w-[300px]" [form]="form()" [dims]="dims()" [section]="section()" />
        <output class="mt-2 block font-serif text-[clamp(56px,7vw,84px)] font-medium leading-none" aria-live="polite">
          {{ total() > 0 ? fmt(total()) : '—' }} <em class="text-[0.36em] not-italic text-gold-light">kg</em>
        </output>
        <span class="label">{{ fmt(each()) }} kg each · {{ fmt(perMetre()) }} kg / m</span>
        <div class="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" class="btn" [disabled]="!(total() > 0)" (click)="add()">
            @if (added()) { <ss-icon name="check" [size]="16" />Added } @else { Add to my request }
          </button>
          @if (added()) { <button type="button" class="btn btn-ghost" (click)="requests.open.set(true)">View request · {{ requests.count() }}</button> }
        </div>
      </div>
    </div>
    <p class="mt-4 text-[12.5px] text-muted">{{ formula() }} · ρ = {{ density() }} g/cm³ · rounded to 0.1 kg. Theoretical weight; actual mill weight can vary by ±2–3%.</p>`,
})
export class ScaleComponent {
  protected readonly catalog = inject(CatalogService);
  protected readonly requests = inject(RequestService);

  readonly product = input<ScaleProduct | null>(null);
  /** Starting values, e.g. from a size-chart row ("Use in calculator"). */
  readonly preset = input<{ form: Form; dims: Dims; section?: string } | null>(null);

  protected readonly form = signal<Form>('round');
  protected readonly materialKey = signal('alloy');
  protected readonly dims = signal<Dims>({ D: 80 });
  protected readonly section = signal<string | undefined>(undefined);
  protected readonly length = signal(500);
  protected readonly qty = signal(4);
  protected readonly added = signal(false);

  protected readonly forms = computed<Form[]>(() => {
    const p = this.product();
    const allowed = p ? p.forms.filter((f) => CALC_FORMS.includes(f)) : CALC_FORMS;
    return allowed.length ? allowed : CALC_FORMS;
  });
  protected readonly fields = computed(() => DIMS[this.form()] ?? []);
  protected readonly sections = computed(() => this.catalog.index().sections.filter((s) => s.kind === this.form()));
  protected readonly density = computed(() => this.catalog.density(this.product()?.materialKey ?? this.materialKey()));
  protected readonly sectionKgM = computed(() => this.catalog.index().sections.find((s) => s.designation === this.section())?.kgPerMetre ?? 0);
  protected readonly problem = computed(() => validate(this.form(), this.dims()));
  protected readonly each = computed(() => pieceKg(this.form(), this.dims(), this.length(), this.density(), this.sectionKgM()));
  protected readonly perMetre = computed(() => pieceKg(this.form(), this.dims(), 1000, this.density(), this.sectionKgM()));
  protected readonly total = computed(() => this.each() * Math.max(1, Math.floor(this.qty() || 1)));
  protected readonly formula = computed(() => FORMULA_TEXT[this.form()]);

  constructor() {
    // A product page starts on that product's first shape.
    effect(() => {
      const p = this.product();
      if (p) untracked(() => this.setForm(this.forms()[0]));
    });
    effect(() => {
      const pre = this.preset();
      if (!pre) return;
      untracked(() => {
        this.form.set(pre.form);
        this.dims.set({ ...pre.dims });
        this.section.set(pre.section);
        this.length.set(DEFAULT_LENGTH[pre.form] ?? 1000);
        this.qty.set(1);
      });
    });
  }

  protected formName(f: Form): string {
    return FORM_NAMES[f].replace(/ \(.*\)/, '');
  }

  protected fmt(n: number): string {
    return formatKg(n);
  }

  protected setForm(f: Form): void {
    this.form.set(f);
    const d: Dims = {};
    for (const [k, , def] of DIMS[f] ?? []) d[k] = def;
    this.dims.set(d);
    this.section.set(f === 'beam' ? 'ISMB 300' : f === 'channel' ? 'ISMC 200' : undefined);
    this.length.set(DEFAULT_LENGTH[f] ?? 500);
    this.added.set(false);
  }

  protected setDim(key: string, value: number | string): void {
    this.dims.set({ ...this.dims(), [key]: +value });
    this.added.set(false);
  }

  protected add(): void {
    const p = this.product();
    const mat = this.catalog.index().materials.find((m) => m.key === this.materialKey());
    this.requests.add({
      productSlug: p?.slug,
      gradeText: p ? (p.name.includes(p.grade) ? p.name : `${p.name} (${p.grade})`) : mat?.name ?? 'Steel',
      form: this.form(),
      dims: this.dims(),
      section: this.section(),
      dimText: dimText(this.form(), this.dims(), this.section()),
      lengthMm: this.length(),
      quantity: Math.max(1, Math.floor(this.qty() || 1)),
      cutToSize: true,
      kg: this.total(),
    });
    this.added.set(true);
  }
}
