/**
 * Connectivity service.
 *
 * navigator.onLine only reflects device link state — NOT whether the backend
 * is actually reachable. This service adds a lightweight backend health probe.
 */

export type BackendState = 'unknown' | 'online' | 'offline';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

let backendState: BackendState = 'unknown';
const listeners = new Set<(state: BackendState) => void>();
let probeInFlight = false;

export function getBackendState(): BackendState {
  return backendState;
}

export function subscribeBackend(listener: (state: BackendState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setBackendState(state: BackendState) {
  backendState = state;
  listeners.forEach((l) => l(state));
}

/**
 * Probe backend reachability via /health with a short timeout.
 * Returns true when the backend responds.
 */
export async function checkBackendReachable(timeoutMs = 4000): Promise<boolean> {
  if (typeof fetch === 'undefined') return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
      credentials: 'include',
      cache: 'no-store',
    });
    clearTimeout(timer);
    const ok = res.ok || res.status === 401 || res.status === 403;
    setBackendState(ok ? 'online' : 'offline');
    return ok;
  } catch {
    setBackendState('offline');
    return false;
  }
}

/**
 * Probe once (debounced). Used by the app on startup and on reconnect events.
 */
export function probeConnectivity(): Promise<boolean> {
  if (probeInFlight) return Promise.resolve(backendState === 'online');
  probeInFlight = true;
  return checkBackendReachable().finally(() => {
    probeInFlight = false;
  });
}

export function deviceOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/** True only when device is online AND backend responds online. */
export function isFullyOnline(): boolean {
  return deviceOnline() && backendState !== 'offline';
}
