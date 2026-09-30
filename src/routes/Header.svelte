<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { getSchoolHour, getDay } from "$lib/dateutils.js";
  import { onDestroy, onMount } from "svelte";
  import PwaButton from "./PWAButton.svelte";
  import Tabs from "./Tabs.svelte";
  import { userEmail, isTeacher, isLoading, isMenuOpen, notificationsEnabled } from "$lib/stores.js";

  import {
    checkSubstitutionsForNotifications,
    clearNotifiedSubstitutions,
    setupBackgroundSync,
    checkNotificationPermission,
    syncUserEmailWithServiceWorker,
    syncNotificationsWithServiceWorker,
    clearUserFromServiceWorker,
  } from "$lib/notifications.js";

  let day = getDay();
  let schoolHour = getSchoolHour();
  let timeInterval;
  let substitutionInterval;

  function updateTime() {
    schoolHour = getSchoolHour();
    day = getDay();
  }

  async function checkSubstitutions() {
    if (!$userEmail || !$notificationsEnabled) return;

    try {
      const response = await fetch(
        `https://www.liceoscientificocortese.edu.it/app/way/docenti_sostituzioni_api.php?email=${encodeURIComponent($userEmail)}`,
      );
      const data = await response.json();

      if (data.success && $notificationsEnabled) {
        checkSubstitutionsForNotifications(data.data);
      }
    } catch (err) {
      console.error("Errore nel controllo sostituzioni per notifiche:", err);
    }
  }

  onMount(async () => {
    updateTime();
    timeInterval = setInterval(updateTime, 1000);
    isLoading.set(false);

    checkNotificationPermission();
    await setupBackgroundSync();

    if ($userEmail && $notificationsEnabled) {
      syncUserEmailWithServiceWorker();
      syncNotificationsWithServiceWorker(true);
      checkSubstitutions();
      if (!substitutionInterval) {
        substitutionInterval = setInterval(checkSubstitutions, 10000);
      }
    }
  });

  onDestroy(() => {
    if (timeInterval) clearInterval(timeInterval);
    if (substitutionInterval) clearInterval(substitutionInterval);
  });

  $: if ($userEmail && $notificationsEnabled) {
    syncUserEmailWithServiceWorker();
    syncNotificationsWithServiceWorker(true);
    checkSubstitutions();
    if (!substitutionInterval) {
      substitutionInterval = setInterval(checkSubstitutions, 10000);
    }
  } else {
    if (substitutionInterval) {
      clearInterval(substitutionInterval);
      substitutionInterval = null;
    }
    if (!$userEmail) {
      clearNotifiedSubstitutions();
      clearUserFromServiceWorker();
    } else if (!$notificationsEnabled) {
      syncNotificationsWithServiceWorker(false);
    }
  }
</script>

<header class="app-header">
  <div class="header-inner">
    <div class="header-row">
      <!-- Left side: Hamburger & Title aligned -->
      <div class="left-cluster">
        <button
          type="button"
          class="hamburger-btn"
          aria-expanded={$isMenuOpen}
          aria-label="Apri menu principale"
          on:click={() => ($isMenuOpen = !$isMenuOpen)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <a href={base || "/"} class="logo-link">
          <div class="logo-text">
            <span class="brand-title">WAY Cortese</span>
            <span class="brand-subtitle">Liceo N. Cortese</span>
          </div>
        </a>
      </div>

      <!-- Right side: Status indicator & PWA Button -->
      <div class="right-cluster">
        <div class="live-pill" title="Stato orario scolastico in tempo reale">
          {#if schoolHour && schoolHour !== "Fuori orario"}
            <span class="live-indicator"></span>
          {:else}
            <span class="offline-dot"></span>
          {/if}
          <span class="day-text">{day}</span>
          <span class="sep">•</span>
          <span class="hour-text">{schoolHour}</span>
        </div>

        <PwaButton />
      </div>
    </div>

    <!-- Navigation Tabs -->
    <Tabs />
  </div>
</header>

<style>
  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: color-mix(in srgb, var(--brand-surface) 92%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--brand-border);
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .header-inner {
    max-width: 68rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.75rem;
    padding-bottom: 0.65rem;
  }

  /* Left cluster: vertical alignment between button and title */
  .left-cluster {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    margin: 0;
    padding: 0;
  }

  .hamburger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    margin: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--brand-text);
    transition: background 0.15s ease, border-color 0.15s ease;
    flex-shrink: 0;
    box-sizing: border-box;
    line-height: 1;
  }

  .hamburger-btn:hover {
    background: var(--brand-surface-subtle);
    border-color: var(--brand-border);
  }

  .logo-link {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
    margin: 0;
    padding: 0;
    line-height: 1;
  }

  .logo-link:hover {
    text-decoration: none;
  }

  .logo-text {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    margin: 0;
    padding: 0;
  }

  .brand-title {
    font-weight: 700;
    font-size: 1rem;
    line-height: 1.2;
    color: var(--brand-text);
    letter-spacing: -0.01em;
    margin: 0;
  }

  .brand-subtitle {
    font-size: 0.7rem;
    color: var(--brand-text-muted);
    font-weight: 500;
    line-height: 1.1;
    margin: 0;
  }

  .right-cluster {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    margin: 0;
  }

  /* Live pill: large, legible, high-contrast */
  .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
    background: var(--brand-surface-card);
    border: 1.5px solid var(--brand-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--brand-text);
    white-space: nowrap;
    margin: 0;
    line-height: 1.2;
  }

  .day-text {
    font-weight: 800;
    font-size: 0.875rem;
    color: var(--brand-primary);
    letter-spacing: 0.02em;
  }

  .hour-text {
    font-weight: 700;
    font-size: 0.875rem;
    color: var(--brand-text);
  }

  .sep {
    color: var(--brand-text-muted);
    opacity: 0.5;
    font-size: 0.85rem;
  }

  .live-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #10b981;
    animation: pulse-dot 2s infinite ease-in-out;
    flex-shrink: 0;
  }

  .offline-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: var(--brand-text-muted);
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .header-row {
      padding-top: 0.85rem;
      padding-bottom: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .brand-subtitle {
      display: none;
    }
    .brand-title {
      font-size: 0.95rem;
    }
    .live-pill {
      font-size: 0.825rem;
      padding: 0.3rem 0.6rem;
      gap: 0.35rem;
    }
    .day-text {
      font-size: 0.825rem;
    }
    .hour-text {
      font-size: 0.825rem;
    }
  }
</style>
