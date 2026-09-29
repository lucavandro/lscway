<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { getSchoolHour, getDay } from "$lib/dateutils.js";
  import { onDestroy, onMount } from "svelte";
  import PwaButton from "./PWAButton.svelte";
  import Tabs from "./Tabs.svelte";
  import { userEmail, isTeacher, isLoading, isMenuOpen } from "$lib/stores.js";

  import {
    requestNotificationPermission,
    checkSubstitutionsForNotifications,
    clearNotifiedSubstitutions,
    setupBackgroundSync,
    checkNotificationPermission,
    syncUserEmailWithServiceWorker,
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
    if (!$userEmail) return;

    try {
      const response = await fetch(
        `https://www.liceoscientificocortese.edu.it/app/way/docenti_sostituzioni_api.php?email=${encodeURIComponent($userEmail)}`,
      );
      const data = await response.json();

      if (data.success) {
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

    if ($userEmail) {
      await requestNotificationPermission();
      syncUserEmailWithServiceWorker();
      checkSubstitutions();
      substitutionInterval = setInterval(checkSubstitutions, 10000);
    }
  });

  onDestroy(() => {
    if (timeInterval) clearInterval(timeInterval);
    if (substitutionInterval) clearInterval(substitutionInterval);
  });

  $: if ($userEmail) {
    requestNotificationPermission().then(() => {
      syncUserEmailWithServiceWorker();
      checkSubstitutions();
      if (!substitutionInterval) {
        substitutionInterval = setInterval(checkSubstitutions, 10000);
      }
    });
  } else if (substitutionInterval) {
    clearInterval(substitutionInterval);
    substitutionInterval = null;
    clearNotifiedSubstitutions();
    clearUserFromServiceWorker();
  }
</script>

<header class="app-header">
  <div class="header-inner">
    <div class="header-row">
      <!-- Left side: Hamburger & Title -->
      <div class="left-cluster">
        <button
          type="button"
          class="hamburger-btn"
          aria-expanded={$isMenuOpen}
          aria-label="Apri menu principale"
          on:click={() => ($isMenuOpen = !$isMenuOpen)}
        >
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <a href={base || "/"} class="logo-link">
          <div class="logo-icon">W</div>
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
    background: color-mix(in srgb, var(--brand-surface) 90%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--brand-border);
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .header-inner {
    max-width: 68rem;
    margin: 0 auto;
    padding: 0.65rem 1rem 0;
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.5rem;
  }

  .left-cluster {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .hamburger-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 38px;
    height: 38px;
    padding: 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    color: var(--brand-text);
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .hamburger-btn:hover {
    background: var(--brand-surface-subtle);
    border-color: var(--brand-border);
  }

  .hamburger-btn .bar {
    display: block;
    width: 100%;
    height: 2px;
    background: currentColor;
    border-radius: 2px;
    transition: transform 0.2s ease;
  }

  .logo-link {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    text-decoration: none;
    color: inherit;
  }

  .logo-link:hover {
    text-decoration: none;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--brand-primary), #1d4ed8);
    color: #ffffff;
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    flex-shrink: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .brand-title {
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1.15;
    color: var(--brand-text);
    letter-spacing: -0.01em;
  }

  .brand-subtitle {
    font-size: 0.7rem;
    color: var(--brand-text-muted);
    font-weight: 500;
  }

  .right-cluster {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.65rem;
    border-radius: 9999px;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--brand-text);
    white-space: nowrap;
  }

  .day-text {
    font-weight: 700;
    color: var(--brand-primary);
  }

  .sep {
    color: var(--brand-text-muted);
    opacity: 0.5;
  }

  .offline-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--brand-text-muted);
  }

  @media (max-width: 480px) {
    .brand-subtitle {
      display: none;
    }
    .live-pill {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
    }
  }
</style>
