export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/** Pulls the friendliest message out of an HttpErrorResponse wrapping an ApiResponse. */
export function apiError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { status?: number; error?: { message?: string } };
  if (e?.status === 0) return 'Can’t reach the server. Check your connection and try again.';
  return e?.error?.message || fallback;
}
