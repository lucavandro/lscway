<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { getSchoolHour, getDay } from "$lib/dateutils.js";
  import { onDestroy, onMount } from "svelte";
  import PwaButton from "./PWAButton.svelte";
  import Tabs from "./Tabs.svelte";
  import HeaderMenuPanel from "./HeaderMenuPanel.svelte";
  import { userEmail, isTeacher } from "$lib/stores.js";
  import ShareIcon from "$icons/ShareIcon.svelte";

  import {
    requestNotificationPermission,
    checkSubstitutionsForNotifications,
    clearNotifiedSubstitutions,
    setupBackgroundSync,
    checkNotificationPermission,
    syncUserEmailWithServiceWorker,
    clearUserFromServiceWorker,
  } from "$lib/notifications.js";

  let day, schoolHour, timeInterval, substitutionInterval;

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

  updateTime();

  // Lifecycle's events
  onMount(async () => {
    timeInterval = setInterval(updateTime, 1000);
    isLoading.set(false);
    // Controlla lo stato delle notifiche
    checkNotificationPermission();

    // Setup background sync
    await setupBackgroundSync();

    // Richiedi permesso per le notifiche se l'utente è loggato
    if ($userEmail) {
      await requestNotificationPermission();
      syncUserEmailWithServiceWorker();
      checkSubstitutions();
      substitutionInterval = setInterval(checkSubstitutions, 5000);
    }
  });

  onDestroy(() => {
    clearInterval(timeInterval);
    if (substitutionInterval) {
      clearInterval(substitutionInterval);
    }
  });

  // Reagisci ai cambiamenti dello stato di login
  $: if ($userEmail) {
    // Utente appena loggato
    requestNotificationPermission().then(() => {
      syncUserEmailWithServiceWorker();
      checkSubstitutions();
      if (!substitutionInterval) {
        substitutionInterval = setInterval(checkSubstitutions, 5000);
      }
    });
  } else if (substitutionInterval) {
    // Utente appena sloggato
    clearInterval(substitutionInterval);
    substitutionInterval = null;
    clearNotifiedSubstitutions();
    clearUserFromServiceWorker();
  }

  let open = false;

  function closeMenu() {
    open = false;
  }

  $: if ($page.url.pathname) {
    open = false;
  }
</script>

<header>
  <div class="container-fluid">
    <nav>
      <ul>
        <li class="menu">
          <button
            type="button"
            class="menu-toggle"
            aria-expanded={open}
            aria-label="Apri menu"
            on:click={() => (open = !open)}
          >
            ☰
          </button>

          <HeaderMenuPanel
            {open}
            isTeacher={$isTeacher}
            currentPath={$page.url.pathname}
            onClose={closeMenu}
          />
        </li>
        <li><strong>WAY Cortese</strong></li>
        <li><PwaButton /></li>
      </ul>
      <ul>
        <li>{day}</li>
        <li>{schoolHour}</li>
      </ul>
    </nav>
    <Tabs></Tabs>
  </div>
</header>

<style>
  @media (prefers-color-scheme: dark) {
    header {
      background-color: #1d232f;
    }
  }

  header {
    background-color: var(--pico-muted-border-color);
  }

  .menu {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: var(--pico-color);
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
  }

  #more-menu summary,
  #more-menu summary:hover,
  #more-menu summary:focus {
    list-style: none;
    cursor: pointer;
    border: none;
    background: none;
    font-weight: bold;
    color: var(--pico-color);
    font-size: 1.2rem;
    box-shadow: none;
  }

  #more-menu summary::after {
    display: none;
  }

  #more-menu .divider {
    border-top: 1px solid var(--pico-muted-border-color);
    padding: 0;
    margin: 0;
    font-size: 0;
  }
</style>
