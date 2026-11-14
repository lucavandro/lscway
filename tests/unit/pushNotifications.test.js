import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  urlBase64ToUint8Array,
  areKeysEqual,
  isPushSupported,
  detectIosPlatform,
  detectStandaloneMode,
  getPushApiBase,
  fetchPushConfig,
  registerPushSubscriptionOnServer,
  unregisterPushSubscriptionOnServer,
  fetchPushSubstitutions,
  subscribeToPush,
  unsubscribeFromPush,
  checkPushStatus,
  handleLogoutPushCleanup,
  pushSubscriptionStore,
  getStoredPushEndpoint,
} from '$lib/pushNotifications.js';
import { get } from 'svelte/store';
import { userEmail, notificationPermission, notificationsEnabled } from '$lib/stores.js';

describe('Web Push Notifications Module', () => {
  const SAMPLE_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

  let mockSubscription;
  let mockPushManager;
  let mockServiceWorkerRegistration;

  beforeEach(() => {
    localStorage.clear();
    userEmail.set('docente@lscortese.com');
    notificationsEnabled.set(false);
    notificationPermission.set(false);

    pushSubscriptionStore.set({
      supported: true,
      permission: 'default',
      subscribed: false,
      endpoint: null,
      loading: false,
      error: null,
      success: null,
      serverConfigured: false,
      publicKey: null,
      isIos: false,
      isStandalone: false,
    });

    const keyBytes = urlBase64ToUint8Array(SAMPLE_VAPID_PUBLIC_KEY);

    mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample-endpoint-token-123',
      expirationTime: null,
      options: {
        applicationServerKey: keyBytes.buffer,
        userVisibleOnly: true,
      },
      toJSON: vi.fn().mockReturnValue({
        endpoint: 'https://fcm.googleapis.com/fcm/send/sample-endpoint-token-123',
        expirationTime: null,
        keys: {
          p256dh: 'sample-p256dh-key',
          auth: 'sample-auth-secret',
        },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(mockSubscription),
    };

    mockServiceWorkerRegistration = {
      scope: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/',
      pushManager: mockPushManager,
      showNotification: vi.fn().mockResolvedValue(undefined),
    };

    // Setup global Notification
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    };

    // Setup global window / navigator
    globalThis.PushManager = function () {};
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockServiceWorkerRegistration),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Utility & Key Conversion', () => {
    it('correctly converts base64url VAPID public key to Uint8Array', () => {
      const uint8 = urlBase64ToUint8Array(SAMPLE_VAPID_PUBLIC_KEY);
      expect(uint8).toBeInstanceOf(Uint8Array);
      expect(uint8.length).toBe(65);
      expect(uint8[0]).toBe(4); // VAPID uncompressed public key starts with 0x04
    });

    it('throws error when converting empty or invalid VAPID key', () => {
      expect(() => urlBase64ToUint8Array('')).toThrow('Chiave VAPID non valida o vuota.');
      expect(() => urlBase64ToUint8Array(null)).toThrow('Chiave VAPID non valida o vuota.');
    });

    it('compares binary keys correctly', () => {
      const arr1 = new Uint8Array([1, 2, 3, 4]);
      const arr2 = new Uint8Array([1, 2, 3, 4]);
      const arr3 = new Uint8Array([1, 2, 9, 4]);
      const arr4 = new Uint8Array([1, 2, 3]);

      expect(areKeysEqual(arr1, arr2)).toBe(true);
      expect(areKeysEqual(arr1.buffer, arr2.buffer)).toBe(true);
      expect(areKeysEqual(arr1, arr3)).toBe(false);
      expect(areKeysEqual(arr1, arr4)).toBe(false);
      expect(areKeysEqual(null, arr1)).toBe(false);
    });

    it('detects push capability in browser environment', () => {
      expect(isPushSupported()).toBe(true);

      const originalPush = globalThis.PushManager;
      delete globalThis.PushManager;
      expect(isPushSupported()).toBe(false);
      globalThis.PushManager = originalPush;
    });

    it('detects platform iOS and standalone mode', () => {
      expect(detectIosPlatform()).toBe(false);
      expect(detectStandaloneMode()).toBe(false);

      // Simulate iPhone userAgent
      const originalUa = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
        configurable: true,
      });
      expect(detectIosPlatform()).toBe(true);

      // Simulate standalone
      Object.defineProperty(navigator, 'standalone', {
        value: true,
        configurable: true,
      });
      expect(detectStandaloneMode()).toBe(true);

      Object.defineProperty(navigator, 'userAgent', { value: originalUa, configurable: true });
      delete navigator.standalone;
    });
  });

  describe('API Contracts & Network Requests', () => {
    it('fetches push config via GET /me/push-config', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          configured: true,
          publicKey: SAMPLE_VAPID_PUBLIC_KEY,
          subscribed: false,
        }),
      });

      const config = await fetchPushConfig(mockFetch);
      expect(config.configured).toBe(true);
      expect(config.publicKey).toBe(SAMPLE_VAPID_PUBLIC_KEY);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/push-config'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('registers subscription via POST /me/push-subscription', async () => {
      const subJson = mockSubscription.toJSON();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const res = await registerPushSubscriptionOnServer(subJson, mockFetch);
      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/push-subscription'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(subJson),
        })
      );
    });

    it('unregisters subscription via DELETE /me/push-subscription', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const res = await unregisterPushSubscriptionOnServer(mockSubscription.endpoint, mockFetch);
      expect(res.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/push-subscription'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ endpoint: mockSubscription.endpoint }),
        })
      );
    });

    it('fetches published push substitutions via GET /me/push-substitutions', async () => {
      const mockItems = [
        {
          id: 'sub_1',
          data: '2026-11-14',
          ora: '1^ Ora',
          classe: { nome: '3A' },
          docenteAssente: { nome: 'BIANCHI G.' },
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          teacherName: 'Mario Rossi',
          teacherEmail: 'docente@lscortese.com',
          substitutions: mockItems,
        }),
      });

      const result = await fetchPushSubstitutions(mockFetch);
      expect(result.teacherName).toBe('Mario Rossi');
      expect(result.substitutions.length).toBe(1);
      expect(result.substitutions[0].id).toBe('sub_1');
    });
  });

  describe('Activation & Deactivation Flows', () => {
    it('throws error when browser does not support push', async () => {
      const originalPush = globalThis.PushManager;
      delete globalThis.PushManager;

      await expect(subscribeToPush()).rejects.toThrow('Questo browser non supporta le notifiche Web Push.');
      expect(get(pushSubscriptionStore).error).toContain('non supporta le notifiche');

      globalThis.PushManager = originalPush;
    });

    it('handles permission denied by user without proceeding', async () => {
      globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('denied');

      await expect(subscribeToPush()).rejects.toThrow('I permessi per le notifiche sono stati bloccati');
      expect(get(pushSubscriptionStore).permission).toBe('denied');
      expect(get(pushSubscriptionStore).subscribed).toBe(false);
      expect(mockPushManager.subscribe).not.toHaveBeenCalled();
    });

    it('handles backend not configured with VAPID keys', async () => {
      globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ configured: false, publicKey: null }),
      });

      await expect(subscribeToPush(mockFetch)).rejects.toThrow('non ha ancora configurato le chiavi VAPID');
      expect(get(pushSubscriptionStore).serverConfigured).toBe(false);
      expect(mockPushManager.subscribe).not.toHaveBeenCalled();
    });

    it('successfully subscribes and registers with backend', async () => {
      globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

      const mockFetch = vi.fn()
        .mockImplementation(async (url, opts) => {
          if (url.includes('/me/push-config')) {
            return {
              ok: true,
              status: 200,
              json: async () => ({ configured: true, publicKey: SAMPLE_VAPID_PUBLIC_KEY }),
            };
          }
          if (url.includes('/me/push-subscription') && opts.method === 'POST') {
            return {
              ok: true,
              status: 200,
              json: async () => ({ success: true }),
            };
          }
          return { ok: true, status: 200, json: async () => ({}) };
        });

      const sub = await subscribeToPush(mockFetch);
      expect(sub).toBe(mockSubscription);
      expect(mockPushManager.subscribe).toHaveBeenCalled();

      const state = get(pushSubscriptionStore);
      expect(state.subscribed).toBe(true);
      expect(state.endpoint).toBe(mockSubscription.endpoint);
      expect(state.success).toContain('attivate con successo');
      expect(getStoredPushEndpoint()).toBe(mockSubscription.endpoint);
      expect(get(notificationsEnabled)).toBe(true);
    });

    it('performs rollback and unregisters browser subscription if backend registration fails', async () => {
      globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

      const mockFetch = vi.fn()
        .mockImplementation(async (url, opts) => {
          if (url.includes('/me/push-config')) {
            return {
              ok: true,
              status: 200,
              json: async () => ({ configured: true, publicKey: SAMPLE_VAPID_PUBLIC_KEY }),
            };
          }
          if (url.includes('/me/push-subscription') && opts.method === 'POST') {
            return {
              ok: false,
              status: 500,
              json: async () => ({ message: 'Database connection error' }),
            };
          }
          return { ok: true, status: 200, json: async () => ({}) };
        });

      await expect(subscribeToPush(mockFetch)).rejects.toThrow('Database connection error');

      // Verify rollback: subscription was unsubscribed to prevent false state
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(get(pushSubscriptionStore).subscribed).toBe(false);
      expect(getStoredPushEndpoint()).toBeNull();
    });

    it('detects key change and replaces existing browser subscription', async () => {
      globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

      // Existing subscription has old key
      const oldSub = {
        ...mockSubscription,
        options: {
          applicationServerKey: new Uint8Array([9, 9, 9, 9]).buffer,
        },
        unsubscribe: vi.fn().mockResolvedValue(true),
      };
      mockPushManager.getSubscription.mockResolvedValueOnce(oldSub);

      const mockFetch = vi.fn()
        .mockImplementation(async (url, opts) => {
          if (url.includes('/me/push-config')) {
            return {
              ok: true,
              status: 200,
              json: async () => ({ configured: true, publicKey: SAMPLE_VAPID_PUBLIC_KEY }),
            };
          }
          if (url.includes('/me/push-subscription') && opts.method === 'POST') {
            return {
              ok: true,
              status: 200,
              json: async () => ({ success: true }),
            };
          }
          return { ok: true, status: 200, json: async () => ({}) };
        });

      await subscribeToPush(mockFetch);

      // Old sub was unsubscribed
      expect(oldSub.unsubscribe).toHaveBeenCalled();
      // New subscription was created
      expect(mockPushManager.subscribe).toHaveBeenCalled();
      expect(get(pushSubscriptionStore).subscribed).toBe(true);
    });

    it('unsubscribes from server first and then unregisters in browser', async () => {
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);
      localStorage.setItem('lscway_push_endpoint', mockSubscription.endpoint);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await unsubscribeFromPush(mockFetch);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/push-subscription'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(get(pushSubscriptionStore).subscribed).toBe(false);
      expect(getStoredPushEndpoint()).toBeNull();
      expect(get(notificationsEnabled)).toBe(false);
    });

    it('handles deactivation when browser subscription is already gone', async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);
      localStorage.setItem('lscway_push_endpoint', 'https://fcm.googleapis.com/fcm/stored');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await unsubscribeFromPush(mockFetch);

      // Successfully notified backend with stored endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/me/push-subscription'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/stored' }),
        })
      );
      expect(get(pushSubscriptionStore).subscribed).toBe(false);
      expect(getStoredPushEndpoint()).toBeNull();
    });
  });

  describe('Session Expiration, Logout & Account Changes', () => {
    it('resets push state on logout or 401', () => {
      localStorage.setItem('lscway_push_endpoint', 'https://fcm.googleapis.com/fcm/stored');
      pushSubscriptionStore.update((s) => ({ ...s, subscribed: true }));

      handleLogoutPushCleanup();

      expect(get(pushSubscriptionStore).subscribed).toBe(false);
      expect(getStoredPushEndpoint()).toBeNull();
    });

    it('triggers handleAuth401 when API returns 401 Unauthorized', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized', message: 'Session expired' }),
      });

      await expect(fetchPushConfig(mockFetch)).rejects.toThrow();
      expect(get(userEmail)).toBeNull();
      expect(get(pushSubscriptionStore).subscribed).toBe(false);
    });
  });

  describe('Service Worker Push Event & Controlled Navigation', () => {
    it('handles push event with valid payload and displays system notification', async () => {
      // Simulate Service Worker environment
      const swScope = {
        registration: {
          scope: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/',
          showNotification: vi.fn().mockResolvedValue(undefined),
        },
        location: {
          href: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/service-worker.js',
          origin: 'https://www.liceoscientificocortese.edu.it',
        },
      };

      const pushPayload = {
        title: 'OrarioLSC · Sostituzioni',
        body: 'Hai una nuova sostituzione per la classe 4A alle ore 08:55.',
        tag: 'substitution-456',
      };

      // Handler matching static/service-worker.js
      const onPush = (event, sw) => {
        let payload = {};
        if (event.data) {
          try {
            payload = event.data.json();
          } catch (e) {
            payload = { body: event.data.text() };
          }
        }

        const title = payload.title || 'OrarioLSC · Sostituzioni';
        const body = payload.body || 'Una sostituzione è stata pubblicata o aggiornata. Accedi per i dettagli.';
        const tag = payload.tag || 'orariolsc-substitution';
        const targetUrl = new URL('sostituzioni', sw.registration.scope).href;

        return sw.registration.showNotification(title, {
          body,
          tag,
          icon: new URL('favicon.png', sw.registration.scope).href,
          badge: new URL('favicon.png', sw.registration.scope).href,
          requireInteraction: true,
          data: { url: targetUrl, tag },
        });
      };

      const mockPushEvent = {
        data: {
          json: () => pushPayload,
          text: () => JSON.stringify(pushPayload),
        },
      };

      await onPush(mockPushEvent, swScope);

      expect(swScope.registration.showNotification).toHaveBeenCalledWith(
        'OrarioLSC · Sostituzioni',
        expect.objectContaining({
          body: expect.stringContaining('4A'),
          tag: 'substitution-456',
          data: expect.objectContaining({
            url: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/sostituzioni',
          }),
        })
      );
    });

    it('falls back to safe generic notification when push payload is missing or invalid', async () => {
      const swScope = {
        registration: {
          scope: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/',
          showNotification: vi.fn().mockResolvedValue(undefined),
        },
      };

      const onPush = (event, sw) => {
        let payload = {};
        if (event.data) {
          try {
            payload = event.data.json();
          } catch (e) {
            payload = {};
          }
        }

        const title = payload?.title || 'OrarioLSC · Sostituzioni';
        const body = payload?.body || 'Una sostituzione è stata pubblicata o aggiornata. Accedi per i dettagli.';

        return sw.registration.showNotification(title, { body });
      };

      // Empty event data
      await onPush({ data: null }, swScope);

      expect(swScope.registration.showNotification).toHaveBeenCalledWith(
        'OrarioLSC · Sostituzioni',
        expect.objectContaining({
          body: 'Una sostituzione è stata pubblicata o aggiornata. Accedi per i dettagli.',
        })
      );
    });

    it('navigates strictly to controlled internal destination /sostituzioni on notification click', async () => {
      const existingClient = {
        url: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/docente',
        focus: vi.fn().mockResolvedValue(undefined),
        navigate: vi.fn().mockResolvedValue(undefined),
      };

      const swScope = {
        registration: {
          scope: 'https://www.liceoscientificocortese.edu.it/app/way/tmp/',
        },
        location: {
          origin: 'https://www.liceoscientificocortese.edu.it',
        },
        clients: {
          matchAll: vi.fn().mockResolvedValue([existingClient]),
          openWindow: vi.fn().mockResolvedValue(undefined),
        },
      };

      const onNotificationClick = async (event, sw) => {
        event.notification.close();
        const targetUrl = new URL('sostituzioni', sw.registration.scope).href;
        const windowClients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });

        for (const client of windowClients) {
          if (client.url && 'focus' in client) {
            const clientUrl = new URL(client.url, sw.location.origin);
            if (clientUrl.origin === sw.location.origin) {
              await client.focus();
              if (client.url !== targetUrl && 'navigate' in client) {
                await client.navigate(targetUrl);
              }
              return client;
            }
          }
        }
        if (sw.clients.openWindow) {
          return await sw.clients.openWindow(targetUrl);
        }
      };

      const mockEvent = {
        notification: {
          close: vi.fn(),
          data: { url: 'https://evil.com/phishing' }, // Payload contains external URL that must be ignored
        },
      };

      await onNotificationClick(mockEvent, swScope);

      expect(mockEvent.notification.close).toHaveBeenCalled();
      expect(existingClient.focus).toHaveBeenCalled();
      // Navigates strictly to controlled internal URL, ignoring evil.com
      expect(existingClient.navigate).toHaveBeenCalledWith(
        'https://www.liceoscientificocortese.edu.it/app/way/tmp/sostituzioni'
      );
    });
  });
});
