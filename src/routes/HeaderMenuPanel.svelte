<script>
  import { base } from "$app/paths";
  import WifiIcon from "$icons/WifiIcon.svelte";
  import HomeIcon from "$icons/HomeIcon.svelte";
  import ShareIcon from "$icons/ShareIcon.svelte";
  import LoginIcon from "$icons/LoginIcon.svelte";
  import LogoutIcon from "$icons/LogoutIcon.svelte";
  import ReloadIcon from "$icons/ReloadIcon.svelte";
  import SwapIcon from "$icons/SwapIcon.svelte";
  import { isLoading, userEmail } from "$lib/stores.js";
  export let open = false;
  export let isTeacher = false;
  export let currentPath = "";
  export let onClose = () => {};

  let closing = false;
  function reload() {
    isLoading.set(true);
    setTimeout(() => location.reload(), 1000);
  }
  function logout() {
    userEmail.set(null);
    clearNotifiedSubstitutions();
    clearUserFromServiceWorker();
    if (substitutionInterval) {
      clearInterval(substitutionInterval);
      substitutionInterval = null;
    }
  }
  function closeMenu() {
    if (!open) return;

    closing = true;
    window.setTimeout(() => {
      closing = false;
      onClose();
    }, 200);
  }

  $: if (open) {
    closing = false;
  }
</script>

{#if open || closing}
  <button
    class="backdrop"
    type="button"
    aria-label="Chiudi menu"
    on:click={closeMenu}
  ></button>
  <aside
    class:panel={!closing}
    class:panel-closing={closing}
    role="dialog"
    aria-label="Menu laterale"
  >
    <div class="header-row">
      <span class="title">WAY Cortese</span>
      <button
        type="button"
        class="close"
        aria-label="Chiudi pannello"
        on:click={closeMenu}>×</button
      >
    </div>
    {#if isTeacher}
      {$userEmail}
    {/if}
    <ul>
      <li>
        <HomeIcon />
        <a href={base} class:active={currentPath === base} on:click={closeMenu}>
          Home
        </a>
      </li>
      {#if isTeacher}
        <li>
          <WifiIcon />
          <a
            href="hotspot"
            class:active={currentPath === base + "/hotspot"}
            on:click={closeMenu}
          >
            Hotspot
          </a>
        </li>
        <li>
          <SwapIcon />
          <a href="sostituzioni">Sostituzioni</a>
        </li>
      {:else}
        <li><LoginIcon /><a href="signin">Login</a></li>
      {/if}

      <li><ReloadIcon /><a on:click={reload}>Aggiorna<a></a></a></li>
      <li><ShareIcon /><a href="qr">Condividi</a></li>
      {#if isTeacher}
        <li><LogoutIcon /><a on:click={logout} class="red">Logout</a></li>
      {/if}
    </ul>
  </aside>
{/if}

<style>
  button.close {
    background: none;
    border: none;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    border: 0;
    padding: 0;
    z-index: 9;
  }

  .panel,
  .panel-closing {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(80vw, 280px);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--pico-card-background-color);
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
    z-index: 10;
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .title {
    font-weight: 600;
  }

  .panel {
    transform: translateX(-100%);
    animation: slide-in 0.2s ease-out forwards;
  }

  .panel-closing {
    transform: translateX(0);
    animation: slide-out 0.2s ease-out forwards;
  }

  .close {
    align-self: flex-end;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .panel li,
  .panel-closing li {
    padding: 0.5rem;
    border-bottom: 1px solid var(--pico-muted-border-color);
  }

  .panel li a {
    color: var(--pico-secondary) !important;
    display: inline-block;
    margin-left: 0.5rem;
  }

  .panel a.active,
  .panel-closing a.active {
    color: var(--pico-primary) !important;
    font-weight: bold;
  }

  @keyframes slide-in {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-out {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
</style>
