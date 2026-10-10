import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enableNotifications,
  disableNotifications,
  toggleNotifications,
  checkNotificationPermission,
  showSubstitutionNotification,
  checkSubstitutionsForNotifications,
  clearNotifiedSubstitutions,
  syncUserEmailWithServiceWorker,
  syncNotificationsWithServiceWorker,
  clearUserFromServiceWorker
} from '$lib/notifications.js';
import { userEmail, notificationsEnabled, notificationPermission } from '$lib/stores.js';
import { get } from 'svelte/store';

describe('notifications module', () => {
  beforeEach(() => {
    localStorage.clear();
    clearNotifiedSubstitutions();
    userEmail.set('docente@lscortese.com');
    notificationsEnabled.set(true);
    notificationPermission.set(true);

    // Setup global Notification mock
    globalThis.Notification = vi.fn().mockImplementation((title, options) => ({
      title,
      ...options,
      close: vi.fn()
    }));
    globalThis.Notification.permission = 'granted';
    globalThis.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

    // Setup navigator.serviceWorker mock
    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: {
        controller: {
          postMessage: vi.fn()
        },
        ready: Promise.resolve({
          sync: {
            register: vi.fn()
          }
        })
      },
      writable: true,
      configurable: true
    });
  });

  it('checks notification permission correctly', () => {
    expect(checkNotificationPermission()).toBe(true);
    expect(get(notificationPermission)).toBe(true);

    globalThis.Notification.permission = 'denied';
    expect(checkNotificationPermission()).toBe(false);
    expect(get(notificationsEnabled)).toBe(false);
  });

  it('enables and disables notifications', async () => {
    globalThis.Notification.permission = 'granted';
    await enableNotifications();
    expect(get(notificationsEnabled)).toBe(true);

    disableNotifications();
    expect(get(notificationsEnabled)).toBe(false);
  });

  it('toggles notifications', async () => {
    notificationsEnabled.set(true);
    await toggleNotifications();
    expect(get(notificationsEnabled)).toBe(false);

    globalThis.Notification.permission = 'granted';
    await toggleNotifications();
    expect(get(notificationsEnabled)).toBe(true);
  });

  it('displays notification for pending substitution', () => {
    const sub = {
      id: 123,
      ora: '09:50',
      classe: '3B'
    };

    showSubstitutionNotification(sub);
    expect(globalThis.Notification).toHaveBeenCalledWith(
      'Sostituzione non confermata',
      expect.objectContaining({
        body: expect.stringContaining('09:50')
      })
    );

    // Calling again with the same substitution should NOT notify twice
    showSubstitutionNotification(sub);
    expect(globalThis.Notification).toHaveBeenCalledTimes(1);
  });

  it('checks substitutions array and triggers notifications for today only', () => {
    const today = new Date().toISOString().split('T')[0];
    const subs = [
      { id: 1, data: today, ora: '08:00', classe: '1A', accettato: false },
      { id: 2, data: today, ora: '08:55', classe: '2A', accettato: true }, // Already accepted
      { id: 3, data: '2020-01-01', ora: '10:45', classe: '5A', accettato: false } // Past date
    ];

    checkSubstitutionsForNotifications(subs);
    expect(globalThis.Notification).toHaveBeenCalledTimes(1);
    expect(globalThis.Notification).toHaveBeenCalledWith(
      'Sostituzione non confermata',
      expect.objectContaining({
        body: expect.stringContaining('08:00')
      })
    );
  });

  it('syncs user and notification state with service worker', () => {
    const postMessageSpy = navigator.serviceWorker.controller.postMessage;

    syncUserEmailWithServiceWorker();
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_USER_EMAIL',
        email: 'docente@lscortese.com'
      })
    );

    syncNotificationsWithServiceWorker(true);
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'SET_NOTIFICATIONS_ENABLED',
      enabled: true
    });

    clearUserFromServiceWorker();
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'SET_USER_EMAIL',
      email: null
    });
  });
});
