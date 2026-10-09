<script>
  import { userEmail, notificationPermission, notificationsEnabled } from "$lib/stores.js";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { enableNotifications } from "$lib/notifications.js";
  import { getTodayDate } from "$lib/utils.js";
  import { base } from "$app/paths";

  let sostituzioni = [];
  let error = null;
  let interval;

  $: sostituzioniOggi = sostituzioni.filter(
    (s) =>
      s.data >= getTodayDate() &&
      s.stato === "pubblicata" &&
      s.presaVisione?.stato &&
      s.presaVisione.stato !== "non_inviata" &&
      s.presaVisione.stato !== "fallita",
  );

  const API_URL = (
    import.meta.env.VITE_API_URL ||
    "https://www.liceoscientificocortese.edu.it/app/orario/api/v0"
  ).replace(/\/+$/, "");

  async function fetchSostituzioni() {
    if (!$userEmail) return;

    error = null;
    try {
      const response = await fetch(
        `${API_URL}/sostituzioni?email=${encodeURIComponent($userEmail)}`,
      );
      const data = await response.json();

      if (data && data.substitutions) {
        sostituzioni = data.substitutions;
      } else {
        error = "Errore nel recupero dei dati";
      }
    } catch (err) {
      error = "Errore di connessione al server";
      console.error("Errore fetch sostituzioni:", err);
    }
  }

  async function handleEnableNotifications() {
    await enableNotifications();
  }

  onMount(() => {
    if (!$userEmail) {
      goto(base || "/");
    } else {
      fetchSostituzioni();
      interval = setInterval(fetchSostituzioni, 60000);
    }
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Sostituzioni - WAY Cortese</title>
</svelte:head>

<div class="sostituzioni-page">
  {#if $userEmail}
    <!-- Notification Banner if not enabled -->
    {#if !$notificationPermission || !$notificationsEnabled}
      <div class="banner-card notification-banner">
        <div class="banner-icon-wrap" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <div class="banner-content">
          <h3 class="banner-title">Abilita le notifiche push</h3>
          <p class="banner-text">
            Ricevi un avviso immediato non appena ti viene assegnata una nuova sostituzione da confermare.
          </p>
          <button type="button" on:click={handleEnableNotifications} class="banner-action-btn">
            Attiva notifiche
          </button>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="status-banner error">
        <span>{error}</span>
        <button type="button" on:click={fetchSostituzioni} class="retry-btn">Riprova</button>
      </div>
    {/if}

    <section class="section-container">
      <div class="section-header">
        <h2 class="section-heading">Sostituzioni di oggi</h2>
        <span class="count-pill">{sostituzioniOggi.length}</span>
      </div>

      {#if sostituzioniOggi.length > 0}
        <div class="cards-grid">
          {#each sostituzioniOggi as sostituzione}
            <div class="sub-card">
              <div class="sub-card-header">
                <div class="slot-info">
                  <span class="slot-hour">{sostituzione.ora}</span>
                  <span class="slot-class">Classe {sostituzione.classe?.nome || sostituzione.classe}</span>
                </div>
                <div class="status-badge" class:badge-sent={sostituzione.presaVisione?.stato === "inviata"}>
                  {sostituzione.presaVisione?.stato || "assegnata"}
                </div>
              </div>

              <div class="sub-details">
                <div class="detail-row">
                  <span class="detail-label">Aula:</span>
                  <span class="detail-value">{sostituzione.aula?.nome || sostituzione.aula || "-"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Docente assente:</span>
                  <span class="detail-value teacher-absent">{sostituzione.docenteAssente?.nome || sostituzione.docenteAssente || "-"}</span>
                </div>
                {#if sostituzione.note}
                  <div class="detail-row note-row">
                    <span class="detail-label">Note:</span>
                    <span class="detail-value">{sostituzione.note}</span>
                  </div>
                {/if}
              </div>

              {#if sostituzione.presaVisione?.stato === "inviata"}
                <div class="sub-card-footer info-footer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Controlla la casella di posta per la conferma</span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state-card">
          <div class="empty-icon" aria-hidden="true">🎉</div>
          <h3>Nessuna sostituzione</h3>
          <p>Oggi non hai ore di sostituzione assegnate.</p>
        </div>
      {/if}
    </section>
  {:else}
    <div class="empty-state-card">
      <h3>Accesso riservato</h3>
      <p>Effettua l'accesso come docente per consultare le sostituzioni.</p>
      <a href="{base}/signin" class="login-link-btn">Vai al login</a>
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
    gap: 0.5rem;
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

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  }

  .sub-card:hover {
    border-color: color-mix(in srgb, var(--brand-primary) 40%, var(--brand-border));
    transform: translateY(-1px);
  }

  .sub-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    background: var(--brand-surface-subtle);
    border-bottom: 1px solid var(--brand-border);
  }

  .slot-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .slot-hour {
    font-size: 1rem;
    font-weight: 700;
    color: var(--brand-primary);
  }

  .slot-class {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--brand-text);
  }

  .status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
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

  .teacher-absent {
    color: #ef4444;
  }

  .sub-card-footer {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    font-size: 0.75rem;
    background: var(--brand-surface-subtle);
    border-top: 1px solid var(--brand-border);
  }

  .info-footer {
    color: var(--brand-text-muted);
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
  }

  .empty-state-card p {
    color: var(--brand-text-muted);
    margin: 0;
    font-size: 0.9rem;
  }

  .login-link-btn {
    margin-top: 1rem;
    display: inline-block;
    padding: 0.5rem 1.25rem;
    background: var(--brand-primary);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.875rem;
  }
</style>
