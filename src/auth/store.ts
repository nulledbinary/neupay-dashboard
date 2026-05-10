import { create } from 'zustand';
import type { AuthResponse, ProfileSummary } from '@/api/types';
import {
  bindAuthSink,
  setAuthTokens,
  setStepUpToken,
} from '@/api/client';
import * as authApi from '@/api/auth';

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: ProfileSummary;
  // Step-up state lives in axios + memory only, so it doesn't survive reloads.
  // The user re-confirms their password each session before a privileged op.
}

interface AuthState {
  session: AuthSession | null;
  loginError: string | null;
  loading: boolean;
  signIn: (idNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Internal: called by the axios refresh interceptor. */
  applyRefresh: (next: AuthResponse) => void;
  /** Used after a successful step-up. */
  setStepUp: (token: string, expiresAt: string) => void;
  clearStepUp: () => void;
}

// In-memory only — no `persist` middleware. The session does not survive
// reloads, tab close, or 2 minutes of inactivity (see useIdleTimeout).
export const useAuth = create<AuthState>()((set, get) => ({
  session: null,
  loginError: null,
  loading: false,

  signIn: async (idNumber, password) => {
    set({ loading: true, loginError: null });
    try {
      const auth = await authApi.login({ idNumber, password });
      // Reject any response that doesn't carry both tokens — historically a
      // broken Amplify rewrite could return a 200 HTML page that JSON-parsed
      // as `{}`, leaving the store with `session != null` and `tokens.access
      // === undefined`. Subsequent admin requests then 403'd silently.
      if (!auth?.accessToken || !auth?.refreshToken || !auth?.user) {
        throw new Error('Login response was malformed — please retry.');
      }
      setAuthTokens(auth.accessToken, auth.refreshToken);
      set({
        session: {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: auth.user,
        },
        loading: false,
      });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as Error).message ?? 'Login failed';
      set({ loginError: msg, loading: false });
      throw err;
    }
  },

  signOut: async () => {
    const s = get().session;
    if (s) {
      try {
        await authApi.logout(s.refreshToken);
      } catch {
        /* ignore — clear local state regardless */
      }
    }
    setAuthTokens(null, null);
    setStepUpToken(null, null);
    set({ session: null });
  },

  applyRefresh: (next) => {
    const cur = get().session;
    if (!cur) return;
    set({
      session: {
        ...cur,
        accessToken: next.accessToken,
        refreshToken: next.refreshToken,
        user: next.user,
      },
    });
  },

  setStepUp: (token, expiresAt) => {
    setStepUpToken(token, expiresAt);
  },

  clearStepUp: () => setStepUpToken(null, null),
}));

// Wire axios → store for refresh / logout side effects.
bindAuthSink({
  onLogout: () => useAuth.getState().signOut(),
  onRefreshed: (next) => useAuth.getState().applyRefresh(next),
});
