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
  import BellIcon from "$icons/BellIcon.svelte";
  import BellOffIcon from "$icons/BellOffIcon.svelte";
  import SocialIcon from "$icons/SocialIcon.svelte";
  import BookingIcon from "$icons/BookingIcon.svelte";
  import LinkIcon from "$icons/LinkIcon.svelte";
  import {
    isLoading,
    userEmail,
    isTeacher,
    isMenuOpen,
    notificationsEnabled,
    tableFontScale,
    increaseTableFontScale,
    decreaseTableFontScale,
    resetTableFontScale,
    TABLE_FONT_SCALE_MIN,
    TABLE_FONT_SCALE_MAX,
    TABLE_FONT_SCALE_STEP,
    TABLE_FONT_SCALE_DEFAULT
  } from "$lib/stores.js";
  import { theme, toggleTheme } from "$lib/theme.js";
  import { toggleNotifications } from "$lib/notifications.js";
  import { onDestroy } from "svelte";

  let closing = false;
  let previouslyFocusedEl = null;

  const fontScaleSteps = Array.from(
    { length: Math.round((TABLE_FONT_SCALE_MAX - TABLE_FONT_SCALE_MIN) / TABLE_FONT_SCALE_STEP) + 1 },
    (_, i) => Math.round((TABLE_FONT_SCALE_MIN + i * TABLE_FONT_SCALE_STEP) * 100) / 100
  );

  $: fontScalePercent = Math.round(($tableFontScale || TABLE_FONT_SCALE_DEFAULT) * 100);
  $: isCustomScale = Math.abs(($tableFontScale || TABLE_FONT_SCALE_DEFAULT) - TABLE_FONT_SCALE_DEFAULT) > 0.001;
  $: fontScaleProgress =
    ((($tableFontScale || TABLE_FONT_SCALE_DEFAULT) - TABLE_FONT_SCALE_MIN) /
      (TABLE_FONT_SCALE_MAX - TABLE_FONT_SCALE_MIN)) *
    100;

  function handleFontSliderInput(e) {
    const val = parseFloat(e.currentTarget.value);
    if (!Number.isNaN(val)) {
      tableFontScale.set(Math.round(val * 100) / 100);
    }
  }

  async function handleToggleNotifications() {
    await toggleNotifications();
  }

  async function reload() {
    isLoading.set(true);
    closeMenu();
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("lscway_orario_cache_v1");
      }
      if (typeof window !== "undefined" && "caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update().catch(() => {})));
      }
    } catch (e) {}
    setTimeout(() => location.reload(), 300);
  }

  function logout() {
    userEmail.set(null);
    closeMenu();
  }

  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let touchCurrentY = 0;
  let isTrackingTouch = false;
  let suppressNextClick = false;

  function handleTouchStart(e) {
    if (!e.touches || e.touches.length !== 1 || closing) return;
    if (e.target && typeof e.target.closest === "function" && e.target.closest(".font-control-card")) {
      isTrackingTouch = false;
      return;
    }
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCurrentX = touchStartX;
    touchCurrentY = touchStartY;
    isTrackingTouch = true;
    suppressNextClick = false;
  }

  function handleTouchMove(e) {
    if (!isTrackingTouch || !e.touches || e.touches.length !== 1 || closing) return;
    touchCurrentX = e.touches[0].clientX;
    touchCurrentY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    if (!isTrackingTouch || closing) return;
    isTrackingTouch = false;

    const endX =
      e.changedTouches && e.changedTouches.length > 0
        ? e.changedTouches[0].clientX
        : touchCurrentX;
    const endY =
      e.changedTouches && e.changedTouches.length > 0
        ? e.changedTouches[0].clientY
        : touchCurrentY;

    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;

    // Close drawer on horizontal swipe (swipe right or swipe left)
    if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 350);
      closeMenu();
    }
  }

  function handleTouchCancel() {
    isTrackingTouch = false;
  }

  function handleCaptureClick(e) {
    if (suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClick = false;
    }
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
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    use:portal
    class="drawer-portal-wrapper"
    on:touchstart|passive={handleTouchStart}
    on:touchmove|passive={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:touchcancel={handleTouchCancel}
    on:click|capture={handleCaptureClick}
  >
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
          <img src="{base}/logo-blue.webp?v=20261009-2" alt="Logo WAY Cortese" class="brand-logo" width="36" height="36" loading="lazy" />
          <div class="brand-meta">
            <span class="brand-name">WAY Cortese</span>
            <span class="brand-sub">Liceo N. Cortese</span>
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
              href="{base}/prenotazioni"
              class="nav-link"
              class:active={$page.url.pathname === base + "/prenotazioni"}
              on:click={closeMenu}
            >
              <span class="nav-icon"><BookingIcon /></span>
              <span class="nav-text">Prenotazioni</span>
            </a>
          </li>

          <li>
            <a
              href="{base}/link"
              class="nav-link"
              class:active={$page.url.pathname === base + "/link"}
              on:click={closeMenu}
            >
              <span class="nav-icon"><LinkIcon /></span>
              <span class="nav-text">Link Rapidi</span>
            </a>
          </li>

          <li>
            <a
              href="{base}/social"
              class="nav-link"
              class:active={$page.url.pathname === base + "/social"}
              on:click={closeMenu}
            >
              <span class="nav-icon"><SocialIcon /></span>
              <span class="nav-text">Canali Social</span>
            </a>
          </li>

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
          {#if $isTeacher}
            <li>
              <button
                type="button"
                class="nav-action-btn notif-toggle-btn"
                role="switch"
                aria-checked={$notificationsEnabled}
                aria-label={$notificationsEnabled ? 'Disattiva notifiche' : 'Attiva notifiche'}
                title={$notificationsEnabled ? 'Disattiva notifiche' : 'Attiva notifiche'}
                on:click={handleToggleNotifications}
              >
                <span class="nav-icon" class:active-bell={$notificationsEnabled}>
                  {#if $notificationsEnabled}
                    <BellIcon />
                  {:else}
                    <BellOffIcon />
                  {/if}
                </span>
                <span class="nav-text">
                  {$notificationsEnabled ? 'Notifiche attive' : 'Notifiche disattivate'}
                </span>
                <span class="theme-switch" aria-hidden="true" class:active={$notificationsEnabled}>
                  <span class="theme-switch-thumb"></span>
                </span>
              </button>
            </li>
          {/if}
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
            <div class="font-control-card" role="group" aria-label="Dimensione testo tabelle">
              <div class="font-control-header">
                <div class="font-control-label">
                  <span class="nav-icon font-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="4 7 4 4 20 4 20 7"></polyline>
                      <line x1="9" y1="20" x2="15" y2="20"></line>
                      <line x1="12" y1="4" x2="12" y2="20"></line>
                    </svg>
                  </span>
                  <span class="nav-text">Testo tabelle</span>
                </div>
                <button
                  type="button"
                  class="font-scale-badge"
                  class:is-custom={isCustomScale}
                  title={isCustomScale ? "Tocca per ripristinare al 100%" : "Dimensione predefinita (100%)"}
                  aria-label="Dimensione testo tabelle {fontScalePercent}%, tocca per ripristinare al 100%"
                  on:click={resetTableFontScale}
                >
                  <span class="badge-value">{fontScalePercent}%</span>
                  {#if isCustomScale}
                    <span class="badge-reset-icon" aria-hidden="true">↺</span>
                  {/if}
                </button>
              </div>

              <div class="font-control-track-row">
                <button
                  type="button"
                  class="font-step-btn step-down"
                  aria-label="Riduci testo tabelle"
                  title="Riduci testo tabelle"
                  disabled={$tableFontScale <= TABLE_FONT_SCALE_MIN + 0.001}
                  on:click={decreaseTableFontScale}
                >
                  <span class="step-label step-label-sm">A−</span>
                </button>

                <div class="font-slider-wrap">
                  <input
                    type="range"
                    class="font-range-slider"
                    min={TABLE_FONT_SCALE_MIN}
                    max={TABLE_FONT_SCALE_MAX}
                    step={TABLE_FONT_SCALE_STEP}
                    value={$tableFontScale}
                    style="--progress: {fontScaleProgress}%"
                    aria-label="Cursore dimensione testo tabelle"
                    aria-valuemin={Math.round(TABLE_FONT_SCALE_MIN * 100)}
                    aria-valuemax={Math.round(TABLE_FONT_SCALE_MAX * 100)}
                    aria-valuenow={fontScalePercent}
                    aria-valuetext="{fontScalePercent}%"
                    on:input={handleFontSliderInput}
                  />
                  <div class="font-slider-ticks" aria-hidden="true">
                    {#each fontScaleSteps as stepVal}
                      <span
                        class="tick-dot"
                        class:is-default={Math.abs(stepVal - TABLE_FONT_SCALE_DEFAULT) < 0.001}
                        class:is-filled={stepVal <= $tableFontScale + 0.001}
                        class:is-current={Math.abs(stepVal - $tableFontScale) < 0.001}
                      ></span>
                    {/each}
                  </div>
                </div>

                <button
                  type="button"
                  class="font-step-btn step-up"
                  aria-label="Ingrandisci testo tabelle"
                  title="Ingrandisci testo tabelle"
                  disabled={$tableFontScale >= TABLE_FONT_SCALE_MAX - 0.001}
                  on:click={increaseTableFontScale}
                >
                  <span class="step-label step-label-lg">A+</span>
                </button>
              </div>
            </div>
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
    background: rgba(15, 23, 42, 0.45);
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
    width: min(85vw, 310px);
    background: var(--brand-surface-card);
    border-right: 1px solid var(--brand-border);
    box-shadow: 6px 0 32px rgba(0, 0, 0, 0.25);
    display: block;
    padding: calc(0.85rem + env(safe-area-inset-top, 0px)) 0.85rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
    z-index: 99999;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
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
    gap: 0.65rem;
  }

  .brand-logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }

  .brand-meta {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1.2;
  }

  .brand-sub {
    font-size: 0.85rem;
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
    gap: 0.65rem;
    padding: 0.5rem 0.65rem;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    border-radius: 8px;
    margin-bottom: 0.65rem;
    flex-shrink: 0;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--brand-primary);
    color: white;
    font-weight: 700;
    font-size: 0.95rem;
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
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--brand-primary);
    letter-spacing: 0.04em;
  }

  .user-email {
    font-size: 0.9rem;
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
    font-size: 0.8rem;
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
    padding: 0.72rem 0.8rem;
    border-radius: 8px;
    color: var(--brand-text);
    text-decoration: none;
    font-size: 1.05rem;
    font-weight: 500;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    box-sizing: border-box;
    line-height: 1.25;
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
    width: 20px;
    height: 20px;
    margin-right: 0.65rem;
    flex-shrink: 0;
  }

  .nav-icon :global(.icon) {
    width: 18px;
    height: 18px;
  }

  .nav-text {
    display: inline-block;
    vertical-align: middle;
  }

  .nav-link.active .nav-icon,
  .nav-link:hover .nav-icon {
    color: var(--brand-primary);
  }

  .nav-icon.active-bell {
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

  /* Modern Table Font Scale Control Card (modern-web-guidance) */
  .font-control-card {
    --control-accent: var(--brand-primary);
    --control-track-bg: color-mix(in oklab, var(--brand-border) 82%, var(--brand-surface-subtle));
    --control-surface: color-mix(in oklab, var(--brand-surface-subtle) 65%, var(--brand-surface-card));
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.68rem 0.78rem 0.72rem;
    margin: 0.15rem 0;
    border-radius: 12px;
    background: var(--control-surface);
    border: 1px solid color-mix(in oklab, var(--brand-border) 85%, transparent);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    box-sizing: border-box;
    touch-action: manipulation;
  }

  .font-control-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .font-control-label {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    color: var(--brand-text);
    font-size: 0.98rem;
    font-weight: 500;
  }

  .font-control-label .font-icon {
    margin-right: 0.55rem;
    color: var(--brand-primary);
    background: color-mix(in oklab, var(--brand-primary) 12%, transparent);
    width: 26px;
    height: 26px;
    border-radius: 7px;
  }

  .font-scale-badge {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.22rem 0.52rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--brand-border) 90%, transparent);
    background: var(--brand-surface-card);
    color: var(--brand-text-muted);
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
    line-height: 1.1;
    cursor: pointer;
    transition:
      background-color 180ms ease,
      color 180ms ease,
      border-color 180ms ease,
      transform 220ms var(--spring-easing, ease);
  }

  .font-scale-badge.is-custom {
    background: color-mix(in oklab, var(--brand-primary) 13%, var(--brand-surface-card));
    border-color: color-mix(in oklab, var(--brand-primary) 35%, var(--brand-border));
    color: var(--brand-primary);
  }

  .font-scale-badge:hover {
    border-color: color-mix(in oklab, var(--brand-primary) 50%, var(--brand-border));
    color: var(--brand-primary);
  }

  .font-scale-badge:active {
    transform: scale(0.95);
  }

  .font-scale-badge:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }

  .badge-reset-icon {
    font-size: 0.8rem;
    line-height: 1;
    opacity: 0.85;
  }

  .font-control-track-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.55rem;
  }

  .font-step-btn {
    appearance: none;
    width: 36px;
    height: 34px;
    padding: 0;
    margin: 0;
    border-radius: 9px;
    border: 1px solid var(--brand-border);
    background: var(--brand-surface-card);
    color: var(--brand-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    transition:
      background-color 150ms ease,
      color 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease,
      transform 220ms var(--spring-easing, ease);
  }

  .font-step-btn:hover:not(:disabled) {
    background: color-mix(in oklab, var(--brand-primary) 10%, var(--brand-surface-card));
    border-color: color-mix(in oklab, var(--brand-primary) 42%, var(--brand-border));
    color: var(--brand-primary);
  }

  .font-step-btn:active:not(:disabled) {
    transform: scale(0.92);
  }

  .font-step-btn:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }

  .font-step-btn:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    box-shadow: none;
  }

  .step-label {
    display: inline-block;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    text-box: trim-both cap alphabetic;
  }

  .step-label-sm {
    font-size: 0.82rem;
  }

  .step-label-lg {
    font-size: 0.96rem;
  }

  .font-slider-wrap {
    position: relative;
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 2px;
  }

  .font-range-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    margin: 0;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      var(--control-accent) 0%,
      var(--control-accent) var(--progress, 42.85%),
      var(--control-track-bg) var(--progress, 42.85%),
      var(--control-track-bg) 100%
    );
    outline: none;
    cursor: pointer;
    position: relative;
    z-index: 2;
    touch-action: pan-x;
  }

  .font-range-slider:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 5px;
  }

  .font-range-slider::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 999px;
    background: transparent;
  }

  .font-range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    margin-top: -6px;
    border-radius: 50%;
    background: #ffffff;
    border: 2.5px solid var(--control-accent);
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.28);
    cursor: grab;
    transition:
      transform 220ms var(--spring-easing, ease),
      box-shadow 180ms ease,
      background-color 180ms ease;
  }

  .font-range-slider:hover::-webkit-slider-thumb {
    transform: scale(1.12);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--control-accent) 18%, transparent);
  }

  .font-range-slider:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: scale(1.18);
    background: var(--control-accent);
    border-color: #ffffff;
    box-shadow: 0 0 0 6px color-mix(in oklab, var(--control-accent) 24%, transparent);
  }

  .font-range-slider::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    background: transparent;
  }

  .font-range-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    border: 2.5px solid var(--control-accent);
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.28);
    cursor: grab;
    box-sizing: border-box;
    transition:
      transform 220ms var(--spring-easing, ease),
      box-shadow 180ms ease,
      background-color 180ms ease;
  }

  .font-range-slider:hover::-moz-range-thumb {
    transform: scale(1.12);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--control-accent) 18%, transparent);
  }

  .font-range-slider:active::-moz-range-thumb {
    cursor: grabbing;
    transform: scale(1.18);
    background: var(--control-accent);
    border-color: #ffffff;
  }

  .font-slider-ticks {
    position: absolute;
    inset-inline: 9px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    z-index: 1;
  }

  .tick-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: color-mix(in oklab, var(--brand-text-muted) 45%, transparent);
    transition: transform 150ms ease, background-color 150ms ease;
  }

  .tick-dot.is-default {
    width: 5px;
    height: 8px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--brand-text-muted) 65%, transparent);
  }

  .tick-dot.is-filled {
    background: color-mix(in oklab, var(--control-accent) 75%, #ffffff);
  }

  .tick-dot.is-current {
    opacity: 0;
  }

  @media (forced-colors: active) {
    .font-step-btn,
    .font-scale-badge {
      border: 1px solid ButtonText;
    }

    .font-range-slider {
      forced-color-adjust: auto;
    }
  }

  .drawer-footer {
    padding-top: 0.75rem;
    margin-top: 0.75rem;
    border-top: 1px solid var(--brand-border);
    display: block;
    color: var(--brand-text-muted);
    font-size: 0.8rem;
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
