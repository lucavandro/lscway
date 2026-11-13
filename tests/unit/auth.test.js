import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAuthApiBase,
  checkSession,
  loginWithGoogle,
  logout,
  handleAuth401,
} from '../../src/lib/auth.js';
import { currentUser, userEmail, authStatus, authError } from '../../src/lib/stores.js';
import { get } from 'svelte/store';

describe('auth module (OrarioLSC shared session)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    currentUser.set(null);
    userEmail.set(null);
    authStatus.set('loading');
    authError.set(null);
  });

  describe('getAuthApiBase', () => {
    it('returns the auth base path containing /app/orario/api/v1', () => {
      const base = getAuthApiBase();
      expect(base).toContain('/app/orario/api/v1');
    });
  });

  describe('checkSession', () => {
    it('handles HTTP 200: authenticates user and updates stores', async () => {
      const mockUser = {
        displayName: 'Prof. Mario Rossi',
        email: 'rossi@lscortese.com',
        role: 'teacher',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const result = await checkSession(mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/session'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: expect.objectContaining({ Accept: 'application/json' }),
        })
      );

      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(get(currentUser)).toEqual(mockUser);
      expect(get(userEmail)).toBe('rossi@lscortese.com');
      expect(get(authStatus)).toBe('authenticated');
      expect(get(authError)).toBeNull();
    });

    it('handles HTTP 401: sets unauthenticated and clears user data', async () => {
      currentUser.set({ email: 'old@lscortese.com' });
      userEmail.set('old@lscortese.com');

      const mockFetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ message: 'Sessione scaduta' }),
      });

      const result = await checkSession(mockFetch);

      expect(result.authenticated).toBe(false);
      expect(get(currentUser)).toBeNull();
      expect(get(userEmail)).toBeNull();
      expect(get(authStatus)).toBe('unauthenticated');
    });

    it('handles HTTP 403: unauthorized access', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        json: async () => ({ message: 'Accesso negato: account non autorizzato' }),
      });

      const result = await checkSession(mockFetch);

      expect(result.authenticated).toBe(false);
      expect(result.forbidden).toBe(true);
      expect(result.message).toBe('Accesso negato: account non autorizzato');
      expect(get(authStatus)).toBe('forbidden');
      expect(get(authError)).toBe('Accesso negato: account non autorizzato');
    });

    it('handles HTTP 5xx: temporary error without triggering logout', async () => {
      currentUser.set({ email: 'docente@lscortese.com' });
      userEmail.set('docente@lscortese.com');

      const mockFetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: async () => ({ message: 'Errore interno del server' }),
      });

      const result = await checkSession(mockFetch);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe(true);
      expect(get(authStatus)).toBe('error');
      // Preserves existing user session in memory: does NOT interpret 5xx as logout
      expect(get(userEmail)).toBe('docente@lscortese.com');
      expect(get(currentUser)).toEqual({ email: 'docente@lscortese.com' });
    });

    it('handles network error: temporary connection error without triggering logout', async () => {
      currentUser.set({ email: 'docente@lscortese.com' });
      userEmail.set('docente@lscortese.com');

      const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const result = await checkSession(mockFetch);

      expect(result.authenticated).toBe(false);
      expect(result.networkError).toBe(true);
      expect(get(authStatus)).toBe('error');
      // Preserves existing user session in memory: does NOT interpret network failure as logout
      expect(get(userEmail)).toBe('docente@lscortese.com');
    });
  });

  describe('loginWithGoogle', () => {
    it('throws when credential is missing', async () => {
      await expect(loginWithGoogle('')).rejects.toThrow('Credenziale Google mancante');
      await expect(loginWithGoogle(null)).rejects.toThrow('Credenziale Google mancante');
    });

    it('handles HTTP 200: exchanges credential and updates profile', async () => {
      const mockUser = {
        displayName: 'Prof. Rossi',
        email: 'rossi@lscortese.com',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const result = await loginWithGoogle('valid-google-id-token', mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/google'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'same-origin',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
          body: JSON.stringify({ credential: 'valid-google-id-token' }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(get(currentUser)).toEqual(mockUser);
      expect(get(userEmail)).toBe('rossi@lscortese.com');
      expect(get(authStatus)).toBe('authenticated');
    });

    it('handles HTTP 401: invalid google credential', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ message: 'Token scaduto' }),
      });

      await expect(loginWithGoogle('bad-token', mockFetch)).rejects.toThrow('Token scaduto');
      expect(get(authStatus)).toBe('unauthenticated');
    });

    it('handles HTTP 403: unauthorized account', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        json: async () => ({ message: 'Account non autorizzato' }),
      });

      await expect(loginWithGoogle('forbidden-token', mockFetch)).rejects.toThrow(
        'Account non autorizzato'
      );
      expect(get(authStatus)).toBe('forbidden');
    });
  });

  describe('logout', () => {
    it('handles HTTP 204: terminates session, clears memory and calls disableAutoSelect', async () => {
      currentUser.set({ email: 'rossi@lscortese.com' });
      userEmail.set('rossi@lscortese.com');
      authStatus.set('authenticated');

      const disableAutoSelectMock = vi.fn();
      const originalWindow = globalThis.window;
      globalThis.window = {
        localStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
        },
        google: {
          accounts: {
            id: {
              disableAutoSelect: disableAutoSelectMock,
            },
          },
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        status: 204,
        ok: true,
      });

      const result = await logout(mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/session'),
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'same-origin',
        })
      );

      expect(result.success).toBe(true);
      expect(get(currentUser)).toBeNull();
      expect(get(userEmail)).toBeNull();
      expect(get(authStatus)).toBe('unauthenticated');
      expect(disableAutoSelectMock).toHaveBeenCalled();
      globalThis.window = originalWindow;
    });

    it('handles failure: does NOT clear user profile if request fails', async () => {
      currentUser.set({ email: 'rossi@lscortese.com' });
      userEmail.set('rossi@lscortese.com');
      authStatus.set('authenticated');

      const mockFetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: async () => ({ message: 'Server indisponibile' }),
      });

      await expect(logout(mockFetch)).rejects.toThrow('Server indisponibile');

      // Crucial requirement: non considerare riuscito il logout se fallisce
      expect(get(currentUser)).toEqual({ email: 'rossi@lscortese.com' });
      expect(get(userEmail)).toBe('rossi@lscortese.com');
      expect(get(authStatus)).toBe('authenticated');
    });
  });

  describe('handleAuth401', () => {
    it('clears all user credentials and marks unauthenticated', () => {
      currentUser.set({ email: 'rossi@lscortese.com' });
      userEmail.set('rossi@lscortese.com');
      authStatus.set('authenticated');

      handleAuth401();

      expect(get(currentUser)).toBeNull();
      expect(get(userEmail)).toBeNull();
      expect(get(authStatus)).toBe('unauthenticated');
    });
  });
});
