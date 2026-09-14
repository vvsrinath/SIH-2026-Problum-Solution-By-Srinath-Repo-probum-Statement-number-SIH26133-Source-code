/**
 * Fetch client for the Swasthya Sathi backend.
 *
 * Central responsibilities:
 *  - Reads the double-submit CSRF cookie and echoes it as X-CSRF-Token on every
 *    state-changing request (the server requires this).
 *  - Sends session cookie (`ssat`) automatically via credentials: 'include'.
 *  - Unwraps the `{ success, data }` envelope and throws typed errors so callers
 *    can distinguish loading / empty / offline / unauthorized / server-error.
 *  - Never fabricates success: a request either returns real data or throws.
 */

import { API_BASE_URL } from './backend';

export const CSRF_COOKIE = 'csrf';

export type ApiErrorKind =
  | 'network' // offline / backend unreachable
  | 'unauthorized' // 401 — session missing/expired
  | 'forbidden' // 403 — lacks permission (or CSRF failed)
  | 'not-found' // 404
  | 'conflict' // 409 — e.g. slot already booked
  | 'validation' // 422/400
  | 'unavailable' // 503 — integration down
  | 'server'; // 5xx

export interface ApiError extends Error {
  kind: ApiErrorKind;
  status: number;
  code: string;
  details?: unknown;
}

export function readCsrfCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(
    new RegExp('(^|; )' + CSRF_COOKIE + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[2]) : '';
}

function toApiError(status: number, body: any): ApiError {
  const code: string = body?.code ?? 'UNKNOWN';
  let kind: ApiErrorKind = 'server';
  if (status === 401) kind = 'unauthorized';
  else if (status === 403) kind = 'forbidden';
  else if (status === 404) kind = 'not-found';
  else if (status === 409) kind = 'conflict';
  else if (status === 400 || status === 422) kind = 'validation';
  else if (status === 503) kind = 'unavailable';
  else if (status >= 500) kind = 'server';
  const err = new Error(body?.message ?? `Request failed (${status})`) as ApiError;
  err.kind = kind;
  err.status = status;
  err.code = code;
  err.details = body?.details;
  return err;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Optional request idempotency key. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, idempotencyKey, signal } = opts;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  const csrf = readCsrfCookie();
  const isSafeMethod = method === 'GET';

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!isSafeMethod && csrf) headers['X-CSRF-Token'] = csrf;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    const err = new Error('Cannot reach the server. Check your connection.') as ApiError;
    err.kind = 'network';
    err.status = 0;
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  if (res.status === 204) return undefined as T;

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    throw toApiError(res.status, payload);
  }

  return (payload?.data ?? payload) as T;
}
