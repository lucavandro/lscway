<script>
  import { userEmail, notificationPermission, notificationsEnabled, isTeacher } from "$lib/stores.js";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { enableNotifications } from "$lib/notifications.js";
  import { base } from "$app/paths";
  import {
    fetchPersonalSubstitutions,
    acknowledgeSubstitution,
    unreadSubstitutionsCount,
    markSubstitutionAcknowledgedLocally,
    cleanupPersonalSubstitutions
  } from "$lib/personalSubstitutions.js";

  let loading = true;
  let error = null;
  let errorCode = null;
  let pollingInterval = null;
  let isPollingInFlight = false;

  let teacherName = "";
  let teacherEmail = "";
  let substitutions = [];
  let submittingIds = new Set();
  let itemErrors = {};

  function isAcknowledged(sub) {
    return Boolean(sub.presaVisione?.data || sub.presaVisione?.stato === "presa_visione");
  }

  $: pendingSubstitutions = substitutions.filter((s) => !isAcknowledged(s));
  $: confirmedSubstitutions = substitutions.filter((s) => isAcknowledged(s));
  $: unreadCount = pendingSubstitutions.length;

  // Sincronizza il contatore unread con lo store globale per badge e menu
  $: unreadSubstitutionsCount.set(unreadCount);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("it-IT");
      }
    } catch (e) {}
    return dateStr;
  }

  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return "";
    try {
      const d = new Date(dateTimeStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    } catch (e) {}
    return dateTimeStr;
  }

  async function loadSubstitutions(isBackground = false) {
    if (!$userEmail) return;
    if (isPollingInFlight) return;
    isPollingInFlight = true;

    if (!isBackground) {
      loading = true;
      error = null;
      errorCode = null;
    }

    try {
      const data = await fetchPersonalSubstitutions();
      if (data && Array.isArray(data.substitutions)) {
        substitutions = data.substitutions;
        teacherName = data.teacherName || "";
        teacherEmail = data.teacherEmail || $userEmail || "";
        error = null;
        errorCode = null;
      } else {
        error = "Formato dati non valido ricevuto dal server.";
      }
    } catch (err) {
      console.error("Errore fetch sostituzioni:", err);
      // Mantieni i dati correnti se si tratta solo di un fallimento di polling in background
      if (!isBackground || substitutions.length === 0) {
        error = err.message || "Errore nel caricamento delle sostituzioni.";
        errorCode = err.status || null;
      }
    } finally {
      loading = false;
      isPollingInFlight = false;
    }
  }

  async function handleAcknowledge(id) {
    if (submittingIds.has(id)) return;

    submittingIds.add(id);
    submittingIds = new Set(submittingIds);
    itemErrors[id] = null;
    itemErrors = { ...itemErrors };

    try {
      await acknowledgeSubstitution(id);

      // Aggiorna lo stato locale
      const nowIso = new Date().toISOString();
      substitutions = substitutions.map((sub) => {
        if (String(sub.id) === String(id)) {
          return {
            ...sub,
            presaVisione: {
              ...(sub.presaVisione || {}),
              stato: "presa_visione",
              data: nowIso
            }
          };
        }
        return sub;
      });

      markSubstitutionAcknowledgedLocally(id);
    } catch (err) {
      console.error(`Errore presa visione per sostituzione ${id}:`, err);
      itemErrors[id] = err.message || "Errore durante la registrazione della presa visione.";
      itemErrors = { ...itemErrors };
    } finally {
      submittingIds.delete(id);
      submittingIds = new Set(submittingIds);
    }
  }

  async function handleEnableNotifications() {
    await enableNotifications();
  }

  onMount(() => {
    if (!$userEmail) {
      goto(`${base}/`);
      return;
    }

    loadSubstitutions();

    // Polling ogni 60 secondi
    pollingInterval = setInterval(() => {
      loadSubstitutions(true);
    }, 60000);
  });

  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  });
</script>

<svelte:head>
  <title>Sostituzioni - WAY Cortese</title>
</svelte:head>

