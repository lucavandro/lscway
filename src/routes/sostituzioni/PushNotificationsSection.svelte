<script>
  import { onMount, createEventDispatcher } from "svelte";
  import {
    pushSubscriptionStore,
    checkPushStatus,
    subscribeToPush,
    unsubscribeFromPush,
    fetchPushSubstitutions
  } from "$lib/pushNotifications.js";
  import { userEmail } from "$lib/stores.js";

  const dispatch = createEventDispatcher();

  export let initiallyOpen = false;

  let isOpen = initiallyOpen;
  let showIosInstructions = false;
  let refreshingPush = false;

  $: supported = $pushSubscriptionStore.supported;
  $: permission = $pushSubscriptionStore.permission;
  $: subscribed = $pushSubscriptionStore.subscribed;
  $: loading = $pushSubscriptionStore.loading;
  $: error = $pushSubscriptionStore.error;
  $: success = $pushSubscriptionStore.success;
  $: isIos = $pushSubscriptionStore.isIos;
  $: isStandalone = $pushSubscriptionStore.isStandalone;

  // Calcolo dei 3 requisiti: Browser, Permesso, Dispositivo
  $: browserOk = Boolean(supported);
  $: permissionOk = permission === "granted";
  $: deviceOk = Boolean(subscribed);

  $: okCount = (browserOk ? 1 : 0) + (permissionOk ? 1 : 0) + (deviceOk ? 1 : 0);

  onMount(() => {
    checkPushStatus().catch(() => {});
  });

  function toggleCollapse() {
    isOpen = !isOpen;
  }

  async function handleSubscribe() {
    try {
      await subscribeToPush();
      dispatch("subscribed");
    } catch (err) {
      // L'errore è già gestito nello store
    }
  }

  async function handleUnsubscribe() {
    try {
      await unsubscribeFromPush();
      dispatch("unsubscribed");
    } catch (err) {
      // L'errore è già gestito nello store
    }
  }

  async function handleRefreshPublished() {
    if (refreshingPush) return;
    refreshingPush = true;
    try {
      const data = await fetchPushSubstitutions();
      dispatch("pushSubstitutionsLoaded", data);
    } catch (err) {
      console.warn("Errore aggiornamento sostituzioni push:", err);
      dispatch("refreshRequest");
    } finally {
      refreshingPush = false;
    }
  }

  function toggleIosHelp() {
    showIosInstructions = !showIosInstructions;
  }
</script>

