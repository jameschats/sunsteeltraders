export interface ParsedLink {
  external: boolean;
  /** Router path (internal) or the full address (external). */
  path: string;
  fragment?: string;
}

/** Splits an admin-entered address: "/bookroom#reserve" -> path + fragment; "https://..." stays external. */
export function parseLink(url: string): ParsedLink {
  const u = (url || '/').trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return { external: true, path: u };
  const [path, fragment] = u.split('#');
  return { external: false, path: path.startsWith('/') ? path : '/' + path, fragment: fragment || undefined };
}
