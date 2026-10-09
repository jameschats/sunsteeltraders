/** Minimal typing for Google Identity Services (https://accounts.google.com/gsi/client). */
interface GoogleIdApi {
  initialize(opts: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: 'popup' }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

let loading: Promise<void> | null = null;

/** Loads the GIS script once. Resolves when window.google is ready. */
export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('Google sign-in could not load.'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export function renderGoogleButton(el: HTMLElement, clientId: string, onCredential: (idToken: string) => void): void {
  const id = window.google!.accounts.id;
  id.initialize({ client_id: clientId, callback: (r) => onCredential(r.credential), ux_mode: 'popup' });
  id.renderButton(el, { theme: 'outline', size: 'large', width: el.clientWidth || 380, text: 'continue_with', shape: 'rectangular' });
}
