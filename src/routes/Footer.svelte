<script>
  import { isLoading } from "$lib/stores.js";
  import { onMount, onDestroy } from "svelte";

  let isOnline = true;

  function updateOnlineStatus() {
    if (typeof navigator !== "undefined") {
      isOnline = navigator.onLine;
    }
  }

  onMount(() => {
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    }
  });
</script>

{#if $isLoading}
  <div class="top-loader" role="progressbar" aria-label="Caricamento in corso">
    <div class="loader-bar"></div>
  </div>
{/if}

<footer class="app-footer">
  <div class="footer-inner">
    <span class="school-info">WAY Cortese • A.S. 2026/27</span>
    <span class="status-indicator" class:offline={!isOnline}>
      <span class="status-dot"></span>
      <span>{isOnline ? "Online" : "Offline"}</span>
    </span>
  </div>
</footer>

<style>
  .top-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
    background: transparent;
    overflow: hidden;
  }

  .loader-bar {
    width: 100%;
    height: 100%;
    background: var(--brand-primary);
    animation: indeterminate-bar 1.2s infinite cubic-bezier(0.65, 0.815, 0.735, 0.395);
  }

  @keyframes indeterminate-bar {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .app-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: color-mix(in srgb, var(--brand-surface) 92%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--brand-border);
    padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
    z-index: 50;
  }

  .footer-inner {
    max-width: 68rem;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--brand-text-muted);
  }

  .school-info {
    font-weight: 500;
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: #10b981;
  }

  .status-indicator.offline {
    color: #ef4444;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
  }
</style>
