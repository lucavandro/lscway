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
  import { onMount, onDestroy } from "svelte";

  export let open = false;
  export let isTeacher = false;
  export let currentPath = "";
  export let onClose = () => {};

  let closing = false;
  let drawerEl;
  let previouslyFocusedEl = null;

  function reload() {
    isLoading.set(true);
    setTimeout(() => location.reload(), 600);
  }

  function logout() {
    userEmail.set(null);
    closeMenu();
  }

  function closeMenu() {
    if (!open || closing) return;
    closing = true;
    setTimeout(() => {
      closing = false;
      onClose();
    }, 200);
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeMenu();
    }
  }

  // Manage accessibility and inert state on main content
  $: if (typeof document !== "undefined") {
    const mainEl = document.getElementById("main-content");
    if (open) {
      previouslyFocusedEl = document.activeElement;
      if (mainEl) mainEl.inert = true;
    } else {
      if (mainEl) mainEl.inert = false;
      if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === "function") {
        previouslyFocusedEl.focus();
        previouslyFocusedEl = null;
      }
    }
  }

  onDestroy(() => {
    if (typeof document !== "undefined") {
      const mainEl = document.getElementById("main-content");
      if (mainEl) mainEl.inert = false;
    }
  });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open || closing}
  <!-- Backdrop with blur -->
  <button
    class="drawer-backdrop"
    class:backdrop-closing={closing}
    type="button"
    aria-label="Chiudi menu"
    on:click={closeMenu}
  ></button>

  <!-- Navigation Drawer (Modern Web Guidance navigation-drawer) -->
  <aside
    bind:this={drawerEl}
    class="drawer-panel"
    class:panel-closing={closing}
    role="dialog"
    aria-modal="true"
    aria-label="Menu di navigazione"
  >
    <div class="drawer-header">
      <div class="brand-group">
        <div class="brand-badge">W</div>
        <div class="brand-meta">
          <span class="brand-name">WAY Cortese</span>
          <span class="brand-sub">Orario & Sostituzioni</span>
        </div>
      </div>
      <button
        type="button"
        class="close-btn"
        aria-label="Chiudi menu"
        on:click={closeMenu}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    {#if isTeacher && $userEmail}
      <div class="user-card">
        <div class="user-avatar">
          {$userEmail.charAt(0).toUpperCase()}
        </div>
        <div class="user-info">
          <span class="user-tag">Docente</span>
          <span class="user-email" title={$userEmail}>{$userEmail}</span>
        </div>
      </div>
    {/if}

    <nav class="drawer-nav">
      <div class="nav-section-label">Navigazione</div>
      <ul class="nav-list">
        <li>
          <a
            href={base || "/"}
            class="nav-link"
            class:active={currentPath === base || currentPath === base + "/"}
            on:click={closeMenu}
          >
            <span class="nav-icon"><HomeIcon /></span>
            <span class="nav-text">Home Orario</span>
          </a>
        </li>

        {#if isTeacher}
          <li>
            <a
              href="{base}/hotspot"
              class="nav-link"
              class:active={currentPath === base + "/hotspot"}
              on:click={closeMenu}
            >
              <span class="nav-icon"><WifiIcon /></span>
              <span class="nav-text">Hotspot LIM</span>
            </a>
          </li>
          <li>
            <a
              href="{base}/sostituzioni"
              class="nav-link"
              class:active={currentPath === base + "/sostituzioni"}
              on:click={closeMenu}
            >
              <span class="nav-icon"><SwapIcon /></span>
              <span class="nav-text">Sostituzioni</span>
            </a>
          </li>
        {:else}
          <li>
            <a
              href="{base}/signin"
              class="nav-link"
              class:active={currentPath === base + "/signin"}
              on:click={closeMenu}
            >
              <span class="nav-icon"><LoginIcon /></span>
              <span class="nav-text">Login Docenti</span>
            </a>
          </li>
        {/if}

        <li>
          <a
            href="{base}/qr"
            class="nav-link"
            class:active={currentPath === base + "/qr"}
            on:click={closeMenu}
          >
            <span class="nav-icon"><ShareIcon /></span>
            <span class="nav-text">Condividi App</span>
          </a>
        </li>
      </ul>

      <div class="nav-section-label">Azioni</div>
      <ul class="nav-list">
        <li>
          <button type="button" class="nav-action-btn" on:click={reload}>
            <span class="nav-icon"><ReloadIcon /></span>
            <span class="nav-text">Aggiorna dati</span>
          </button>
        </li>
        {#if isTeacher}
          <li>
            <button type="button" class="nav-action-btn logout-btn" on:click={logout}>
              <span class="nav-icon"><LogoutIcon /></span>
              <span class="nav-text">Esci dall'account</span>
            </button>
          </li>
        {/if}
      </ul>
    </nav>

    <div class="drawer-footer">
      <small>Liceo Scientifico N. Cortese</small>
      <small class="version">A.S. 2026/27</small>
    </div>
  </aside>
{/if}

<style>
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 0;
    padding: 0;
    margin: 0;
    z-index: 1000;
    cursor: pointer;
    animation: fade-backdrop 0.25s ease-out forwards;
  }

  .drawer-backdrop.backdrop-closing {
    animation: fade-backdrop-out 0.2s ease-in forwards;
  }

  .drawer-panel {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(85vw, 320px);
    background: var(--brand-surface-card);
    border-right: 1px solid var(--brand-border);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    padding: 1.25rem 1rem;
    z-index: 1001;
    overflow-y: auto;
    overscroll-behavior: contain;
    animation: slide-drawer 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .drawer-panel.panel-closing {
    animation: slide-drawer-out 0.2s ease-in forwards;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--brand-border);
    margin-bottom: 1rem;
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--brand-primary), #1d4ed8);
    color: #ffffff;
    font-weight: 700;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  }

  .brand-meta {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1.2;
  }

  .brand-sub {
    font-size: 0.75rem;
    color: var(--brand-text-muted);
  }

  .close-btn {
    background: transparent;
    border: none;
    padding: 0.4rem;
    border-radius: 8px;
    color: var(--brand-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .close-btn:hover {
    background: var(--brand-surface-subtle);
    color: var(--brand-text);
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    border-radius: 10px;
    margin-bottom: 1.25rem;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--brand-primary);
    color: white;
    font-weight: 700;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .user-tag {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--brand-primary);
    letter-spacing: 0.04em;
  }

  .user-email {
    font-size: 0.8rem;
    color: var(--brand-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .drawer-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .nav-section-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brand-text-muted);
    padding: 0.5rem 0.5rem 0.25rem;
  }

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-link,
  .nav-action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    color: var(--brand-text);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    box-sizing: border-box;
  }

  .nav-link:hover,
  .nav-action-btn:hover {
    background: var(--brand-surface-subtle);
    color: var(--brand-primary);
    text-decoration: none;
  }

  .nav-link.active {
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    font-weight: 600;
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-text-muted);
  }

  .nav-link.active .nav-icon {
    color: var(--brand-primary);
  }

  .nav-action-btn.logout-btn {
    color: #ef4444;
  }

  .nav-action-btn.logout-btn .nav-icon {
    color: #ef4444;
  }

  .nav-action-btn.logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  .drawer-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--brand-border);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: var(--brand-text-muted);
    font-size: 0.75rem;
  }

  @keyframes fade-backdrop {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fade-backdrop-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes slide-drawer {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  @keyframes slide-drawer-out {
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
  }
</style>
