import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Thin-line icon set (24px grid, 1.25 stroke) shared by the site and admin. */
const PATHS: Record<string, string> = {
  bell: 'M4 18h16M5.5 18a6.5 6.5 0 0 1 13 0M12 9.5V8M10 7.5h4',
  wifi: 'M2.5 9a14 14 0 0 1 19 0M5.5 12.4a9.5 9.5 0 0 1 13 0M8.6 15.7a5 5 0 0 1 6.8 0M12 19.2v.01',
  snow: 'M12 2.5v19M4 7l16 10M4 17L20 7M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2',
  bolt: 'M13 2.5 5 13.5h6l-1 8 8-11h-6z',
  car: 'M4 16.5V12l2-5h12l2 5v4.5zM4 12h16M7 16.5V19M17 16.5V19M7.5 14.2h.01M16.5 14.2h.01',
  bed: 'M3 19V7M3 14h18v5M21 14a3.5 3.5 0 0 0-3.5-3.5H11V14M7 12.2a1.6 1.6 0 1 0 0-.01',
  shield: 'M12 3l7.5 3v6c0 4.8-3.3 8-7.5 9-4.2-1-7.5-4.2-7.5-9V6zM9 12l2 2 4-4',
  phone: 'M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.1A1.5 1.5 0 0 1 5 3.5z',
  wa: 'M20 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.4-4A8.4 8.4 0 1 1 20 11.6zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-.9-.9 1a4.6 4.6 0 0 1-2.6-2.6l1-.9-.9-2z',
  mail: 'M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5',
  pin: 'M12 21s7-6.3 7-11.5a7 7 0 0 0-14 0C5 14.7 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  dash: 'M4 4h7v8H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 14h7v6H4z',
  inbox: 'M3.5 13.5 6 5h12l2.5 8.5V19h-17zM3.5 13.5H9l1.2 2h3.6l1.2-2h5.5',
  image: 'M3.5 5h17v14h-17zM3.5 15.5l5-5 4 4 2.5-2.5 5.5 5.5M15.5 9.5h.01',
  palette: 'M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.6-.9 1.2-1.8-.5-1.1.2-2.2 1.4-2.2H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7.2 16.7 3.5 12 3.5zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-2.1 1.2L14.7 21h-4l-.4-2.4a7 7 0 0 1-2.1-1.2l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-2.4L4.3 9.9l2-3.4 1.9.7a7 7 0 0 1 2.1-1.2l.4-2.4h4l.4 2.4a7 7 0 0 1 2.1 1.2l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 2.4z',
  users: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 10a2.5 2.5 0 1 0 0-5M3 20a5.5 5.5 0 0 1 11 0M15.5 14.5A5 5 0 0 1 21 19.5',
  doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  ext: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  out: 'M15 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  key: 'M14.5 9.5a4 4 0 1 1-1.2-2.8M13.3 6.7 20 13.5l-2 2-1.5-1.5-1.5 1.5-1.5-1.5M7.5 12a1 1 0 1 0 0-.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l4.5 4.5',
  arrow: 'M4 12h15M14 6.5l5.5 5.5-5.5 5.5',
  upload: 'M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 15v4.5h15V15',
  scale: 'M12 4v16M6 20h12M4.5 8h15M4.5 8 2 14a3 3 0 0 0 5 0zM19.5 8 17 14a3 3 0 0 0 5 0zM12 4a1.2 1.2 0 1 0 0 .01',
  truck: 'M2.5 6h11v10h-11zM13.5 9.5h4l3 3.5V16h-7M6.5 18.5a1.8 1.8 0 1 0 0-.01M17 18.5a1.8 1.8 0 1 0 0-.01',
  check: 'M4.5 12.5l5 5 10-11',
  file: 'M6 3h8.5L19 7.5V21H6zM14 3v5h5',
  chev: 'M9 5.5l6.5 6.5L9 18.5',
  minus: 'M5 12h14',
  list: 'M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  box: 'M21 8 12 3 3 8v8l9 5 9-5zM3.3 7.5 12 12.5l8.7-5M12 12.5V21',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13',
  x: 'M5 5l14 14M19 5L5 19',
};

@Component({
  selector: 'ss-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="d()" /></svg>`,
  styles: `:host { display: inline-flex; flex: none; }`,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(20);
  protected readonly d = computed(() => PATHS[this.name()] ?? '');
}

/**
 * The Sun Steel mark: a rising sun over three bar ends (a rolled section seen end-on).
 * Drawn in the accent colour so it follows the theme.
 */
@Component({
  selector: 'ss-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
    <circle cx="20" cy="20" r="16.5" /><path d="M8.2 24.5a12 12 0 0 1 23.6 0z" fill="currentColor" stroke="none" />
    <path d="M3.5 24.5h33M7 29h26M11 33.2h18" /></svg>`,
  styles: `:host { display: inline-flex; color: var(--color-accent); }`,
})
export class MarkComponent {
  readonly size = input(30);
}
