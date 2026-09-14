import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../api/client';
import { logout } from '../api/auth';
import { readMockSession } from '../api/mockAuth';

export type UserRole =
  | 'PATIENT'
  | 'DOCTOR'
  | 'SPECIALIST'
  | 'PHC_WORKER'
  | 'ADMIN'
  | 'PHC'
  | 'ANONYMOUS';

export interface AuthUser {
  internalUserId: string;
  role: UserRole;
  status: string;
  lastLoginAt?: string;
  displayName?: string;
}

export interface AuthSnapshot {
  user: AuthUser | null;
  loading: boolean;
  /** Short guard to avoid replacing a loaded session with a transient failure. */
  offline: boolean;
}

type Status = 'loading' | 'signed-out' | 'signed-in' | 'offline';

const ROLE_DEFAULT_NAME: Record<string, string> = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  SPECIALIST: 'Specialist',
  PHC_WORKER: 'Health Worker',
  ADMIN: 'Administrator',
  PHC: 'PHC Team',
};

interface AuthContextValue {
  user: AuthUser | null;
  status: Status;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  roleName: string;
  resolveBasePath: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function basePathFor(role?: string): string {
  switch (role) {
    case 'DOCTOR':
      return '/doctor';
    case 'SPECIALIST':
      return '/specialist';
    case 'PHC_WORKER':
      return '/worker';
    case 'ADMIN':
      return '/admin';
    case 'PHC':
      return '/phc';
    case 'PATIENT':
    default:
      return '/patient';
  }
}

function loadMe(): Promise<AuthUser | null> {
  return request<AuthUser>('/api/v1/auth/me').catch((err) => {
    if (err?.kind === 'unauthorized') {
      // No server session. Fall back to a locally-issued JWT session if present.
      const mock = readMockSession();
      return mock;
    }
    if (err?.kind === 'network') {
      const mock = readMockSession();
      return mock;
    }
    throw err;
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const refresh = useCallback(async () => {
    try {
      const me = await loadMe();
      if (me) {
        setUser(me);
        setStatus('signed-in');
      } else {
        setUser(null);
        setStatus('signed-out');
      }
    } catch {
      // Network / backend unreachable → keep whatever we had, flag offline.
      setStatus(user ? 'offline' : 'signed-out');
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setStatus('signed-out');
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const loading = status === 'loading';
    return {
      user,
      status,
      loading,
      refresh,
      signOut,
      roleName: user ? ROLE_DEFAULT_NAME[user.role] ?? 'User' : 'Guest',
      resolveBasePath: () => basePathFor(user?.role),
    };
  }, [user, status, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
