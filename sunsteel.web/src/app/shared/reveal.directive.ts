import { Directive, ElementRef, PLATFORM_ID, afterNextRender, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Slow fade-up as a section enters the viewport (v3 motion). Server HTML is fully visible;
 * the effect is added only in the browser, and skipped for reduced-motion users.
 */
@Directive({ selector: '[ssReveal]' })
export class RevealDirective {
  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight) return; // already on screen: never hide it
      el.classList.add('reveal');
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
      }, { rootMargin: '0px 0px -10% 0px' });
      io.observe(el);
    });
  }
}
