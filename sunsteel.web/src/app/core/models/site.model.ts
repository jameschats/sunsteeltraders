export interface Theme {
  primary: string;
  accent: string;
  surface: string;
}

export interface SiteData {
  settings: Record<string, string | null>;
  theme: Theme;
}

export interface FontPairing { id: string; name: string; heading: string; body: string }

/** Self-hosted (bundled) fonts; the first pairing is the original design. */
export const FONT_PAIRINGS: FontPairing[] = [
  { id: 'classic', name: 'Classic Luxe', heading: 'Cormorant Garamond', body: 'Manrope' },
  { id: 'warm', name: 'Warm Hospitality', heading: 'Lora', body: 'Nunito Sans' },
  { id: 'modern', name: 'Modern Elegance', heading: 'Marcellus', body: 'Manrope' },
  { id: 'bold', name: 'Bold Statement', heading: 'DM Serif Display', body: 'DM Sans' },
  { id: 'editorial', name: 'Refined Editorial', heading: 'EB Garamond', body: 'Inter' },
  { id: 'clean', name: 'Clean Contemporary', heading: 'Montserrat', body: 'Open Sans' },
];

export const FONT_SIZES = [
  { value: '15', label: 'Small (15px)' },
  { value: '16', label: 'Default (16px)' },
  { value: '17', label: 'Large (17px)' },
  { value: '18', label: 'Extra large (18px)' },
];

export const DEFAULT_THEME: Theme = { primary: '#1E2430', accent: '#9C6B3C', surface: '#FAF6EF' };

/** Used until /api/site answers, and if it never does, so the site still renders. */
export const DEFAULT_SETTINGS: Record<string, string> = {
  BusinessName: 'Sun Steel Traders',
  FontPairing: 'classic',
  FontSize: '16',
  FaviconBackground: '#FFFFFF',
  LocationLine: 'Madurai',
  Tagline: 'Multi-metal stockist',
  Phone1: '+91 98421 50479',
  Phone2: '+91 98428 50479',
  Landline: '0452 235 0479',
  WhatsAppNumber: '919842150479',
  WhatsAppMessage: 'Hello Sun Steel Traders, I would like a price and availability check.',
  SalesEmail: 'managersunsteeltraders@gmail.com',
  Address: '57, Tamil Sangam Road, near Bell Hotel, Simmakkal, Madurai 625001, Tamil Nadu',
  MapUrl: 'https://maps.google.com/?q=Sun+Steel+Traders+Simmakkal+Madurai',
  OpeningHours: 'Mon–Sat · 09:00–19:30',
  IsoCertificate: 'ISO 9001:2015',
};

/** v3 "Metal atelier" first; the rest keep the same ink / metal / paper logic. */
export const THEME_PRESETS: (Theme & { name: string })[] = [
  { name: 'Ink navy & bronze (v3)', primary: '#1E2430', accent: '#9C6B3C', surface: '#FAF6EF' },
  { name: 'Graphite & sun amber', primary: '#15171B', accent: '#D99A3E', surface: '#F4F3EF' },
  { name: 'Gunmetal & brass', primary: '#22282B', accent: '#B08D4A', surface: '#F7F5F0' },
  { name: 'Oxide & copper', primary: '#2A1F1C', accent: '#B5683F', surface: '#FAF7F3' },
];

/** WCAG 2.1 contrast ratio. Mirrors SiteService.Contrast on the API. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = hex.replace('#', '').match(/../g)!.map((x) => {
      const v = parseInt(x, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
