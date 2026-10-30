import { absUrl } from './api.config';
import { MediaItem } from './models/media.model';

/** A photo's file at roughly the width wanted (falls back to the largest), as a full URL. */
export function thumbUrl(m: MediaItem, want = 480): string {
  const widths = Object.keys(m.variants).map(Number).sort((a, b) => a - b);
  const pick = widths.find((w) => w >= want) ?? widths[widths.length - 1];
  return absUrl(pick ? m.variants[pick] : m.url);
}

/** The original file (a video, or a photo's largest size) as a full URL. */
export function fileUrl(m: MediaItem): string {
  return absUrl(m.url);
}
