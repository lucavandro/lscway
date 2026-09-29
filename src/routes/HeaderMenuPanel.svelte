<script>
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { afterNavigate } from "$app/navigation";
  import WifiIcon from "$icons/WifiIcon.svelte";
  import HomeIcon from "$icons/HomeIcon.svelte";
  import ShareIcon from "$icons/ShareIcon.svelte";
  import LoginIcon from "$icons/LoginIcon.svelte";
  import LogoutIcon from "$icons/LogoutIcon.svelte";
  import ReloadIcon from "$icons/ReloadIcon.svelte";
  import SwapIcon from "$icons/SwapIcon.svelte";
  import SunIcon from "$icons/SunIcon.svelte";
  import MoonIcon from "$icons/MoonIcon.svelte";
  import { isLoading, userEmail, isTeacher, isMenuOpen } from "$lib/stores.js";
  import { theme, toggleTheme } from "$lib/theme.js";
  import { onDestroy } from "svelte";

  let closing = false;
  let previouslyFocusedEl = null;

  function reload() {
    isLoading.set(true);
    closeMenu();
    setTimeout(() => location.reload(), 500);
  }

  function logout() {
    userEmail.set(null);
    closeMenu();
  }

  function closeMenu() {
    if (!$isMenuOpen || closing) return;
    closing = true;
    setTimeout(() => {
      closing = false;
      isMenuOpen.set(false);
    }, 200);
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && $isMenuOpen) {
      e.preventDefault();
      closeMenu();
    }
  }

  // Manage body scroll locking and inert state on main content
  $: if (typeof document !== "undefined") {
    const mainEl = document.getElementById("main-content");
    if ($isMenuOpen) {
      previouslyFocusedEl = document.activeElement;
      document.body.style.overflow = "hidden";
      if (mainEl) mainEl.inert = true;
    } else if (!closing) {
      document.body.style.overflow = "";
      if (mainEl) mainEl.inert = false;
      if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === "function") {
        previouslyFocusedEl.focus();
        previouslyFocusedEl = null;
      }
    }
  }

  // Safely close only when genuine page navigation occurs
  afterNavigate(() => {
    if ($isMenuOpen) {
      closeMenu();
    }
  });

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      const mainEl = document.getElementById("main-content");
      if (mainEl) mainEl.inert = false;
    }
  });

  // Action to ensure the drawer is always mounted directly onto document.body
  function portal(node) {
    if (typeof document !== "undefined" && node.parentNode !== document.body) {
      document.body.appendChild(node);
    }
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      },
    };
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $isMenuOpen || closing}
  <div use:portal class="drawer-portal-wrapper">
    <!-- Backdrop covering the entire viewport -->
    <button
      class="drawer-backdrop"
      class:backdrop-closing={closing}
      type="button"
      aria-label="Chiudi menu"
      on:click={closeMenu}
    ></button>

    <!-- Navigation Drawer at 100dvh full height in foreground -->
    <aside
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
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {#if $isTeacher && $userEmail}
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
              class:active={$page.url.pathname === base || $page.url.pathname === base + "/"}
              on:click={closeMenu}
            >
              <span class="nav-icon"><HomeIcon /></span>
              <span class="nav-text">Home Orario</span>
            </a>
          </li>

          {#if $isTeacher}
            <li>
              <a
                href="{base}/hotspot"
                class="nav-link"
                class:active={$page.url.pathname === base + "/hotspot"}
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
                class:active={$page.url.pathname === base + "/sostituzioni"}
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
                class:active={$page.url.pathname === base + "/signin"}
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
              class:active={$page.url.pathname === base + "/qr"}
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
            <button
              type="button"
              class="nav-action-btn theme-toggle-btn"
              role="switch"
              aria-checked={$theme === 'dark'}
              aria-label="Passa a tema {$theme === 'dark' ? 'chiaro' : 'scuro'}"
              on:click={toggleTheme}
            >
              <span class="nav-icon">
                {#if $theme === 'dark'}
                  <MoonIcon />
                {:else}
                  <SunIcon />
                {/if}
              </span>
              <span class="nav-text">
                {$theme === 'dark' ? 'Tema scuro' : 'Tema chiaro'}
              </span>
              <span class="theme-switch" aria-hidden="true" class:active={$theme === 'dark'}>
                <span class="theme-switch-thumb"></span>
              </span>
            </button>
          </li>
          <li>
            <button type="button" class="nav-action-btn" on:click={reload}>
              <span class="nav-icon"><ReloadIcon /></span>
              <span class="nav-text">Aggiorna dati</span>
            </button>
          </li>
          {#if $isTeacher}
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
  </div>
{/if}

<style>
  .drawer-portal-wrapper {
    position: static;
  }

  .drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100dvh;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: 0;
    padding: 0;
    margin: 0;
    z-index: 99998;
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
    height: 100dvh;
    min-height: 100dvh;
    max-height: 100dvh;
    width: min(82vw, 290px);
    background: var(--brand-surface-card);
    border-right: 1px solid var(--brand-border);
    box-shadow: 6px 0 32px rgba(0, 0, 0, 0.25);
    display: block;
    padding: calc(0.85rem + env(safe-area-inset-top, 0px)) 0.85rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
    z-index: 99999;
    overflow-y: auto;
    overscroll-behavior: contain;
    box-sizing: border-box;
    animation: slide-drawer 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .drawer-panel.panel-closing {
    animation: slide-drawer-out 0.2s ease-in forwards;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.65rem;
    border-bottom: 1px solid var(--brand-border);
    margin-bottom: 0.65rem;
    flex-shrink: 0;
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .brand-badge {
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
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
  }

  .brand-meta {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1.2;
  }

  .brand-sub {
    font-size: 0.675rem;
    color: var(--brand-text-muted);
  }

  .close-btn {
    background: transparent;
    border: none;
    padding: 0.35rem;
    border-radius: 6px;
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
    gap: 0.6rem;
    padding: 0.45rem 0.6rem;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    border-radius: 8px;
    margin-bottom: 0.65rem;
    flex-shrink: 0;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--brand-primary);
    color: white;
    font-weight: 700;
    font-size: 0.8rem;
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
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--brand-primary);
    letter-spacing: 0.04em;
  }

  .user-email {
    font-size: 0.75rem;
    color: var(--brand-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .drawer-nav {
    display: block;
  }

  .nav-section-label {
    display: block;
    font-size: 0.675rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--brand-text-muted);
    padding: 0.35rem 0.75rem;
    margin-top: 0.75rem;
    margin-bottom: 0.4rem;
    line-height: 1.3;
  }

  .drawer-nav > .nav-section-label:first-child {
    margin-top: 0.2rem;
  }

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0 0 0.75rem 0;
    display: block;
  }

  .nav-list li {
    display: block;
    margin: 0 0 0.3rem 0;
    padding: 0;
  }

  .nav-list li:last-child {
    margin-bottom: 0;
  }

  .nav-link,
  .nav-action-btn {
    display: block;
    padding: 0.65rem 0.75rem;
    border-radius: 8px;
    color: var(--brand-text);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    box-sizing: border-box;
    line-height: 1.2;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    color: var(--brand-text-muted);
    width: 18px;
    height: 18px;
    margin-right: 0.65rem;
    flex-shrink: 0;
  }

  .nav-icon :global(.icon) {
    width: 16px;
    height: 16px;
  }

  .nav-text {
    display: inline-block;
    vertical-align: middle;
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

  /* Theme Switch in Drawer */
  .theme-switch {
    float: right;
    width: 38px;
    height: 20px;
    background: var(--brand-border);
    border-radius: 9999px;
    padding: 2px;
    transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    margin-top: -1px;
  }

  .theme-switch.active {
    background: var(--brand-primary);
  }

  .theme-switch-thumb {
    width: 16px;
    height: 16px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateX(0);
    display: block;
  }

  .theme-switch.active .theme-switch-thumb {
    transform: translateX(18px);
  }

  .drawer-footer {
    padding-top: 0.75rem;
    margin-top: 0.75rem;
    border-top: 1px solid var(--brand-border);
    display: block;
    color: var(--brand-text-muted);
    font-size: 0.7rem;
  }

  .drawer-footer small {
    display: block;
    line-height: 1.35;
  }

  .drawer-footer .version {
    margin-top: 0.15rem;
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
