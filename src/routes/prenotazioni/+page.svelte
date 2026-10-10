<script>
  import { onMount } from "svelte";
  import { isTeacher } from "$lib/stores.js";

  let copiedItemId = null;
  let copyTimeout = null;
  let canShare = false;

  const bookingItems = [
    {
      id: "sportello-psicologico",
      name: "Sportello Psicologico",
      handle: "Google Forms • Ascolto e supporto",
      badge: "Studenti & Docenti",
      url: "https://forms.gle/UPLBbEKaK56fpDaL6",
      description:
        "Modulo per la prenotazione di un colloquio presso lo sportello di ascolto e supporto psicologico dell'istituto, accessibile a studenti e docenti.",
      actionLabel: "Prenota Sportello",
      teacherOnly: false,
      themeColor: "#0d9488",
      bgTint: "rgba(13, 148, 136, 0.1)",
      borderTint: "rgba(13, 148, 136, 0.25)",
      textColor: "#0d9488",
      icon: "psychology"
    },
    {
      id: "portatili-comodato",
      name: "Portatili in comodato d'uso",
      handle: "Google Forms • Dotazioni didattiche",
      badge: "Solo Docenti",
      url: "https://forms.gle/NzWrea6g8ZDpwCQ8A",
      description:
        "Modulo riservato al personale docente per la richiesta di notebook e computer portatili in comodato d'uso.",
      actionLabel: "Richiedi Portatile",
      teacherOnly: true,
      themeColor: "#2563eb",
      bgTint: "rgba(37, 99, 235, 0.1)",
      borderTint: "rgba(37, 99, 235, 0.25)",
      textColor: "#2563eb",
      icon: "laptop"
    }
  ];

  $: visibleBookings = bookingItems.filter((item) => !item.teacherOnly || $isTeacher);

  onMount(() => {
    canShare = typeof navigator !== "undefined" && !!navigator.share;
  });

  async function copyLink(item) {
    try {
      await navigator.clipboard.writeText(item.url);
      copiedItemId = item.id;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copiedItemId = null;
      }, 2000);
    } catch (e) {
      console.error("Copia fallita", e);
    }
  }

  async function shareItem(item) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.name} - Liceo Cortese`,
          text: `${item.name} (${item.handle})`,
          url: item.url
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Errore condivisione:", err);
        }
      }
    }
  }
</script>

<svelte:head>
  <title>Prenotazioni - WAY Cortese</title>
</svelte:head>

<div class="social-page">
  <!-- Header Intro Card -->
  <header class="social-intro-card">
    <div class="intro-badge-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <path d="m9 16 2 2 4-4"></path>
      </svg>
    </div>
    <h1 class="page-title">Prenotazioni e Moduli</h1>
    <p class="page-subtitle">
      Compila i moduli ufficiali del <strong>Liceo Scientifico Nino Cortese</strong> per prenotare lo sportello d'ascolto o richiedere dispositivi didattici.
    </p>
  </header>

  <!-- Bookings Cards Grid -->
  <div class="social-grid" role="list" aria-label="Moduli di prenotazione del Liceo Cortese">
    {#each visibleBookings as item (item.id)}
      <article
        class="social-card {item.id}-card"
        role="listitem"
        style="--channel-color: {item.themeColor}; --channel-bg: {item.bgTint}; --channel-border: {item.borderTint}; --channel-text: {item.textColor};"
      >
        <div class="card-main">
          <div class="card-header">
            <div class="platform-icon-wrap" aria-hidden="true">
              {#if item.icon === "psychology"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <path d="M12 7.5c-.9-1-2.5-1-3.4 0-.9.9-.9 2.4 0 3.3l3.4 3.2 3.4-3.2c.9-.9.9-2.4 0-3.3-.9-1-2.5-1-3.4 0z"></path>
                </svg>
              {:else if item.icon === "laptop"}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="12" rx="2" ry="2"></rect>
                  <line x1="2" y1="20" x2="22" y2="20"></line>
                </svg>
              {/if}
            </div>

            <div class="platform-meta">
              <div class="name-row">
                <span class="platform-name">{item.name}</span>
                <span class="platform-badge">{item.badge}</span>
              </div>
              <span class="platform-handle">{item.handle}</span>
            </div>
          </div>

          <p class="platform-description">{item.description}</p>
        </div>

        <!-- Action Row -->
        <div class="card-actions">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-visit"
            aria-label="Apri modulo {item.name} (si apre in una nuova scheda)"
          >
            <span>{item.actionLabel}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>

          <div class="utility-actions">
            {#if canShare}
              <button
                type="button"
                class="btn-icon"
                title="Condividi modulo {item.name}"
                aria-label="Condividi link {item.name}"
                on:click={() => shareItem(item)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            {/if}

            <button
              type="button"
              class="btn-icon"
              class:copied={copiedItemId === item.id}
              title={copiedItemId === item.id ? "Link copiato!" : "Copia link"}
              aria-label={copiedItemId === item.id ? "Link copiato negli appunti" : "Copia link di " + item.name}
              on:click={() => copyLink(item)}
            >
              {#if copiedItemId === item.id}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              {/if}
            </button>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .social-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fade-in 0.2s ease-out;
    padding-bottom: 1rem;
    width: 100%;
  }

  .social-intro-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 16px;
    padding: 1.5rem 1.25rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  }

  .intro-badge-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.25rem;
  }

  .page-title {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--brand-text-muted);
    margin: 0;
    max-width: 540px;
    line-height: 1.45;
  }

  .social-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }

  @media (min-width: 640px) {
    .social-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.15rem;
    }

    .social-intro-card {
      padding: 2rem 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
    }
  }

  .social-card {
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    padding: 1.15rem 1.1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.15rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
    box-sizing: border-box;
  }

  .social-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    border-color: var(--channel-border);
  }

  .card-main {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .platform-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--channel-bg);
    color: var(--channel-text);
    border: 1px solid var(--channel-border);
    transition: transform 0.2s ease;
  }

  .social-card:hover .platform-icon-wrap {
    transform: scale(1.05);
  }

  .platform-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .platform-name {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--brand-text);
    line-height: 1.2;
  }

  .platform-badge {
    font-size: 0.675rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background: var(--channel-bg);
    color: var(--channel-text);
    border: 1px solid var(--channel-border);
    white-space: nowrap;
  }

  .platform-handle {
    font-size: 0.8rem;
    color: var(--brand-text-muted);
    font-weight: 500;
    margin-top: 0.15rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .platform-description {
    font-size: 0.85rem;
    color: var(--brand-text-muted);
    line-height: 1.45;
    margin: 0;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.65rem;
    border-top: 1px solid var(--brand-border);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.6rem 0.9rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    margin: 0;
    box-sizing: border-box;
  }

  .btn-visit {
    flex: 1;
    background: var(--brand-surface-subtle);
    border: 1.5px solid var(--brand-border);
    color: var(--brand-text);
  }

  .btn-visit:hover {
    background: var(--channel-color, var(--brand-primary));
    border-color: var(--channel-color, var(--brand-primary));
    color: #ffffff;
    text-decoration: none;
  }

  .utility-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .btn-icon {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--brand-surface-subtle);
    border: 1.5px solid var(--brand-border);
    color: var(--brand-text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    margin: 0;
  }

  .btn-icon:hover {
    background: var(--brand-surface-card);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .btn-icon.copied {
    background: #10b981;
    border-color: #10b981;
    color: #ffffff;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