<div class="push-card" class:is-open={isOpen}>
  <!-- Barra collapsible sempre visibile con indicatore dei 3 requisiti -->
  <button
    type="button"
    class="push-collapse-trigger"
    on:click={toggleCollapse}
    aria-expanded={isOpen}
    aria-controls="push-details-collapse"
  >
    <div class="trigger-left">
      <span class="trigger-bell-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </span>
      <span class="trigger-title">Notifiche Web Push</span>
    </div>

    <div class="trigger-right">
      <!-- 3 indicatori: Browser, Permesso, Dispositivo -->
      <div
        class="requirement-dots"
        title="Requisiti: Browser ({browserOk ? 'Supportato' : 'Non supportato'}), Permesso ({permission === 'granted' ? 'Concesso' : (permission === 'denied' ? 'Bloccato' : 'Non richiesto')}), Dispositivo ({deviceOk ? 'Attivo' : 'Non registrato'})"
        aria-label="Requisiti notifiche: {okCount} su 3 soddisfatti"
      >
        <span
          class="req-dot"
          class:dot-ok={browserOk}
          class:dot-err={!browserOk}
          title="Browser: {browserOk ? 'Supportato' : 'Non supportato'}"
        ></span>
        <span
          class="req-dot"
          class:dot-ok={permissionOk}
          class:dot-err={permission === 'denied'}
          class:dot-neutral={permission !== 'granted' && permission !== 'denied'}
          title="Permesso: {permission === 'granted' ? 'Concesso' : (permission === 'denied' ? 'Bloccato' : 'Non richiesto')}"
        ></span>
        <span
          class="req-dot"
          class:dot-ok={deviceOk}
          class:dot-neutral={!deviceOk}
          title="Dispositivo: {deviceOk ? 'Attivo e registrato' : 'Non registrato'}"
        ></span>
      </div>

      <!-- Badge riassuntivo del conteggio -->
      <span
        class="req-badge"
        class:badge-success={okCount === 3}
        class:badge-warning={okCount < 3 && permission !== 'denied' && browserOk}
        class:badge-danger={permission === 'denied' || !browserOk}
      >
        {#if okCount === 3}
          3/3 Attive
        {:else if permission === 'denied'}
          {okCount}/3 Bloccato
        {:else if !browserOk}
          {okCount}/3 Non supportato
        {:else}
          {okCount}/3 Incompleto
        {/if}
      </span>

      <!-- Indicatore freccia chevron -->
      <span class="chevron-indicator" class:open={isOpen} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
  </button>

  <!-- Contenuto dettagliato espandibile -->
  {#if isOpen}
    <div id="push-details-collapse" class="push-collapse-body" role="region" aria-labelledby="push-section-heading">
      <div class="push-card-header">
        <div class="push-icon-badge" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <div class="push-header-text">
          <h2 id="push-section-heading" class="push-title">Notifiche sostituzioni (Web Push)</h2>
          <p class="push-subtitle">
            Ricevi avvisi istantanei su questo dispositivo non appena ti viene assegnata una supplenza, anche quando l'app è in background o chiusa.
          </p>
        </div>
      </div>

      <!-- Griglia indicatori di stato dettagliati -->
      <div class="push-status-grid" role="region" aria-label="Stato del servizio notifiche">
        <!-- 1. Supporto Browser -->
        <div class="status-tile">
          <span class="status-label">Browser:</span>
          {#if supported}
            <span class="badge badge-success">
              <span class="badge-dot" aria-hidden="true"></span>
              Supportato
            </span>
          {:else}
            <span class="badge badge-danger">
              <span class="badge-dot" aria-hidden="true"></span>
              Non supportato
            </span>
          {/if}
        </div>

        <!-- 2. Permesso Browser -->
        <div class="status-tile">
          <span class="status-label">Permesso:</span>
          {#if permission === "granted"}
            <span class="badge badge-success">
              <span class="badge-dot" aria-hidden="true"></span>
              Concesso
            </span>
          {:else if permission === "denied"}
            <span class="badge badge-danger">
              <span class="badge-dot" aria-hidden="true"></span>
              Bloccato
            </span>
          {:else}
            <span class="badge badge-neutral">
              <span class="badge-dot" aria-hidden="true"></span>
              Non richiesto
            </span>
          {/if}
        </div>

        <!-- 3. Registrazione Dispositivo sul Server -->
        <div class="status-tile">
          <span class="status-label">Dispositivo:</span>
          {#if subscribed}
            <span class="badge badge-success badge-active">
              <span class="badge-dot" aria-hidden="true"></span>
              Attivo e registrato
            </span>
          {:else}
            <span class="badge badge-neutral">
              <span class="badge-dot" aria-hidden="true"></span>
              Non registrato
            </span>
          {/if}
        </div>
      </div>

      <!-- Avviso chiarimento: Permesso browser concesso MA dispositivo non registrato -->
      {#if permission === "granted" && !subscribed && supported}
        <div class="info-note" role="note">
          <span class="info-note-icon" aria-hidden="true">ℹ️</span>
          <p>
            Il permesso del browser è stato accordato, ma <strong>questo dispositivo non è ancora registrato</strong> sul server OrarioLSC. Clicca sul pulsante sottostante per abilitare la ricezione delle notifiche.
          </p>
        </div>
      {/if}

      {#if permission === "denied"}
        <div class="denied-note" role="alert">
          <span class="denied-icon" aria-hidden="true">⚠️</span>
          <p>
            I permessi risultano bloccati nelle preferenze del browser. Per attivare le notifiche, sblocca i permessi dalle impostazioni del sito o del browser e riprova.
          </p>
        </div>
      {/if}

      <!-- Messaggi di feedback successo o errore -->
      {#if success}
        <div class="feedback-banner banner-success" role="status" aria-live="polite">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{success}</span>
        </div>
      {/if}

      {#if error}
        <div class="feedback-banner banner-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      {/if}

      <!-- Azioni Pulsanti -->
      <div class="push-actions-row">
        {#if !subscribed}
          <button
            type="button"
            class="btn-push btn-push-subscribe"
            on:click={handleSubscribe}
            disabled={loading || !supported || permission === "denied"}
            aria-busy={loading}
          >
            {#if loading}
              <span class="btn-spinner" aria-hidden="true"></span>
              <span>Attivazione in corso...</span>
            {:else}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>Attiva notifiche su questo dispositivo</span>
            {/if}
          </button>
        {:else}
          <button
            type="button"
            class="btn-push btn-push-unsubscribe"
            on:click={handleUnsubscribe}
            disabled={loading}
            aria-busy={loading}
          >
            {#if loading}
              <span class="btn-spinner" aria-hidden="true"></span>
              <span>Disattivazione in corso...</span>
            {:else}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <span>Disattiva notifiche su questo dispositivo</span>
            {/if}
          </button>
        {/if}

        <button
          type="button"
          class="btn-push btn-push-sync"
          on:click={handleRefreshPublished}
          disabled={refreshingPush || loading}
          title="Sincronizza le sostituzioni pubblicate tramite le API push"
          aria-label="Sincronizza sostituzioni"
        >
          <svg
            class:spinning={refreshingPush}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>{refreshingPush ? "Sincronizzazione..." : "Sincronizza sostituzioni"}</span>
        </button>
      </div>

      <!-- Sezione Istruzioni iPhone e iPad (iOS / iPadOS 16.4+) -->
      <div class="ios-section-wrapper">
        <button
          type="button"
          class="ios-toggle-btn"
          on:click={toggleIosHelp}
          aria-expanded={showIosInstructions}
          aria-controls="ios-instructions-content"
        >
          <span class="ios-toggle-title">
            <span class="apple-icon" aria-hidden="true">🍎</span>
            Istruzioni per iPhone e iPad (iOS 16.4+)
          </span>
          <span class="ios-toggle-indicator" aria-hidden="true">{showIosInstructions ? "▲" : "▼"}</span>
        </button>

        {#if showIosInstructions || (isIos && !isStandalone)}
          <div id="ios-instructions-content" class="ios-content-box">
            <p class="ios-step-intro">
              Su <strong>iPhone e iPad (con iOS/iPadOS 16.4 o successivo)</strong>, Apple consente la ricezione delle notifiche Web Push solo per le applicazioni aggiunte alla schermata Home:
            </p>
            <ol class="ios-steps-list">
              <li>
                Apri questo sito in <strong>Safari</strong> e tocca il pulsante <strong>Condividi</strong> (icona del quadrato con la freccia rivolta verso l'alto).
              </li>
              <li>
                Scorri le opzioni verso il basso e tocca <strong>"Aggiungi alla schermata Home"</strong>.
              </li>
              <li>
                Conferma toccando <strong>"Aggiungi"</strong> in alto a destra.
              </li>
              <li>
                Chiudi Safari, apri l'applicazione dall'icona <strong>WAY Cortese</strong> appena creata sulla Home e torna in questa pagina per premere <em>"Attiva notifiche su questo dispositivo"</em>.
              </li>
            </ol>
            {#if isIos && isStandalone}
              <div class="ios-standalone-badge">
                ✓ Applicazione avviata dalla schermata Home: puoi procedere con l'attivazione!
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .push-card {
    background: transparent;
    border: none;
    border-top: 1px solid var(--brand-border);
    margin: 0;
    padding: 0;
    transition: background-color 0.2s ease;
  }

  /* Trigger collapsible */
  .push-collapse-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem 1.25rem;
    background: var(--brand-surface-subtle);
    border: none;
    cursor: pointer;
    text-align: left;
    gap: 0.75rem;
    color: var(--brand-text);
    font-family: inherit;
    font-size: 0.875rem;
    transition: background-color 0.15s ease;
  }

  .push-collapse-trigger:hover {
    background: color-mix(in srgb, var(--brand-surface-subtle) 85%, var(--brand-primary) 15%);
  }

  .push-collapse-trigger:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: -2px;
  }

  .trigger-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 600;
    min-width: 0;
  }

  .trigger-bell-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-primary);
    flex-shrink: 0;
  }

  .trigger-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trigger-right {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-shrink: 0;
  }

  /* Indicatori requisiti (3 pallini) */
  .requirement-dots {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 4px;
  }

  .req-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    transition: background-color 0.2s ease, transform 0.2s ease;
  }

  .req-dot.dot-ok {
    background: #10b981;
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
  }

  .req-dot.dot-err {
    background: #ef4444;
  }

  .req-dot.dot-neutral {
    background: #94a3b8;
  }

  /* Badge conteggio requisiti */
  .req-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .req-badge.badge-success {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  :global([data-theme="dark"]) .req-badge.badge-success {
    background: rgba(16, 185, 129, 0.22);
    color: #34d399;
  }

  .req-badge.badge-warning {
    background: rgba(245, 158, 11, 0.14);
    color: #d97706;
  }

  :global([data-theme="dark"]) .req-badge.badge-warning {
    background: rgba(245, 158, 11, 0.22);
    color: #fbbf24;
  }

  .req-badge.badge-danger {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
  }

  :global([data-theme="dark"]) .req-badge.badge-danger {
    background: rgba(239, 68, 68, 0.22);
    color: #f87171;
  }

  /* Freccia indicatore */
  .chevron-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-text-muted);
    transition: transform 0.2s ease;
  }

  .chevron-indicator.open {
    transform: rotate(180deg);
  }

  /* Corpo espandibile */
  .push-collapse-body {
    padding: 1.25rem;
    border-top: 1px solid var(--brand-border);
    background: var(--brand-surface-card);
    animation: slide-down 0.2s ease-out;
  }

  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .push-card-header {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .push-icon-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: var(--brand-active-glow);
    color: var(--brand-primary);
    flex-shrink: 0;
  }

  .push-header-text {
    flex: 1;
  }

  .push-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--brand-text);
    margin: 0 0 0.25rem 0;
  }

  .push-subtitle {
    font-size: 0.875rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.45;
  }

  /* Griglia di stato */
  .push-status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.65rem;
    background: var(--brand-surface-subtle);
    padding: 0.85rem;
    border-radius: 8px;
    border: 1px solid var(--brand-border);
    margin-bottom: 1rem;
  }

  .status-tile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .status-label {
    font-weight: 600;
    color: var(--brand-text);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .badge-success {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  :global([data-theme="dark"]) .badge-success {
    background: rgba(16, 185, 129, 0.22);
    color: #34d399;
  }

  .badge-danger {
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
  }

  :global([data-theme="dark"]) .badge-danger {
    background: rgba(239, 68, 68, 0.22);
    color: #f87171;
  }

  .badge-neutral {
    background: rgba(100, 116, 139, 0.12);
    color: var(--brand-text-muted);
  }

  .badge-active {
    font-weight: 700;
  }

  /* Note banner */
  .info-note,
  .denied-note {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    line-height: 1.45;
    margin-bottom: 1rem;
  }

  .info-note {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.25);
    color: var(--brand-text);
  }

  .denied-note {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: var(--brand-text);
  }

  .info-note p,
  .denied-note p {
    margin: 0;
    flex: 1;
  }

  /* Feedback banners */
  .feedback-banner {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .banner-success {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #047857;
  }

  :global([data-theme="dark"]) .banner-success {
    color: #6ee7b7;
  }

  .banner-error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #b91c1c;
  }

  :global([data-theme="dark"]) .banner-error {
    color: #fca5a5;
  }

  /* Action buttons */
  .push-actions-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .btn-push {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1.15rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease, opacity 0.15s ease, transform 0.1s ease;
    border: 1px solid transparent;
    min-height: 44px;
  }

  .btn-push:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-push-subscribe {
    background: var(--brand-primary);
    color: #ffffff;
  }

  .btn-push-subscribe:hover:not(:disabled) {
    background: var(--brand-primary-hover);
  }

  .btn-push-unsubscribe {
    background: transparent;
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }

  .btn-push-unsubscribe:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-push-sync {
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text);
  }

  .btn-push-sync:hover:not(:disabled) {
    background: var(--brand-border);
  }

  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinning {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* iOS section */
  .ios-section-wrapper {
    margin-top: 0.75rem;
    border-top: 1px dashed var(--brand-border);
    padding-top: 0.75rem;
  }

  .ios-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    padding: 0.4rem 0.2rem;
    color: var(--brand-text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
  }

  .ios-toggle-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .ios-toggle-indicator {
    font-size: 0.75rem;
    color: var(--brand-text-muted);
  }

  .ios-content-box {
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    margin-top: 0.5rem;
    font-size: 0.825rem;
    line-height: 1.5;
    color: var(--brand-text);
  }

  .ios-step-intro {
    margin: 0 0 0.5rem 0;
  }

  .ios-steps-list {
    margin: 0;
    padding-left: 1.25rem;
  }

  .ios-steps-list li {
    margin-bottom: 0.35rem;
  }

  .ios-standalone-badge {
    margin-top: 0.6rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
    font-weight: 600;
    font-size: 0.8rem;
  }

  :global([data-theme="dark"]) .ios-standalone-badge {
    color: #34d399;
  }

  @media (max-width: 600px) {
    .push-collapse-trigger {
      padding: 0.65rem 0.9rem;
    }
    .trigger-title {
      font-size: 0.825rem;
    }
    .push-actions-row {
      flex-direction: column;
      align-items: stretch;
    }
    .btn-push {
      width: 100%;
    }
  }
</style>
