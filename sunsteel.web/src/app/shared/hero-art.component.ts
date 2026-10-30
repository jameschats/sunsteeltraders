import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Decorative hero illustration: bar-stock cross-sections (round, hex, tube, square, angle)
 * drifting around a rolling-mill ring, with a slow glint across the main bar. Pure SVG + CSS,
 * coloured from the theme tokens, still under prefers-reduced-motion.
 */
@Component({
  selector: 'ss-hero-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 500 500" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="ha-steel" cx="35%" cy="30%" r="80%">
          <stop offset="0" stop-color="#fff" stop-opacity=".85" /><stop offset=".35" stop-color="#c9ced6" stop-opacity=".55" />
          <stop offset="1" stop-color="#5b6370" stop-opacity=".55" />
        </radialGradient>
        <linearGradient id="ha-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f3dcae" stop-opacity=".9" /><stop offset="1" stop-color="#a97c3c" stop-opacity=".75" />
        </linearGradient>
        <linearGradient id="ha-glint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".5" stop-color="#fff" stop-opacity=".55" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <pattern id="ha-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="#fff" stroke-opacity=".16" stroke-width="1" /></pattern>
        <clipPath id="ha-bar"><circle cx="250" cy="250" r="96" /></clipPath>
      </defs>

      <g class="ring r1"><circle cx="250" cy="250" r="226" fill="none" stroke="var(--color-gold-light)" stroke-opacity=".45" stroke-width="1" stroke-dasharray="2 9" /></g>
      <g class="ring r2"><circle cx="250" cy="250" r="176" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1" stroke-dasharray="14 10" /></g>
      <path d="M250 14v472M14 250h472" stroke="#fff" stroke-opacity=".12" stroke-dasharray="6 4 1 4" />

      <!-- main round bar -->
      <g class="float f0">
        <circle cx="250" cy="250" r="96" fill="url(#ha-steel)" stroke="#fff" stroke-opacity=".7" stroke-width="1.5" />
        <circle cx="250" cy="250" r="96" fill="url(#ha-hatch)" />
        <circle cx="250" cy="250" r="62" fill="none" stroke="#fff" stroke-opacity=".25" />
        <g clip-path="url(#ha-bar)"><rect class="glint" x="130" y="140" width="70" height="220" fill="url(#ha-glint)" transform="skewX(-18)" /></g>
        <text x="250" y="246" text-anchor="middle" class="t big">EN24</text>
        <text x="250" y="266" text-anchor="middle" class="t">Ø 80 mm</text>
      </g>

      <!-- hex -->
      <g class="float f1">
        <polygon points="400,92 440,115 440,161 400,184 360,161 360,115" fill="url(#ha-brass)" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" />
        <polygon points="400,92 440,115 440,161 400,184 360,161 360,115" fill="url(#ha-hatch)" />
        <text x="400" y="212" text-anchor="middle" class="t">Brass hex</text>
      </g>

      <!-- tube -->
      <g class="float f2">
        <circle cx="96" cy="130" r="48" fill="url(#ha-steel)" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" />
        <circle cx="96" cy="130" r="28" fill="var(--color-primary)" fill-opacity=".85" stroke="#fff" stroke-opacity=".6" />
        <text x="96" y="198" text-anchor="middle" class="t">SS 316 tube</text>
      </g>

      <!-- square -->
      <g class="float f3">
        <rect x="352" y="334" width="76" height="76" fill="url(#ha-steel)" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" />
        <rect x="352" y="334" width="76" height="76" fill="url(#ha-hatch)" />
        <text x="390" y="436" text-anchor="middle" class="t">MS square</text>
      </g>

      <!-- angle -->
      <g class="float f4">
        <path d="M62 340h78v18H80v62H62z" fill="url(#ha-steel)" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" />
        <path d="M62 340h78v18H80v62H62z" fill="url(#ha-hatch)" />
        <text x="100" y="446" text-anchor="middle" class="t">MS angle</text>
      </g>
    </svg>`,
  styles: `
    :host { display: block; pointer-events: none; }
    svg { width: 100%; height: auto; display: block; overflow: visible; filter: drop-shadow(0 18px 30px rgba(0,0,0,.25)); }
    .t { font-family: var(--font-sans); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; fill: #fff; fill-opacity: .8; font-weight: 600; }
    .t.big { font-family: var(--font-serif); font-size: 26px; letter-spacing: .04em; text-transform: none; fill-opacity: 1; }
    .ring, .float { transform-box: fill-box; transform-origin: center; }
    .r1 { animation: ha-spin 90s linear infinite; }
    .r2 { animation: ha-spin 60s linear infinite reverse; }
    .float { animation: ha-float 8s ease-in-out infinite; }
    .f0 { animation-duration: 10s; }
    .f1 { animation-delay: -2s; animation-duration: 7s; }
    .f2 { animation-delay: -4s; animation-duration: 9s; }
    .f3 { animation-delay: -1s; animation-duration: 8.5s; }
    .f4 { animation-delay: -5s; animation-duration: 7.5s; }
    .glint { animation: ha-glint 6s ease-in-out infinite; }
    @keyframes ha-spin { to { transform: rotate(360deg); } }
    @keyframes ha-float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-12px) rotate(1.5deg); } }
    @keyframes ha-glint { 0%, 55% { transform: translateX(-20px) skewX(-18deg); opacity: 0; } 70% { opacity: 1; } 100% { transform: translateX(260px) skewX(-18deg); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .ring, .float, .glint { animation: none; } }
  `,
})
export class HeroArtComponent {}
