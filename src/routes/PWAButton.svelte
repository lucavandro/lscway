<script>
  import { onMount } from "svelte";

  let deferredPrompt;
  let installButtonVisible = false;

  onMount(() => {
    if ("deferredInstallPrompt" in window && window.deferredInstallPrompt) {
      deferredPrompt = window.deferredInstallPrompt;
      installButtonVisible = true;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      deferredPrompt = e;
      installButtonVisible = true;
    };

    const handleAppInstalled = () => {
      installButtonVisible = false;
      deferredPrompt = null;
      window.deferredInstallPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  });

  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === "accepted") {
        installButtonVisible = false;
      }
    }
  }
</script>

{#if installButtonVisible}
  <button
    type="button"
    on:click={installApp}
    class="pwa-install-btn"
    aria-label="Installa applicazione"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>Installa</span>
  </button>
{/if}

<style>
  .pwa-install-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.65rem;
    border-radius: 9999px;
    background: var(--brand-primary);
    color: white;
    border: none;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
    transition: transform 0.15s ease, background 0.15s ease;
    white-space: nowrap;
    margin: 0;
    line-height: 1.2;
  }

  .pwa-install-btn:hover {
    background: var(--brand-primary-hover);
    transform: translateY(-1px);
  }

  .pwa-install-btn:active {
    transform: translateY(0);
  }
</style>