<div class="sostituzioni-page">
  {#if $userEmail}
    <!-- Profilo docente e contatore notifiche -->
    <header class="teacher-header-card">
      <div class="teacher-meta">
        <div class="teacher-avatar" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="teacher-info">
          <h1 class="page-title">Sostituzioni Personali</h1>
          <p class="teacher-email">
            {#if teacherName}<strong>{teacherName}</strong> • {/if}
            {teacherEmail || $userEmail}
          </p>
        </div>
      </div>

      <div class="header-actions">
        <div
          class="unread-pill"
          class:has-unread={unreadCount > 0}
          role="status"
          aria-live="polite"
          aria-label="{unreadCount} {unreadCount === 1 ? 'sostituzione' : 'sostituzioni'} senza presa visione"
        >
          <span class="unread-icon" aria-hidden="true">{unreadCount > 0 ? "🔔" : "✓"}</span>
          <span class="unread-text">
            {#if unreadCount > 0}
              <strong>{unreadCount}</strong> da confermare
            {:else}
              Tutte confermate
            {/if}
          </span>
        </div>

        <button
          type="button"
          class="btn-refresh"
          on:click={() => loadSubstitutions(false)}
          title="Aggiorna sostituzioni"
          aria-label="Aggiorna elenco sostituzioni"
          disabled={loading || isPollingInFlight}
        >
          <svg
            class:spinning={loading || isPollingInFlight}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Aggiorna</span>
        </button>
      </div>
    </header>

    <!-- Banner Notifiche push -->
    {#if !$notificationPermission || !$notificationsEnabled}
      <div class="banner-card notification-banner">
        <div class="banner-icon-wrap" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <div class="banner-content">
          <h2 class="banner-title">Abilita le notifiche push</h2>
          <p class="banner-text">
            Ricevi un avviso immediato non appena ti viene assegnata una nuova sostituzione da confermare.
          </p>
          <button type="button" on:click={handleEnableNotifications} class="banner-action-btn">
            Attiva notifiche
          </button>
        </div>
      </div>
    {/if}

    <!-- Banner Errore -->
    {#if error}
      <div class="status-banner error" role="alert">
        <div class="error-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div class="error-text">
            <strong>{error}</strong>
            {#if errorCode === 401}
              <p>La sessione di accesso con Google non è attiva o è scaduta.</p>
            {:else if errorCode === 403}
              <p>L'account Google <strong>{$userEmail}</strong> non è associato ad un profilo docente attivo autorizzato.</p>
            {/if}
          </div>
        </div>
        {#if errorCode === 401}
          <a href="{base}/signin" class="retry-btn">Accedi di nuovo</a>
        {:else}
          <button type="button" on:click={() => loadSubstitutions(false)} class="retry-btn">
            Riprova
          </button>
        {/if}
      </div>
    {/if}

    <!-- Contenuto principale diviso in 2 parti: 1. Da confermare, 2. Confermate -->
    {#if loading && substitutions.length === 0}
      <div class="loading-state-card" role="status">
        <div class="spinner" aria-hidden="true"></div>
        <p>Caricamento delle sostituzioni personali in corso...</p>
      </div>
    {:else if substitutions.length === 0}
      <div class="empty-state-card">
        <div class="empty-icon" aria-hidden="true">📋</div>
        <h3>Nessuna sostituzione pubblicata</h3>
        <p>Al momento non risultano ore di sostituzione pubblicate per te.</p>
      </div>
    {:else}
      <!-- 1. Da confermare -->
      <section class="section-container" aria-label="Sostituzioni da confermare">
        <div class="section-header">
          <h2 class="section-heading">Da confermare</h2>
          <span class="count-pill count-pill-pending" aria-label="{pendingSubstitutions.length} sostituzioni da confermare">
            {pendingSubstitutions.length}
          </span>
        </div>

        {#if pendingSubstitutions.length > 0}
          <div class="cards-grid">
            {#each pendingSubstitutions as sostituzione (sostituzione.id)}
              {@const isSubmitting = submittingIds.has(sostituzione.id)}
              <article class="sub-card card-pending">
                <div class="sub-card-header">
                  <div class="slot-info">
                    <span class="slot-hour">{sostituzione.ora || "-"}</span>
                  </div>
                  <div class="header-badges">
                    {#if sostituzione.data}
                      <span class="date-badge">{formatDate(sostituzione.data)}</span>
                    {/if}
                    <span class="status-badge">Da confermare</span>
                  </div>
                </div>

                <div class="sub-details">
                  <div class="detail-row">
                    <span class="detail-label">Classe:</span>
                    <span class="detail-value class-value">
                      {sostituzione.classe?.nome || sostituzione.classe || "-"}
                    </span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Materia:</span>
                    <span class="detail-value">
                      {sostituzione.materia?.nome || sostituzione.materia?.abbreviazione || sostituzione.materia || "Sostituzione"}
                    </span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Aula:</span>
                    <span class="detail-value">{sostituzione.aula?.nome || sostituzione.aula || "-"}</span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Docente sostituito:</span>
                    <span class="detail-value teacher-absent">
                      {sostituzione.docenteAssente?.nome || sostituzione.docenteAssente?.shortName || sostituzione.docenteAssente || "-"}
                    </span>
                  </div>

                  {#if sostituzione.tipologia}
                    <div class="detail-row">
                      <span class="detail-label">Tipologia:</span>
                      <span class="detail-value tipologia-tag">{sostituzione.tipologia}</span>
                    </div>
                  {/if}

                  {#if sostituzione.noteDocenti}
                    <div class="note-box note-docenti">
                      <span class="note-label">Note docenti:</span>
                      <span class="note-body">{sostituzione.noteDocenti}</span>
                    </div>
                  {/if}

                  {#if sostituzione.noteStudenti}
                    <div class="note-box note-studenti">
                      <span class="note-label">Note studenti:</span>
                      <span class="note-body">{sostituzione.noteStudenti}</span>
                    </div>
                  {/if}

                  {#if !sostituzione.noteDocenti && !sostituzione.noteStudenti && sostituzione.note}
                    <div class="note-box">
                      <span class="note-label">Note:</span>
                      <span class="note-body">{sostituzione.note}</span>
                    </div>
                  {/if}

                  {#if itemErrors[sostituzione.id]}
                    <div class="item-error-msg" role="alert">
                      <span>{itemErrors[sostituzione.id]}</span>
                    </div>
                  {/if}
                </div>

                <!-- Footer Presa Visione -->
                <footer class="sub-card-footer">
                  <div class="ack-action-container">
                    <button
                      type="button"
                      class="btn-acknowledge"
                      on:click={() => handleAcknowledge(sostituzione.id)}
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {#if isSubmitting}
                        <span class="button-spinner" aria-hidden="true"></span>
                        <span>Registrazione in corso...</span>
                      {:else}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Conferma presa visione</span>
                      {/if}
                    </button>
                  </div>
                </footer>
              </article>
            {/each}
          </div>
        {:else}
          <div class="sub-empty-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Nessuna sostituzione da confermare. Tutte le sostituzioni risultano visionate.</span>
          </div>
        {/if}
      </section>

      <!-- 2. Confermate -->
      <section class="section-container" aria-label="Sostituzioni confermate">
        <div class="section-header">
          <h2 class="section-heading">Confermate</h2>
          <span class="count-pill count-pill-confirmed" aria-label="{confirmedSubstitutions.length} sostituzioni confermate">
            {confirmedSubstitutions.length}
          </span>
        </div>

        {#if confirmedSubstitutions.length > 0}
          <div class="cards-grid">
            {#each confirmedSubstitutions as sostituzione (sostituzione.id)}
              <article class="sub-card card-acknowledged">
                <div class="sub-card-header">
                  <div class="slot-info">
                    <span class="slot-hour">{sostituzione.ora || "-"}</span>
                  </div>
                  <div class="header-badges">
                    {#if sostituzione.data}
                      <span class="date-badge">{formatDate(sostituzione.data)}</span>
                    {/if}
                    <span class="status-badge badge-confirmed">Confermata</span>
                  </div>
                </div>

                <div class="sub-details">
                  <div class="detail-row">
                    <span class="detail-label">Classe:</span>
                    <span class="detail-value class-value">
                      {sostituzione.classe?.nome || sostituzione.classe || "-"}
                    </span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Materia:</span>
                    <span class="detail-value">
                      {sostituzione.materia?.nome || sostituzione.materia?.abbreviazione || sostituzione.materia || "Sostituzione"}
                    </span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Aula:</span>
                    <span class="detail-value">{sostituzione.aula?.nome || sostituzione.aula || "-"}</span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Docente sostituito:</span>
                    <span class="detail-value teacher-absent">
                      {sostituzione.docenteAssente?.nome || sostituzione.docenteAssente?.shortName || sostituzione.docenteAssente || "-"}
                    </span>
                  </div>

                  {#if sostituzione.tipologia}
                    <div class="detail-row">
                      <span class="detail-label">Tipologia:</span>
                      <span class="detail-value tipologia-tag">{sostituzione.tipologia}</span>
                    </div>
                  {/if}

                  {#if sostituzione.noteDocenti}
                    <div class="note-box note-docenti">
                      <span class="note-label">Note docenti:</span>
                      <span class="note-body">{sostituzione.noteDocenti}</span>
                    </div>
                  {/if}

                  {#if sostituzione.noteStudenti}
                    <div class="note-box note-studenti">
                      <span class="note-label">Note studenti:</span>
                      <span class="note-body">{sostituzione.noteStudenti}</span>
                    </div>
                  {/if}

                  {#if !sostituzione.noteDocenti && !sostituzione.noteStudenti && sostituzione.note}
                    <div class="note-box">
                      <span class="note-label">Note:</span>
                      <span class="note-body">{sostituzione.note}</span>
                    </div>
                  {/if}

                  {#if itemErrors[sostituzione.id]}
                    <div class="item-error-msg" role="alert">
                      <span>{itemErrors[sostituzione.id]}</span>
                    </div>
                  {/if}
                </div>

                <!-- Footer Presa Visione -->
                <footer class="sub-card-footer">
                  <div class="ack-confirmed" aria-label="Presa visione registrata">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div class="ack-confirmed-meta">
                      <span class="ack-title">Presa visione registrata</span>
                      {#if sostituzione.presaVisione?.data}
                        <span class="ack-timestamp">{formatDateTime(sostituzione.presaVisione.data)}</span>
                      {/if}
                    </div>
                  </div>
                </footer>
              </article>
            {/each}
          </div>
        {:else}
          <div class="sub-empty-box">
            <span>Nessuna sostituzione confermata in archivio.</span>
          </div>
        {/if}
      </section>
    {/if}
  {:else}
    <div class="empty-state-card access-restricted">
      <div class="empty-icon" aria-hidden="true">🔒</div>
      <h3>Accesso riservato</h3>
      <p>Effettua l'accesso con il tuo account istituzionale Google per consultare le tue sostituzioni personali.</p>
      <a href="{base}/signin" class="login-link-btn">Vai al login con Google</a>
    </div>
  {/if}
</div>

<style>
  .sostituzioni-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    animation: fade-in 0.2s ease-out;
  }

  .teacher-header-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .teacher-meta {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .teacher-avatar {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .page-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .teacher-email {
    font-size: 0.85rem;
    color: var(--brand-text-muted);
    margin: 0.15rem 0 0 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .unread-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.8rem;
    border-radius: 9999px;
    font-size: 0.82rem;
    font-weight: 600;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text-muted);
    transition: all 0.2s ease;
  }

  .unread-pill.has-unread {
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.4);
    color: #d97706;
  }

  :global([data-theme="dark"]) .unread-pill.has-unread {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.2);
  }

  .btn-refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-refresh:hover:not(:disabled) {
    background: color-mix(in srgb, var(--brand-primary) 10%, var(--brand-surface-subtle));
  }

  .btn-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .banner-card {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1.25rem;
    border-radius: 14px;
    background: color-mix(in srgb, var(--brand-primary) 8%, var(--brand-surface-card));
    border: 1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent);
  }

  .banner-icon-wrap {
    color: var(--brand-primary);
    padding: 0.5rem;
    background: color-mix(in srgb, var(--brand-primary) 15%, transparent);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .banner-content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
  }

  .banner-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .banner-text {
    font-size: 0.85rem;
    color: var(--brand-text-muted);
    margin: 0;
    line-height: 1.4;
  }

  .banner-action-btn {
    align-self: flex-start;
    margin-top: 0.25rem;
    padding: 0.45rem 0.95rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    background: var(--brand-primary);
    color: white;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .banner-action-btn:hover {
    background: var(--brand-primary-hover);
  }

  .status-banner.error {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    color: #ef4444;
  }

  .error-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .error-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem;
  }

  .error-text p {
    margin: 0;
    font-size: 0.82rem;
    opacity: 0.9;
  }

  .retry-btn {
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    background: #ef4444;
    color: white;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
  }

  .section-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .section-heading {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .count-pill {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.15rem 0.55rem;
    border-radius: 9999px;
    background: var(--brand-surface-subtle);
    border: 1px solid var(--brand-border);
    color: var(--brand-text-muted);
  }

  .count-pill-pending {
    background: rgba(245, 158, 11, 0.12);
    color: #d97706;
    border-color: rgba(245, 158, 11, 0.3);
  }

  :global([data-theme="dark"]) .count-pill-pending {
    color: #fbbf24;
  }

  .count-pill-confirmed {
    background: rgba(34, 197, 94, 0.12);
    color: #16a34a;
    border-color: rgba(34, 197, 94, 0.3);
  }

  :global([data-theme="dark"]) .count-pill-confirmed {
    color: #4ade80;
  }

  .sub-empty-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    background: var(--brand-surface-card);
    border: 1px dashed var(--brand-border);
    border-radius: 12px;
    color: var(--brand-text-muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .sub-empty-box svg {
    color: #16a34a;
    flex-shrink: 0;
  }

  :global([data-theme="dark"]) .sub-empty-box svg {
    color: #4ade80;
  }

  .loading-state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1.5rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    color: var(--brand-text-muted);
    font-size: 0.9rem;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid color-mix(in srgb, var(--brand-primary) 20%, transparent);
    border-top-color: var(--brand-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .sub-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: border-color 0.15s ease, transform 0.15s ease;
    container-type: inline-size;
  }

  .sub-card.card-pending {
    border-color: rgba(245, 158, 11, 0.4);
    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.08);
  }

  .sub-card.card-acknowledged {
    border-color: rgba(34, 197, 94, 0.3);
  }

  .sub-card:hover {
    border-color: color-mix(in srgb, var(--brand-primary) 40%, var(--brand-border));
    transform: translateY(-1px);
  }

  .sub-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    padding: 0.85rem 1rem;
    background: var(--brand-surface-subtle);
    border-bottom: 1px solid var(--brand-border);
  }

  .slot-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .slot-hour {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--brand-primary);
    white-space: nowrap;
  }

  .header-badges {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .date-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    color: var(--brand-text-muted);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    line-height: 1.25;
  }

  .status-badge {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    background: rgba(245, 158, 11, 0.12);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.3);
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    line-height: 1.25;
  }

  :global([data-theme="dark"]) .status-badge {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.16);
    border-color: rgba(245, 158, 11, 0.4);
  }

  .status-badge.badge-confirmed {
    background: rgba(34, 197, 94, 0.12);
    color: #16a34a;
    border-color: rgba(34, 197, 94, 0.3);
  }

  :global([data-theme="dark"]) .status-badge.badge-confirmed {
    color: #4ade80;
    background: rgba(34, 197, 94, 0.16);
    border-color: rgba(34, 197, 94, 0.4);
  }

  @container (max-width: 360px) {
    .sub-card-header {
      padding: 0.75rem 0.85rem;
      gap: 0.45rem;
    }

    .header-badges {
      width: 100%;
      justify-content: flex-start;
      gap: 0.35rem 0.5rem;
    }
  }

  @container (max-width: 280px) {
    .slot-hour {
      font-size: 0.925rem;
    }

    .date-badge,
    .status-badge {
      font-size: 0.68rem;
      padding: 0.18rem 0.45rem;
    }
  }

  .sub-details {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  .detail-label {
    color: var(--brand-text-muted);
    font-weight: 500;
  }

  .detail-value {
    color: var(--brand-text);
    font-weight: 600;
    text-align: right;
  }

  .detail-value.class-value {
    font-weight: 700;
    color: var(--brand-text);
  }

  .teacher-absent {
    color: #ef4444;
  }

  .tipologia-tag {
    text-transform: capitalize;
  }

  .note-box {
    margin-top: 0.35rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    background: var(--brand-surface-subtle);
    border-left: 3px solid var(--brand-primary);
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.82rem;
  }

  .note-box.note-docenti {
    border-left-color: #f59e0b;
    background: rgba(245, 158, 11, 0.06);
  }

  .note-box.note-studenti {
    border-left-color: #3b82f6;
    background: rgba(59, 130, 246, 0.06);
  }

  .note-label {
    font-weight: 700;
    color: var(--brand-text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
  }

  .note-body {
    color: var(--brand-text);
    line-height: 1.35;
  }

  .item-error-msg {
    margin-top: 0.35rem;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .sub-card-footer {
    padding: 0.85rem 1rem;
    background: var(--brand-surface-subtle);
    border-top: 1px solid var(--brand-border);
  }

  .ack-confirmed {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #16a34a;
  }

  :global([data-theme="dark"]) .ack-confirmed {
    color: #4ade80;
  }

  .ack-confirmed-meta {
    display: flex;
    flex-direction: column;
  }

  .ack-title {
    font-size: 0.85rem;
    font-weight: 700;
  }

  .ack-timestamp {
    font-size: 0.75rem;
    color: var(--brand-text-muted);
  }

  .ack-action-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .btn-acknowledge {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 700;
    background: var(--brand-primary);
    color: white;
    border: none;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.1s ease;
  }

  .btn-acknowledge:hover:not(:disabled) {
    background: var(--brand-primary-hover);
    transform: translateY(-1px);
  }

  .btn-acknowledge:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .button-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .empty-state-card {
    text-align: center;
    padding: 3rem 1.5rem;
    background: var(--brand-surface-card);
    border: 1px dashed var(--brand-border);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .empty-state-card h3 {
    margin: 0;
    font-size: 1.15rem;
    color: var(--brand-text);
  }

  .empty-state-card p {
    color: var(--brand-text-muted);
    margin: 0;
    font-size: 0.9rem;
    max-width: 420px;
    line-height: 1.4;
  }

  .login-link-btn {
    margin-top: 1rem;
    display: inline-block;
    padding: 0.6rem 1.35rem;
    background: var(--brand-primary);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
  }
</style>
